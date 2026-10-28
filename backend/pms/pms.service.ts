import type { RoomUnitStatus, StaffRole } from "@prisma/client";
import type { AuthUser } from "../auth/auth.service";
import { audit, dateOnly, dateText, moneyMinor, prisma, propertyAccess, slugify, staffRole } from "../data/prisma";
import { queueNotification } from "../../lib/notifications/service";
import { staffInvitationTemplate } from "../../lib/notifications/templates";

const DAY = 86_400_000;
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const days = (start: string, end: string, inclusive = false) => {
  const count = Math.floor((dateOnly(end).getTime() - dateOnly(start).getTime()) / DAY) + (inclusive ? 1 : 0);
  return Array.from({ length: Math.max(0, count) }, (_, index) => new Date(dateOnly(start).getTime() + index * DAY));
};

export type StaffPermissions = {
  canManageRates: boolean;
  canManageInventory: boolean;
  canAssignRooms: boolean;
  canManageTasks: boolean;
  canViewFinancials: boolean;
  canMessageGuests: boolean;
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, StaffPermissions> = {
  owner: {
    canManageRates: true,
    canManageInventory: true,
    canAssignRooms: true,
    canManageTasks: true,
    canViewFinancials: true,
    canMessageGuests: true,
  },
  manager: {
    canManageRates: true,
    canManageInventory: true,
    canAssignRooms: true,
    canManageTasks: true,
    canViewFinancials: true,
    canMessageGuests: true,
  },
  front_desk: {
    canManageRates: false,
    canManageInventory: true,
    canAssignRooms: true,
    canManageTasks: true,
    canViewFinancials: false,
    canMessageGuests: true,
  },
  housekeeper: {
    canManageRates: false,
    canManageInventory: false,
    canAssignRooms: false,
    canManageTasks: true,
    canViewFinancials: false,
    canMessageGuests: false,
  },
  maintenance: {
    canManageRates: false,
    canManageInventory: false,
    canAssignRooms: false,
    canManageTasks: true,
    canViewFinancials: false,
    canMessageGuests: false,
  },
};

export async function getStaffPermissions(propertyId: string, userId: string, role: string): Promise<StaffPermissions> {
  const normalizedRole = (role || "manager").toLowerCase();
  const defaults = DEFAULT_ROLE_PERMISSIONS[normalizedRole] || DEFAULT_ROLE_PERMISSIONS.manager;
  try {
    const key = `staff_perms:${propertyId}:${userId}`;
    const setting = await prisma.platformSetting.findUnique({ where: { key } });
    if (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)) {
      return { ...defaults, ...(setting.value as Record<string, boolean>) };
    }
  } catch {}
  return defaults;
}

export async function hasStaffPermission(
  user: AuthUser,
  propertyId: string,
  permission: keyof StaffPermissions
): Promise<boolean> {
  if (user.role === "admin") return true;
  const access = await propertyAccess(user, propertyId);
  if (!access) return false;
  if (access.role === "owner" || access.role === "admin") return true;
  const perms = await getStaffPermissions(propertyId, user.id, access.role);
  return Boolean(perms[permission]);
}

export async function updateStaffPermissions(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  const targetUserId = String(body.userId || "");
  const permissions = (body.permissions || {}) as Partial<StaffPermissions>;
  if (!(await authorize(user, propertyId, ["owner", "manager"]))) return null;

  const staff = await prisma.propertyStaff.findUnique({
    where: { propertyId_userId: { propertyId, userId: targetUserId } },
  });
  if (!staff) throw new Error("Staff member not found on this property.");
  if (staff.role === "OWNER") throw new Error("Owner permissions cannot be restricted.");

  const current = await getStaffPermissions(propertyId, targetUserId, staff.role);
  const updated: StaffPermissions = {
    canManageRates: permissions.canManageRates ?? current.canManageRates,
    canManageInventory: permissions.canManageInventory ?? current.canManageInventory,
    canAssignRooms: permissions.canAssignRooms ?? current.canAssignRooms,
    canManageTasks: permissions.canManageTasks ?? current.canManageTasks,
    canViewFinancials: permissions.canViewFinancials ?? current.canViewFinancials,
    canMessageGuests: permissions.canMessageGuests ?? current.canMessageGuests,
  };

  const key = `staff_perms:${propertyId}:${targetUserId}`;
  await prisma.platformSetting.upsert({
    where: { key },
    update: { value: updated },
    create: { key, value: updated },
  });

  await audit(user, "staff_permissions", staff.id, "update", { propertyId, userId: targetUserId, permissions: updated });
  return { ok: true, permissions: updated };
}

export async function authorize(user: AuthUser, propertyId: string, roles?: string[]) {
  return propertyAccess(user, propertyId, (roles?.map((role) => staffRole(role)) || undefined) as StaffRole[] | undefined);
}

async function quoteRoom(roomId: string, start: string, end: string, units: number) {
  const room = await prisma.roomCategory.findUnique({ where: { id: roomId } });
  if (!room) throw new Error("Room type not found.");
  const nights = days(start, end);
  if (!nights.length) throw new Error("At least one night is required.");
  const rules = await prisma.rateRule.findMany({
    where: { propertyId: room.propertyId, OR: [{ roomCategoryId: roomId }, { roomCategoryId: null }], startDate: { lte: dateOnly(end) }, endDate: { gte: dateOnly(start) } },
    include: { ratePlan: true }, orderBy: { createdAt: "desc" },
  });
  let subtotalMinor = 0;
  let minimumStay = 1;
  let taxBps = 0;
  let serviceFeeMinor = 0;
  for (const night of nights) {
    const rule = rules.find((item) => (!item.startDate || item.startDate <= night) && (!item.endDate || item.endDate >= night) && (!item.daysOfWeek.length || item.daysOfWeek.includes(night.getUTCDay())));
    subtotalMinor += moneyMinor(rule?.fixedPrice ?? room.basePrice) * units;
    if (rule) minimumStay = Math.max(minimumStay, rule.minStayDays, rule.ratePlan?.minimumStay ?? 1);
    if (rule?.ratePlan) { taxBps = rule.ratePlan.taxBps; serviceFeeMinor = moneyMinor(rule.ratePlan.serviceFee) * units; }
  }
  if (nights.length < minimumStay) throw new Error(`This rate requires at least ${minimumStay} nights.`);
  const taxMinor = Math.round(subtotalMinor * taxBps / 10_000);
  return { nights: nights.length, subtotalMinor, taxMinor, serviceFeeMinor, totalMinor: subtotalMinor + taxMinor + serviceFeeMinor, minimumStay };
}

export async function dashboard(user: AuthUser, propertyId: string) {
  const permission = await authorize(user, propertyId);
  if (!permission) return null;
  const today = dateOnly(new Date().toISOString().slice(0, 10));
  const end = new Date(today.getTime() + 30 * DAY);
  const [reservations, units, tasks, supply, ratePlans, rateRules, staff] = await Promise.all([
    prisma.reservation.findMany({ where: { propertyId, status: { in: ["CONFIRMED", "UPCOMING", "CHECKED_IN", "CHECKED_OUT"] }, checkInDate: { lt: end }, checkOutDate: { gt: today } }, include: { guest: true, roomCategory: true, roomUnit: true }, orderBy: { checkInDate: "asc" } }),
    prisma.roomUnit.findMany({ where: { propertyId }, include: { roomCategory: true }, orderBy: [{ roomCategory: { name: "asc" } }, { name: "asc" }] }),
    prisma.operationalTask.findMany({ where: { propertyId, status: { not: "COMPLETED" } }, include: { roomUnit: true }, orderBy: { createdAt: "desc" } }),
    prisma.roomUnit.count({ where: { propertyId } }),
    prisma.ratePlan.findMany({ where: { propertyId, active: true }, orderBy: { name: "asc" } }),
    prisma.rateRule.findMany({ where: { propertyId }, include: { ratePlan: true, roomCategory: true }, orderBy: { startDate: "desc" }, take: 100 }),
    prisma.propertyStaff.findMany({ where: { propertyId, active: true }, include: { user: true }, orderBy: { assignedAt: "asc" } }),
  ]);
  const roomNights = reservations.reduce((total, booking) => total + days(dateText(booking.checkInDate < today ? today : booking.checkInDate), dateText(booking.checkOutDate > end ? end : booking.checkOutDate)).length * booking.unitsCount, 0);
  const revenueMinor = reservations.reduce((total, booking) => total + moneyMinor(booking.totalAmount), 0);
  const availableRoomNights = supply * 30;
  const shapeBooking = (booking: typeof reservations[number]) => ({ ...booking, guest_name: booking.guest.name, room_name: booking.roomCategory.name, room_id: booking.roomCategoryId, room_unit_id: booking.roomUnitId, room_unit_name: booking.roomUnit?.name, check_in: dateText(booking.checkInDate), check_out: dateText(booking.checkOutDate), total_minor: moneyMinor(booking.totalAmount), status: booking.status.toLowerCase() });
  return {
    permission,
    report: { bookings: reservations.length, revenueMinor, roomNights, availableRoomNights, occupancyPercent: availableRoomNights ? Number((roomNights / availableRoomNights * 100).toFixed(2)) : 0, adrMinor: roomNights ? Math.round(revenueMinor / roomNights) : 0, revparMinor: availableRoomNights ? Math.round(revenueMinor / availableRoomNights) : 0 },
    arrivals: reservations.filter((item) => +item.checkInDate === +today).map(shapeBooking),
    departures: reservations.filter((item) => +item.checkOutDate === +today && item.status === "CHECKED_IN").map(shapeBooking),
    units: units.map((unit) => ({ ...unit, label: unit.name, room_id: unit.roomCategoryId, room_name: unit.roomCategory.name, status: unit.status.toLowerCase() })),
    tasks: tasks.map((task) => ({ ...task, room_unit_id: task.roomUnitId, unit_label: task.roomUnit?.name, assigned_to: task.assignedToId, due_at: task.dueAt, completed_at: task.completedAt, status: task.status.toLowerCase(), type: task.type.toLowerCase() })),
    reservations: reservations.map(shapeBooking),
    ratePlans: ratePlans.map((plan) => ({ ...plan, minimum_stay: plan.minimumStay, tax_bps: plan.taxBps, service_fee_minor: moneyMinor(plan.serviceFee) })),
    rateRules: rateRules.map((rule) => ({ ...rule, room_name: rule.roomCategory?.name, rate_plan_name: rule.ratePlan?.name, start_date: rule.startDate && dateText(rule.startDate), end_date: rule.endDate && dateText(rule.endDate), nightly_rate_minor: rule.fixedPrice ? moneyMinor(rule.fixedPrice) : null })),
    staff: await Promise.all(
      staff.map(async (member) => ({
        id: member.id,
        user_id: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role.toLowerCase(),
        active: member.active,
        permissions: await getStaffPermissions(propertyId, member.userId, member.role),
      }))
    ),
  };
}

export async function calendar(user: AuthUser, propertyId: string, roomId: string, start: string, end: string) {
  if (!(await authorize(user, propertyId)) || !validDate(start) || !validDate(end) || end < start) return null;

  // Single room mode
  if (roomId && roomId !== "all") {
    const room = await prisma.roomCategory.findFirst({ where: { id: roomId, propertyId }, include: { roomUnits: { select: { id: true } } } });
    if (!room) return null;
    const [availability, rates] = await Promise.all([
      prisma.roomInventory.findMany({ where: { roomCategoryId: roomId, date: { gte: dateOnly(start), lte: dateOnly(end) } }, orderBy: { date: "asc" } }),
      prisma.rateRule.findMany({ where: { roomCategoryId: roomId, startDate: { lte: dateOnly(end) }, endDate: { gte: dateOnly(start) } }, include: { ratePlan: true }, orderBy: { startDate: "asc" } }),
    ]);
    return {
      room: { ...room, units: room.roomUnits.length, nightly_rate_minor: moneyMinor(room.basePrice) },
      availability: availability.map((item) => ({ room_id: roomId, night: dateText(item.date), units_open: item.unitsAvailable, closed: item.closed ? 1 : 0 })),
      rates: rates.map((item) => ({ ...item, rate_plan_name: item.ratePlan?.name, minimum_stay: item.ratePlan?.minimumStay ?? item.minStayDays, tax_bps: item.ratePlan?.taxBps ?? 0, service_fee_minor: item.ratePlan ? moneyMinor(item.ratePlan.serviceFee) : 0, nightly_rate_minor: item.fixedPrice ? moneyMinor(item.fixedPrice) : null, start_date: item.startDate && dateText(item.startDate), end_date: item.endDate && dateText(item.endDate) })),
    };
  }

  // Multi-room matrix mode
  const roomCategories = await prisma.roomCategory.findMany({
    where: { propertyId },
    include: { roomUnits: { select: { id: true, name: true, status: true } } },
    orderBy: { name: "asc" },
  });

  const [inventories, rules, reservations] = await Promise.all([
    prisma.roomInventory.findMany({
      where: {
        roomCategoryId: { in: roomCategories.map((r) => r.id) },
        date: { gte: dateOnly(start), lte: dateOnly(end) },
      },
      orderBy: { date: "asc" },
    }),
    prisma.rateRule.findMany({
      where: {
        propertyId,
        startDate: { lte: dateOnly(end) },
        endDate: { gte: dateOnly(start) },
      },
      include: { ratePlan: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "UPCOMING", "CHECKED_IN"] },
        checkInDate: { lte: dateOnly(end) },
        checkOutDate: { gte: dateOnly(start) },
      },
      include: { guest: { select: { name: true, email: true } }, roomUnit: true },
    }),
  ]);

  return {
    propertyId,
    start,
    end,
    rooms: roomCategories.map((rc) => {
      const roomInvs = inventories.filter((inv) => inv.roomCategoryId === rc.id);
      const roomRules = rules.filter((r) => r.roomCategoryId === rc.id || r.roomCategoryId === null);
      const roomBookings = reservations.filter((b) => b.roomCategoryId === rc.id);
      return {
        id: rc.id,
        name: rc.name,
        unitsCount: rc.roomUnits.length,
        basePriceMinor: moneyMinor(rc.basePrice),
        units: rc.roomUnits.map((u) => ({ id: u.id, name: u.name, status: u.status.toLowerCase() })),
        inventory: roomInvs.map((inv) => ({
          night: dateText(inv.date),
          unitsOpen: inv.unitsAvailable,
          closed: inv.closed,
        })),
        rateRules: roomRules.map((rr) => ({
          id: rr.id,
          name: rr.name,
          planName: rr.ratePlan?.name,
          startDate: rr.startDate && dateText(rr.startDate),
          endDate: rr.endDate && dateText(rr.endDate),
          priceMinor: rr.fixedPrice ? moneyMinor(rr.fixedPrice) : null,
        })),
        reservations: roomBookings.map((b) => ({
          id: b.id,
          referenceCode: b.referenceCode,
          guestName: b.guest.name || "Guest",
          checkIn: dateText(b.checkInDate),
          checkOut: dateText(b.checkOutDate),
          unitsCount: b.unitsCount,
          unitName: b.roomUnit?.name || null,
          status: b.status.toLowerCase(),
        })),
      };
    }),
  };
}

export async function createRoomType(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await authorize(user, propertyId, ["owner", "manager"]))) return null;
  const name = String(body.name || "").trim(), beds = String(body.beds || "").trim();
  const adults = Number(body.adults), children = Number(body.children || 0), units = Number(body.units), rate = Number(body.nightlyRate);
  if (!name || !beds || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(units) || units < 1 || !Number.isFinite(rate) || rate <= 0) throw new Error("Enter a name, beds, capacity, units, and nightly rate.");
  const room = await prisma.$transaction(async (tx) => {
    const created = await tx.roomCategory.create({ data: { propertyId, name, slug: `${slugify(name)}-${Date.now().toString(36)}`, description: String(body.description || ""), capacity: adults + children, maxAdults: adults, maxChildren: children, bedArrangement: beds, basePrice: rate, amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [] } });
    await tx.roomUnit.createMany({ data: Array.from({ length: units }, (_, index) => ({ propertyId, roomCategoryId: created.id, name: `${name} ${index + 1}` })) });
    await audit(user, "room", created.id, "create", { propertyId, name, units }, tx);
    return created;
  });
  return { id: room.id };
}

export async function createUnit(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await authorize(user, propertyId, ["owner", "manager"]))) return null;
  const roomId = String(body.roomId || ""), label = String(body.label || "").trim();
  if (!label || !(await prisma.roomCategory.findFirst({ where: { id: roomId, propertyId } }))) throw new Error("Choose a room type and unit label.");
  const unit = await prisma.roomUnit.create({ data: { propertyId, roomCategoryId: roomId, name: label, floor: String(body.floor || "").trim() || null } });
  await audit(user, "room_unit", unit.id, "create", { roomId, label });
  return { id: unit.id };
}

export async function updateAvailability(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageInventory"))) {
    throw new Error("You do not have permission to manage room availability.");
  }
  const roomId = String(body.roomId || ""), start = String(body.start || ""), end = String(body.end || "");
  const units = Number(body.unitsOpen), closed = body.closed === true || body.closed === "true";
  const room = await prisma.roomCategory.findFirst({ where: { id: roomId, propertyId }, include: { _count: { select: { roomUnits: true } } } });
  if (!room || !validDate(start) || !validDate(end) || end < start || !Number.isInteger(units) || units < 0 || units > room._count.roomUnits) throw new Error("Choose a room, dates, and an available unit count.");
  const range = days(start, end, true); if (range.length > 366) throw new Error("Availability updates are limited to 366 days.");
  await prisma.$transaction(async (tx) => {
    for (const date of range) await tx.roomInventory.upsert({ where: { roomCategoryId_date: { roomCategoryId: roomId, date } }, update: { unitsAvailable: units, closed }, create: { roomCategoryId: roomId, date, unitsAvailable: units, closed } });
    await audit(user, "availability", roomId, "range_update", { start, end, units, closed }, tx);
  });
  return { days: range.length };
}

export async function quickUpdateDay(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageInventory"))) {
    throw new Error("You do not have permission to update room availability.");
  }
  const roomId = String(body.roomId || "");
  const dateStr = String(body.date || "");
  if (!roomId || !validDate(dateStr)) throw new Error("Invalid room or date.");

  const room = await prisma.roomCategory.findFirst({
    where: { id: roomId, propertyId },
    include: { _count: { select: { roomUnits: true } } },
  });
  if (!room) throw new Error("Room type not found.");

  const units = body.unitsOpen !== undefined ? Number(body.unitsOpen) : undefined;
  const closed = body.closed === true || body.closed === "true";
  const date = dateOnly(dateStr);

  await prisma.roomInventory.upsert({
    where: { roomCategoryId_date: { roomCategoryId: roomId, date } },
    update: {
      ...(units !== undefined ? { unitsAvailable: Math.max(0, Math.min(units, room._count.roomUnits)) } : {}),
      closed,
    },
    create: {
      roomCategoryId: roomId,
      date,
      unitsAvailable: units !== undefined ? Math.max(0, Math.min(units, room._count.roomUnits)) : room._count.roomUnits,
      closed,
    },
  });

  if (body.nightlyRate !== undefined && Number(body.nightlyRate) > 0) {
    if (await hasStaffPermission(user, propertyId, "canManageRates")) {
      const fixedPrice = Number(body.nightlyRate);
      const plan = await prisma.ratePlan.findFirst({ where: { propertyId, active: true } });
      if (plan) {
        await prisma.rateRule.create({
          data: {
            propertyId,
            roomCategoryId: roomId,
            ratePlanId: plan.id,
            name: `Daily rate override`,
            type: "SEASONAL",
            startDate: date,
            endDate: date,
            fixedPrice,
            minStayDays: plan.minimumStay,
          },
        });
      }
    }
  }

  await audit(user, "calendar", roomId, "quick_update", { date: dateStr, units, closed, price: body.nightlyRate });
  return { ok: true, roomId, date: dateStr };
}

const unitStatusMap: Record<string, RoomUnitStatus> = { vacant: "VACANT_CLEAN", clean: "VACANT_CLEAN", dirty: "VACANT_DIRTY", occupied: "OCCUPIED", cleaning: "CLEANING", maintenance: "MAINTENANCE", blocked: "BLOCKED" };
export async function setUnitStatus(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageTasks"))) {
    throw new Error("You do not have permission to change room status.");
  }
  const statusText = String(body.status || ""), status = unitStatusMap[statusText]; if (!status) throw new Error("Invalid room-unit status.");
  const unit = await prisma.roomUnit.findFirst({ where: { id: String(body.unitId || ""), propertyId } }); if (!unit) throw new Error("Room unit not found.");
  await prisma.roomUnit.update({ where: { id: unit.id }, data: { status } }); await audit(user, "room_unit", unit.id, "status", { status: statusText }); return { id: unit.id, status: statusText };
}

export async function createRatePlan(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageRates"))) {
    throw new Error("You do not have permission to manage rate plans.");
  }
  const name = String(body.name || "").trim(), minimumStay = Number(body.minimumStay || 1), taxBps = Number(body.taxBps || 0), fee = Number(body.serviceFee || 0);
  if (!name || !Number.isInteger(minimumStay) || minimumStay < 1 || !Number.isInteger(taxBps) || taxBps < 0 || taxBps > 10000 || !Number.isFinite(fee) || fee < 0) throw new Error("Invalid rate-plan values.");
  const plan = await prisma.ratePlan.create({ data: { propertyId, name, minimumStay, taxBps, serviceFee: fee } }); await audit(user, "rate_plan", plan.id, "create", { name, minimumStay }); return { id: plan.id };
}

export async function createRateRule(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageRates"))) {
    throw new Error("You do not have permission to manage seasonal rates.");
  }
  const roomId = String(body.roomId || ""), planId = String(body.ratePlanId || ""), start = String(body.start || ""), end = String(body.end || ""), rate = Number(body.nightlyRate);
  const [room, plan] = await Promise.all([prisma.roomCategory.findFirst({ where: { id: roomId, propertyId } }), prisma.ratePlan.findFirst({ where: { id: planId, propertyId } })]);
  if (!room || !plan || !validDate(start) || !validDate(end) || end < start || !Number.isFinite(rate) || rate <= 0) throw new Error("Choose a room, plan, valid dates, and nightly rate.");
  const rule = await prisma.rateRule.create({ data: { propertyId, roomCategoryId: roomId, ratePlanId: planId, name: plan.name, type: "SEASONAL", startDate: dateOnly(start), endDate: dateOnly(end), fixedPrice: rate, minStayDays: plan.minimumStay } }); await audit(user, "rate_rule", rule.id, "create", { propertyId, roomId, planId, start, end }); return { id: rule.id };
}

export async function createTask(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageTasks"))) {
    throw new Error("You do not have permission to create operational tasks.");
  }
  const type = String(body.type || "").toUpperCase(), note = String(body.note || "").trim(); if (!["HOUSEKEEPING", "MAINTENANCE"].includes(type) || !note) throw new Error("Choose a task type and add a note.");
  const task = await prisma.operationalTask.create({ data: { propertyId, roomUnitId: String(body.roomUnitId || "") || null, type, note, assignedToId: String(body.assignedTo || "") || null, dueAt: body.dueAt ? new Date(String(body.dueAt)) : null } }); await audit(user, "operational_task", task.id, "create", { propertyId, type }); return { id: task.id };
}

export async function updateTaskStatus(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canManageTasks"))) {
    throw new Error("You do not have permission to update tasks.");
  }
  const status = String(body.status || "").toUpperCase(); if (!["OPEN", "IN_PROGRESS", "COMPLETED"].includes(status)) throw new Error("Invalid task status.");
  const task = await prisma.operationalTask.findFirst({ where: { id: String(body.taskId || ""), propertyId } }); if (!task) throw new Error("Task not found.");
  await prisma.operationalTask.update({ where: { id: task.id }, data: { status, completedAt: status === "COMPLETED" ? new Date() : null } }); await audit(user, "operational_task", task.id, "status", { status }); return { id: task.id, status: status.toLowerCase() };
}

export async function quote(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!(await authorize(user, propertyId))) return null;
  const roomId = String(body.roomId || ""), start = String(body.start || ""), end = String(body.end || ""), units = Number(body.units || 1);
  if (!(await prisma.roomCategory.findFirst({ where: { id: roomId, propertyId } })) || !validDate(start) || !validDate(end) || end <= start || !Number.isInteger(units) || units < 1) throw new Error("Choose a room, dates and unit count.");
  return quoteRoom(roomId, start, end, units);
}

export async function upsertStaff(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await authorize(user, propertyId, ["owner", "manager"]))) return null;
  const email = String(body.email || "").trim().toLowerCase();
  const role = staffRole(String(body.role || ""));
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid staff email and role.");

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true },
  });
  if (!property) throw new Error("Property not found.");

  let staff = await prisma.user.findUnique({ where: { email } });
  let isNewUser = false;
  if (!staff) {
    const namePrefix = email.split("@")[0].replace(/[._-]/g, " ");
    staff = await prisma.user.create({
      data: {
        email,
        name: namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1),
        role: "OWNER",
        accountStatus: "ACTIVE",
      },
    });
    isNewUser = true;
  }

  const membership = await prisma.propertyStaff.upsert({
    where: { propertyId_userId: { propertyId, userId: staff.id } },
    update: { role, active: true },
    create: { propertyId, userId: staff.id, role },
  });

  if (body.permissions && typeof body.permissions === "object") {
    const key = `staff_perms:${propertyId}:${staff.id}`;
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value: body.permissions },
      create: { key, value: body.permissions },
    });
  }

  // Queue branded HTML staff invitation email
  const managerUrl = (process.env.MANAGER_APP_URL || "http://localhost:3001").replace(/\/$/, "");
  const inviteHtml = staffInvitationTemplate({
    staffEmail: email,
    propertyName: property.name,
    inviterName: user.name || user.email || "Property Manager",
    role: String(body.role || role),
    inviteUrl: `${managerUrl}/`,
  });

  await queueNotification({
    userId: staff.id,
    type: "STAFF_INVITATION",
    title: `You've been invited to join ${property.name} on Vabbot Resorts`,
    body: `You have been invited by ${user.name || "the manager"} to join ${property.name} as ${role}. Access your management dashboard at: ${managerUrl}/`,
    email,
    data: {
      html: inviteHtml,
      propertyId,
      staffId: staff.id,
      invitation: true,
    },
  });

  await audit(user, "staff_member", membership.id, isNewUser ? "invite" : "upsert", {
    propertyId,
    userId: staff.id,
    role,
    email,
  });

  return { id: membership.id, invited: true, email };
}

export async function resendInvite(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  const membershipId = String(body.membershipId || "");
  if (!(await authorize(user, propertyId, ["owner", "manager"]))) return null;
  const membership = await prisma.propertyStaff.findFirst({
    where: { id: membershipId, propertyId },
    include: { user: true, property: true },
  });
  if (!membership) throw new Error("Staff membership not found.");

  const managerUrl = (process.env.MANAGER_APP_URL || "http://localhost:3001").replace(/\/$/, "");
  const inviteHtml = staffInvitationTemplate({
    staffEmail: membership.user.email,
    propertyName: membership.property.name,
    inviterName: user.name || "Property Manager",
    role: membership.role,
    inviteUrl: `${managerUrl}/`,
  });

  await queueNotification({
    userId: membership.userId,
    type: "STAFF_INVITATION_REMINDER",
    title: `Reminder: You've been invited to join ${membership.property.name} on Vabbot Resorts`,
    body: `Reminder: You have been invited to join ${membership.property.name} as ${membership.role}. Access your dashboard at ${managerUrl}/`,
    email: membership.user.email,
    data: {
      html: inviteHtml,
      propertyId,
      staffId: membership.userId,
      invitation: true,
    },
  });

  await audit(user, "staff_member", membership.id, "resend_invite", { propertyId, email: membership.user.email });
  return { ok: true, sent: true };
}

export async function assignRoom(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!(await hasStaffPermission(user, propertyId, "canAssignRooms"))) {
    throw new Error("You do not have permission to assign rooms.");
  }
  const reservationId = String(body.reservationId || ""), unitId = String(body.unitId || "");
  const [reservation, unit] = await Promise.all([
    prisma.reservation.findFirst({ where: { id: reservationId, propertyId } }),
    prisma.roomUnit.findFirst({ where: { id: unitId, propertyId } }),
  ]);
  if (!reservation || !unit || unit.roomCategoryId !== reservation.roomCategoryId) throw new Error("Choose a compatible room unit for this reservation.");
  const conflict = await prisma.reservation.findFirst({ where: { id: { not: reservation.id }, roomUnitId: unit.id, status: { in: ["CONFIRMED", "UPCOMING", "CHECKED_IN"] }, checkInDate: { lt: reservation.checkOutDate }, checkOutDate: { gt: reservation.checkInDate } } });
  if (conflict) throw new Error("That room unit is already assigned during these dates.");
  await prisma.reservation.update({ where: { id: reservation.id }, data: { roomUnitId: unit.id } });
  await audit(user, "reservation", reservation.id, "assign_room", { propertyId, unitId });
  return { id: reservation.id, unitId };
}

export { quoteRoom };
