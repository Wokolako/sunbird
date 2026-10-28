import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  AccountStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  ReservationSource,
  ReservationStatus,
  RoomUnitStatus,
  StaffRole,
  StoragePurpose,
  UserRole,
} from "@prisma/client";
import { commercialPolicy } from "../lib/production/config";
import { uploadObject } from "../lib/storage/r2";

type Row = Record<string, any>;
const sourcePath =
  process.env.SQLITE_SOURCE_PATH || path.join(process.cwd(), "data", "finder.sqlite");
const defaultCountry = process.env.MIGRATION_DEFAULT_COUNTRY || "Malawi";
const migrateBlobs = process.env.MIGRATE_BLOBS !== "false";
const prisma = new PrismaClient();
const sqlite = new DatabaseSync(sourcePath, { readOnly: true });

const rows = (table: string) => {
  const exists = sqlite
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  return exists ? (sqlite.prepare(`SELECT * FROM "${table}"`).all() as Row[]) : [];
};
const jsonArray = (value: unknown): string[] => {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};
const date = (value: unknown) => new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
const role = (value: unknown) =>
  ({ guest: UserRole.GUEST, owner: UserRole.OWNER, admin: UserRole.ADMIN })[
    String(value)
  ] || UserRole.GUEST;
const reservationStatus = (value: unknown) =>
  ({
    pending: ReservationStatus.REQUESTED,
    confirmed: ReservationStatus.CONFIRMED,
    checked_in: ReservationStatus.CHECKED_IN,
    completed: ReservationStatus.CHECKED_OUT,
    cancelled: ReservationStatus.CANCELLED,
    declined: ReservationStatus.DECLINED,
  })[String(value)] || ReservationStatus.REQUESTED;
const propertyType = (value: unknown) =>
  ({ hotel: PropertyType.HOTEL, lodge: PropertyType.LODGE, guesthouse: PropertyType.GUESTHOUSE, short_term_let: PropertyType.SHORT_TERM_LET })[String(value).toLowerCase()] || PropertyType.LODGE;

async function main() {
  if (!existsSync(sourcePath)) throw new Error(`SQLite source not found: ${sourcePath}`);
  console.log(`Migrating ${sourcePath} to PostgreSQL...`);

  for (const user of rows("users")) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        clerkUserId: user.clerk_user_id || undefined,
        name: user.name,
        email: String(user.email).toLowerCase(),
        phone: user.phone || null,
        role: role(user.role),
        accountStatus:
          user.status === "suspended" ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE,
      },
      create: {
        id: user.id,
        clerkUserId: user.clerk_user_id || undefined,
        name: user.name,
        email: String(user.email).toLowerCase(),
        phone: user.phone || null,
        passwordHash: user.password_hash || null,
        role: role(user.role),
        accountStatus:
          user.status === "suspended" ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE,
        createdAt: user.created_at ? new Date(user.created_at) : undefined,
      },
    });
  }

  const organisations = rows("organisations");
  for (const organisation of organisations) {
    await prisma.organisation.upsert({
      where: { id: organisation.id },
      update: {
        name: organisation.name,
        status: String(organisation.status || "pending").toUpperCase(),
        verificationReason: organisation.verification_reason || null,
      },
      create: {
        id: organisation.id,
        name: organisation.name,
        type: organisation.type || "lodge",
        registrationNumber:
          organisation.registration_number || `LEGACY-${organisation.id}`,
        licenceNumber: organisation.licence_number || null,
        phone: organisation.phone || "",
        email: organisation.email || "",
        address: organisation.address || "",
        status: String(organisation.status || "pending").toUpperCase(),
        verificationReason: organisation.verification_reason || null,
        createdAt: organisation.created_at
          ? new Date(organisation.created_at)
          : undefined,
        memberships: {
          create: {
            id: `org_member_${organisation.id}_${organisation.owner_id}`,
            userId: organisation.owner_id,
            role: StaffRole.OWNER,
          },
        },
      },
    });
  }

  const propertyRows = rows("properties");
  for (const property of propertyRows) {
    const address = String(property.address || "Address pending");
    const created = await prisma.property.upsert({
      where: { id: property.id },
      update: {
        name: property.name,
        description: property.description || "Description pending",
        address,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      create: {
        id: property.id,
        organisationId: property.organisation_id,
        name: property.name,
        slug: `${slug(property.name)}-${String(property.id).slice(-8)}`,
        type: propertyType(property.type),
        status:
          property.status === "published"
            ? PropertyStatus.APPROVED
            : property.status === "paused"
              ? PropertyStatus.SUSPENDED
              : PropertyStatus.PENDING,
        description: property.description || "Description pending",
        address,
        city: address.split(",")[0].trim() || "Unknown",
        stateOrRegion: "",
        country: defaultCountry,
        latitude: property.latitude,
        longitude: property.longitude,
        rules: property.house_rules || null,
        cancellationPolicy: property.cancellation_policy || null,
        checkInTime: property.check_in || "14:00",
        checkOutTime: property.check_out || "10:00",
        createdAt: property.created_at ? new Date(property.created_at) : undefined,
      },
    });
    const organisation = organisations.find(
      (item) => item.id === property.organisation_id
    );
    if (organisation)
      await prisma.propertyStaff.upsert({
        where: {
          propertyId_userId: {
            propertyId: property.id,
            userId: organisation.owner_id,
          },
        },
        update: { active: true, role: StaffRole.OWNER },
        create: {
          propertyId: property.id,
          userId: organisation.owner_id,
          role: StaffRole.OWNER,
        },
      });
    const photos = jsonArray(property.photos);
    for (const [index, url] of photos.entries()) {
      await prisma.propertyPhoto.upsert({
        where: { id: `legacy_photo_${property.id}_${index}` },
        update: { url, displayOrder: index, isHero: index === 0 },
        create: {
          id: `legacy_photo_${property.id}_${index}`,
          propertyId: created.id,
          url,
          displayOrder: index,
          isHero: index === 0,
        },
      });
    }
    const policy = commercialPolicy();
    await prisma.cancellationPolicy.upsert({
      where: { propertyId: property.id },
      update: {},
      create: {
        propertyId: property.id,
        freeCancellationHours: policy.freeCancellationHours,
        partialRefundHours: policy.partialRefundHours,
        partialRefundBps: policy.partialRefundBps,
      },
    });
    await prisma.commissionSetting.upsert({
      where: { propertyId: property.id },
      update: {},
      create: {
        propertyId: property.id,
        percentage: policy.commissionBps / 100,
        payoutSchedule:
          policy.payoutSchedule === "monthly"
            ? "MONTHLY"
            : policy.payoutSchedule === "bi_weekly"
              ? "BI_WEEKLY"
              : "WEEKLY",
        reserveDays: policy.reserveDays,
      },
    });
  }

  for (const room of rows("rooms")) {
    await prisma.roomCategory.upsert({
      where: { id: room.id },
      update: { name: room.name, basePrice: Number(room.nightly_rate_minor || 0) / 100 },
      create: {
        id: room.id,
        propertyId: room.property_id,
        name: room.name,
        slug: `${slug(room.name)}-${String(room.id).slice(-8)}`,
        description: room.name,
        capacity: Number(room.adult_capacity || 1) + Number(room.child_capacity || 0),
        maxAdults: Number(room.adult_capacity || 1),
        maxChildren: Number(room.child_capacity || 0),
        bedArrangement: room.beds || "Not specified",
        basePrice: Number(room.nightly_rate_minor || 0) / 100,
        amenities: jsonArray(room.amenities),
        createdAt: room.created_at ? new Date(room.created_at) : undefined,
      },
    });
  }

  for (const inventory of rows("availability")) {
    await prisma.roomInventory.upsert({
      where: {
        roomCategoryId_date: {
          roomCategoryId: inventory.room_id,
          date: date(inventory.night),
        },
      },
      update: {
        unitsAvailable: Number(inventory.units_open),
        closed: Boolean(inventory.closed),
      },
      create: {
        roomCategoryId: inventory.room_id,
        date: date(inventory.night),
        unitsAvailable: Number(inventory.units_open),
        closed: Boolean(inventory.closed),
      },
    });
  }

  for (const unit of rows("room_units")) {
    const room = rows("rooms").find((item) => item.id === unit.room_id);
    if (!room) continue;
    await prisma.roomUnit.upsert({
      where: { id: unit.id },
      update: { status: unitStatus(unit.status) },
      create: {
        id: unit.id,
        propertyId: room.property_id,
        roomCategoryId: unit.room_id,
        name: unit.label,
        floor: unit.floor || null,
        status: unitStatus(unit.status),
      },
    });
  }

  // Older records stored inventory only as rooms.units. Create stable physical units
  // when explicit PMS unit rows did not exist yet.
  for (const room of rows("rooms")) {
    const existing = await prisma.roomUnit.count({ where: { roomCategoryId: room.id } });
    const target = Math.max(1, Number(room.units || 1));
    for (let index = existing; index < target; index += 1)
      await prisma.roomUnit.create({ data: { id: `legacy_unit_${room.id}_${index + 1}`, propertyId: room.property_id, roomCategoryId: room.id, name: `${room.name} ${index + 1}` } });
  }

  for (const member of rows("staff_members")) {
    const role = ({ manager: StaffRole.MANAGER, front_desk: StaffRole.FRONT_DESK, housekeeper: StaffRole.HOUSEKEEPER })[String(member.role)] || StaffRole.MANAGER;
    await prisma.propertyStaff.upsert({ where: { propertyId_userId: { propertyId: member.property_id, userId: member.user_id } }, update: { role, active: member.status !== "inactive" }, create: { id: member.id, propertyId: member.property_id, userId: member.user_id, role, active: member.status !== "inactive" } });
  }

  for (const plan of rows("rate_plans"))
    await prisma.ratePlan.upsert({ where: { id: plan.id }, update: { name: plan.name, minimumStay: Number(plan.minimum_stay || 1), taxBps: Number(plan.tax_bps || 0), serviceFee: Number(plan.service_fee_minor || 0) / 100, active: Boolean(plan.active) }, create: { id: plan.id, propertyId: plan.property_id, name: plan.name, minimumStay: Number(plan.minimum_stay || 1), taxBps: Number(plan.tax_bps || 0), serviceFee: Number(plan.service_fee_minor || 0) / 100, active: Boolean(plan.active), createdAt: plan.created_at ? new Date(plan.created_at) : undefined } });

  for (const rule of rows("rate_rules")) {
    const room = rows("rooms").find((item) => item.id === rule.room_id); if (!room) continue;
    await prisma.rateRule.upsert({ where: { id: rule.id }, update: { fixedPrice: Number(rule.nightly_rate_minor || 0) / 100 }, create: { id: rule.id, propertyId: room.property_id, roomCategoryId: rule.room_id, ratePlanId: rule.rate_plan_id, name: "Legacy rate", startDate: date(rule.start_date), endDate: date(rule.end_date), fixedPrice: Number(rule.nightly_rate_minor || 0) / 100 } });
  }

  for (const task of rows("operational_tasks"))
    await prisma.operationalTask.upsert({ where: { id: task.id }, update: { status: String(task.status || "open").toUpperCase() }, create: { id: task.id, propertyId: task.property_id, roomUnitId: task.room_unit_id || null, type: String(task.type || "maintenance").toUpperCase(), status: String(task.status || "open").toUpperCase(), note: task.note || "", assignedToId: task.assigned_to || null, dueAt: task.due_at ? new Date(task.due_at) : null, completedAt: task.completed_at ? new Date(task.completed_at) : null, createdAt: task.created_at ? new Date(task.created_at) : undefined } });

  for (const setting of rows("platform_settings")) {
    const value = setting.value === "true" ? true : setting.value === "false" ? false : setting.value;
    await prisma.platformSetting.upsert({ where: { key: setting.key }, update: { value }, create: { key: setting.key, value } });
  }

  for (const booking of rows("booking_requests")) {
    await prisma.reservation.upsert({
      where: { id: booking.id },
      update: { status: reservationStatus(booking.status) },
      create: {
        id: booking.id,
        referenceCode: `VR-${String(booking.id).slice(-10).toUpperCase()}`,
        propertyId: booking.property_id,
        roomCategoryId: booking.room_id,
        roomUnitId: booking.room_unit_id || null,
        guestId: booking.guest_id,
        status: reservationStatus(booking.status),
        source: ReservationSource.ONLINE,
        checkInDate: date(booking.check_in),
        checkOutDate: date(booking.check_out),
        adultsCount: Number(booking.guests || 1),
        unitsCount: Number(booking.rooms || 1),
        totalAmount: Number(booking.total_minor || 0) / 100,
        currency: "GBP",
        createdAt: booking.created_at ? new Date(booking.created_at) : undefined,
      },
    });
  }

  for (const payment of rows("payment_attempts")) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: { status: paymentStatus(payment.status) },
      create: {
        id: payment.id,
        reservationId: payment.booking_id,
        amount: Number(payment.amount_minor || 0) / 100,
        currency: String(payment.currency || "gbp").toUpperCase(),
        method: PaymentMethod.CREDIT_CARD,
        status: paymentStatus(payment.status),
        paymentType: PaymentType.FULL,
        checkoutSessionId: payment.stripe_session_id || null,
        providerPaymentId: payment.payment_intent_id || null,
        createdAt: payment.created_at ? new Date(payment.created_at) : undefined,
      },
    });
  }

  if (migrateBlobs) await migrateDocuments();
  console.log(
    "Migration complete. Run the verification script before switching traffic."
  );
}

async function migrateDocuments() {
  for (const document of rows("documents")) {
    const bytes = new Uint8Array(document.content);
    const uploaded = await uploadObject({
      folder: "verification",
      filename: document.filename,
      contentType: document.mime,
      body: bytes,
      private: true,
    });
    const objectId = `legacy_object_${document.id}`;
    await prisma.storedObject.upsert({
      where: { id: objectId },
      update: { key: uploaded.key },
      create: {
        id: objectId,
        key: uploaded.key,
        bucket: uploaded.bucket,
        purpose: StoragePurpose.VERIFICATION_DOCUMENT,
        contentType: uploaded.contentType,
        sizeBytes: BigInt(uploaded.sizeBytes),
        isPrivate: true,
        createdAt: document.created_at ? new Date(document.created_at) : undefined,
      },
    });
    await prisma.verificationDocument.upsert({
      where: { id: document.id },
      update: { objectId, filename: document.filename },
      create: {
        id: document.id,
        organisationId: document.organisation_id,
        objectId,
        kind: document.kind,
        filename: document.filename,
        createdAt: document.created_at ? new Date(document.created_at) : undefined,
      },
    });
  }
}

function slug(value: unknown) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function unitStatus(value: unknown) {
  return (
    {
      vacant: RoomUnitStatus.VACANT_CLEAN,
      dirty: RoomUnitStatus.VACANT_DIRTY,
      cleaning: RoomUnitStatus.CLEANING,
      occupied: RoomUnitStatus.OCCUPIED,
      maintenance: RoomUnitStatus.MAINTENANCE,
      blocked: RoomUnitStatus.BLOCKED,
    }[String(value)] || RoomUnitStatus.VACANT_CLEAN
  );
}

function paymentStatus(value: unknown) {
  return (
    {
      pending: PaymentStatus.PENDING,
      paid: PaymentStatus.COMPLETED,
      failed: PaymentStatus.FAILED,
      expired: PaymentStatus.FAILED,
      review_required: PaymentStatus.PROCESSING,
    }[String(value)] || PaymentStatus.PENDING
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
