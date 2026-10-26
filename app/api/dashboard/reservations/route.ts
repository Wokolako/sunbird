import { NextRequest, NextResponse } from "next/server";
import {
  IdVerificationStatus,
  PaymentStatus,
  Prisma,
  ReservationSource,
  ReservationStatus,
  RoomUnitStatus,
  UserRole,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getDashboardStaff } from "@/lib/dashboard-staff";
import { calculateBaseRoomTotal } from "@/lib/reservation-pricing";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const createReservationSchema = z.object({
  propertyId: z.string().min(1),
  roomCategoryId: z.string().min(1),
  checkIn: z.string().regex(datePattern),
  checkOut: z.string().regex(datePattern),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().max(40).optional().default(""),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  source: z.enum([ReservationSource.WALK_IN, ReservationSource.PHONE]),
  specialRequests: z.string().trim().max(2000).optional().default(""),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

type ReservationListRow = {
  id: string;
  referenceCode: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalAmount: string;
  currency: string;
  status: ReservationStatus;
  source: ReservationSource;
  property: { name: string };
  guest: { name: string | null; email: string; phone: string | null };
  roomCategory: { name: string };
  roomUnit: { name: string } | null;
  payments: Array<{ status: PaymentStatus; paymentType: string }>;
};

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

function isBookingConflict(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2004" || error.code === "P2010")
  ) {
    return true;
  }
  return (
    error instanceof Error &&
    (error.message.includes("no_double_booking_reservation") ||
      error.message.includes("trg_check_reservation_date_block"))
  );
}

export async function GET(request: NextRequest) {
  try {
    const propertiesOnly = request.nextUrl.searchParams.get("propertiesOnly") === "true";
    const requestedPropertyId = request.nextUrl.searchParams.get("propertyId");
    const requestedCategoryId = request.nextUrl.searchParams.get("roomCategoryId");
    const checkInValue = request.nextUrl.searchParams.get("checkIn");
    const checkOutValue = request.nextUrl.searchParams.get("checkOut");
    const reservationsOnly =
      request.nextUrl.searchParams.get("reservationsOnly") === "true";

    if (
      reservationsOnly &&
      (!requestedPropertyId || !requestedCategoryId || !checkInValue || !checkOutValue)
    ) {
      const session = await getServerSession(authOptions);
      const email = session?.user?.email;
      if (!email) return fail("Property staff access required.", 403);

      const reservations = await prisma.$queryRaw<ReservationListRow[]>`
        SELECT
          r."id",
          r."referenceCode",
          r."checkInDate",
          r."checkOutDate",
          r."totalAmount"::text AS "totalAmount",
          r."currency",
          r."status",
          r."source",
          jsonb_build_object('name', p."name") AS "property",
          jsonb_build_object(
            'name', guest."name",
            'email', guest."email",
            'phone', guest."phone"
          ) AS "guest",
          jsonb_build_object('name', category."name") AS "roomCategory",
          CASE
            WHEN unit."id" IS NULL THEN NULL
            ELSE jsonb_build_object('name', unit."name")
          END AS "roomUnit",
          COALESCE(latest_payment."payments", '[]'::jsonb) AS "payments"
        FROM "Reservation" r
        JOIN "Property" p ON p."id" = r."propertyId"
        JOIN "User" guest ON guest."id" = r."guestId"
        JOIN "RoomCategory" category ON category."id" = r."roomCategoryId"
        LEFT JOIN "RoomUnit" unit ON unit."id" = r."roomUnitId"
        JOIN "User" staff_user ON staff_user."email" = ${email}
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'status', payment."status",
              'paymentType', payment."paymentType"
            )
            ORDER BY payment."createdAt" DESC
          ) AS "payments"
          FROM (
            SELECT "status", "paymentType", "createdAt"
            FROM "Payment"
            WHERE "reservationId" = r."id"
            ORDER BY "createdAt" DESC
            LIMIT 1
          ) payment
        ) latest_payment ON TRUE
        WHERE p."status" = 'APPROVED'
          AND (
            (staff_user."role" = 'OWNER' AND EXISTS (
              SELECT 1 FROM "PropertyStaff" membership
              WHERE membership."propertyId" = p."id"
                AND membership."userId" = staff_user."id"
                AND membership."role" = 'OWNER'
                AND membership."active" = TRUE
            ))
            OR (staff_user."role" = 'MANAGER' AND EXISTS (
              SELECT 1 FROM "PropertyStaff" membership
              WHERE membership."propertyId" = p."id"
                AND membership."userId" = staff_user."id"
                AND membership."role" = 'MANAGER'
                AND membership."active" = TRUE
            ))
            OR (staff_user."role" = 'FRONT_DESK' AND EXISTS (
              SELECT 1 FROM "PropertyStaff" membership
              WHERE membership."propertyId" = p."id"
                AND membership."userId" = staff_user."id"
                AND membership."role" = 'FRONT_DESK'
                AND membership."active" = TRUE
            ))
          )
        ORDER BY r."createdAt" DESC
        LIMIT 100
      `;

      return NextResponse.json(
        {
          reservations,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const staff = await getDashboardStaff();
    if (!staff) return fail("Property staff access required.", 403);

    const membershipsPromise = prisma.propertyStaff.findMany({
      where: {
        userId: staff.id,
        role: staff.staffRole,
        active: true,
        property: { status: "APPROVED" },
      },
      select: {
        property: {
          select: {
            id: true,
            name: true,
            roomCategories: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                maxAdults: true,
                maxChildren: true,
              },
              orderBy: { name: "asc" },
            },
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    });

    if (!requestedPropertyId || !requestedCategoryId || !checkInValue || !checkOutValue) {
      const [memberships, reservations] = await Promise.all([
        membershipsPromise,
        propertiesOnly
          ? Promise.resolve([])
          : prisma.reservation.findMany({
              where: {
                property: {
                  status: "APPROVED",
                  staff: {
                    some: {
                      userId: staff.id,
                      role: staff.staffRole,
                      active: true,
                    },
                  },
                },
              },
              select: {
                referenceCode: true,
                checkInDate: true,
                checkOutDate: true,
                totalAmount: true,
                currency: true,
                status: true,
                source: true,
                property: { select: { name: true } },
                guest: { select: { name: true, email: true, phone: true } },
                roomCategory: { select: { name: true } },
                roomUnit: { select: { name: true } },
                payments: {
                  select: { status: true, paymentType: true },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
              orderBy: { createdAt: "desc" },
              take: 100,
            }),
      ]);
      const properties = memberships.map(({ property }) => property);

      return NextResponse.json({
        properties,
        reservations: reservations.map((reservation) => ({
          ...reservation,
          totalAmount: reservation.totalAmount.toString(),
        })),
      });
    }

    const memberships = await membershipsPromise;
    const properties = memberships.map(({ property }) => property);
    const checkIn = parseDate(checkInValue);
    const checkOut = parseDate(checkOutValue);
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return fail("Enter a valid check-in and check-out date.");
    }

    const property = properties.find(({ id }) => id === requestedPropertyId);
    const category = property?.roomCategories.find(
      ({ id }) => id === requestedCategoryId
    );
    if (!property || !category) {
      return fail("You do not have access to this room category.", 404);
    }

    const availableUnits = await prisma.roomUnit.findMany({
      where: {
        propertyId: property.id,
        roomCategoryId: category.id,
        status:
          checkInValue === new Date().toISOString().slice(0, 10)
            ? { equals: RoomUnitStatus.VACANT_CLEAN }
            : { not: RoomUnitStatus.MAINTENANCE },
        reservations: {
          none: {
            status: { not: ReservationStatus.CANCELLED },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        },
        dateBlocks: {
          none: {
            startDate: { lt: checkOut },
            endDate: { gt: checkIn },
          },
        },
      },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      {
        property: { id: property.id, name: property.name, currency: "GBP" },
        category: {
          id: category.id,
          name: category.name,
          nightlyRate: category.basePrice.toString(),
          baseRoomTotal: calculateBaseRoomTotal(
            category.basePrice,
            nightsBetween(checkIn, checkOut)
          ).toString(),
          nights: nightsBetween(checkIn, checkOut),
          maxAdults: category.maxAdults,
          maxChildren: category.maxChildren,
        },
        availableUnits: availableUnits.map((unit) => ({
          id: unit.id,
          name: unit.name,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Reservation options error:", error);
    return fail("Could not load reservation options.", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);

  try {
    const staff = await getDashboardStaff();
    if (!staff) return fail("Property staff access required.", 403);

    const parsed = createReservationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid reservation details.");
    }

    const values = parsed.data;
    const checkIn = parseDate(values.checkIn);
    const checkOut = parseDate(values.checkOut);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return fail("Check-out must be after check-in.");
    }
    if (checkIn < today) return fail("Check-in cannot be in the past.");

    const membership = await prisma.propertyStaff.findFirst({
      where: {
        userId: staff.id,
        role: staff.staffRole,
        active: true,
        propertyId: values.propertyId,
        property: { status: "APPROVED" },
      },
      select: { property: { select: { id: true } } },
    });
    if (!membership) return fail("You do not have access to this property.", 404);

    const category = await prisma.roomCategory.findFirst({
      where: {
        id: values.roomCategoryId,
        propertyId: membership.property.id,
      },
      select: {
        id: true,
        basePrice: true,
        maxAdults: true,
        maxChildren: true,
      },
    });
    if (!category) return fail("Room category not found for this property.", 404);
    if (values.adults > category.maxAdults || values.children > category.maxChildren) {
      return fail("Guest count exceeds this room category's capacity.");
    }

    const guestEmail = values.guestEmail.toLowerCase();
    const guestRecord = await prisma.user.findUnique({
      where: { email: guestEmail },
      select: { id: true, role: true },
    });
    if (guestRecord && guestRecord.role !== UserRole.GUEST) {
      return fail("That email belongs to a staff account, not a guest.");
    }

    const units = await prisma.roomUnit.findMany({
      where: {
        propertyId: membership.property.id,
        roomCategoryId: category.id,
        status:
          values.checkIn === today.toISOString().slice(0, 10)
            ? { equals: RoomUnitStatus.VACANT_CLEAN }
            : { not: RoomUnitStatus.MAINTENANCE },
        reservations: {
          none: {
            status: { not: ReservationStatus.CANCELLED },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        },
        dateBlocks: {
          none: {
            startDate: { lt: checkOut },
            endDate: { gt: checkIn },
          },
        },
      },
      select: { id: true },
      orderBy: { name: "asc" },
    });
    if (!units.length) {
      return fail(
        "No room is available for those dates. Choose another room category or date range.",
        409
      );
    }

    const nights = nightsBetween(checkIn, checkOut);
    const totalAmount = calculateBaseRoomTotal(category.basePrice, nights);
    const referenceCode = `RES-${checkIn.getUTCFullYear()}-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    const reservation = await prisma.$transaction(async (tx) => {
      const guest = guestRecord
        ? guestRecord
        : await tx.user.create({
            data: {
              name: values.guestName,
              email: guestEmail,
              phone: values.guestPhone || null,
              role: UserRole.GUEST,
              guestProfile: {
                create: {
                  phone: values.guestPhone || null,
                  preferredCurrency: "GBP",
                },
              },
            },
            select: { id: true },
          });

      const created = await tx.reservation.create({
        data: {
          referenceCode,
          propertyId: membership.property.id,
          roomCategoryId: category.id,
          roomUnitId: units[0].id,
          guestId: guest.id,
          status: ReservationStatus.UPCOMING,
          source: values.source,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adultsCount: values.adults,
          childrenCount: values.children,
          specialRequests: values.specialRequests || null,
          idVerificationStatus: IdVerificationStatus.NOT_VERIFIED,
          totalAmount,
          currency: "GBP",
        },
        select: {
          id: true,
          referenceCode: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          currency: true,
          roomUnit: { select: { name: true } },
          roomCategory: { select: { name: true } },
          guest: { select: { name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: staff.id,
          userEmail: staff.email,
          action: "RESERVATION_CREATED",
          entity: "Reservation",
          entityId: created.id,
          details: JSON.stringify({
            propertyId: membership.property.id,
            referenceCode: created.referenceCode,
            source: values.source,
          }),
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        reservation: { ...reservation, totalAmount: reservation.totalAmount.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isBookingConflict(error)) {
      return fail(
        "That room was just booked or blocked for those dates. Please choose another option.",
        409
      );
    }
    console.error("Reservation creation error:", error);
    return fail("Could not create the reservation.", 500);
  }
}
