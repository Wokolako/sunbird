import { NextRequest, NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { getDashboardStaff } from "@/lib/dashboard-staff";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export async function GET(request: NextRequest) {
  try {
    const staff = await getDashboardStaff();
    if (!staff) {
      return NextResponse.json(
        { error: "Property staff access required." },
        { status: 403 }
      );
    }

    const startValue = request.nextUrl.searchParams.get("start");
    const endValue = request.nextUrl.searchParams.get("end");
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (
      !start ||
      !end ||
      end <= start ||
      end.getTime() - start.getTime() > 31 * 86_400_000
    ) {
      return NextResponse.json(
        { error: "Enter a valid calendar range of 31 days or fewer." },
        { status: 400 }
      );
    }

    const memberships = await prisma.propertyStaff.findMany({
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
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    });
    const properties = memberships.map(({ property }) => property);
    const requestedPropertyId = request.nextUrl.searchParams.get("propertyId");
    const property =
      (requestedPropertyId
        ? properties.find(({ id }) => id === requestedPropertyId)
        : properties[0]) || null;

    if (!property) {
      return NextResponse.json(
        {
          error: requestedPropertyId
            ? "You do not have access to this property."
            : "No approved property is available for your account.",
        },
        { status: 404 }
      );
    }

    const [roomUnits, reservations] = await Promise.all([
      prisma.roomUnit.findMany({
        where: { propertyId: property.id },
        select: {
          id: true,
          name: true,
          status: true,
          roomCategory: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.reservation.findMany({
        where: {
          propertyId: property.id,
          roomUnitId: { not: null },
          status: { not: ReservationStatus.CANCELLED },
          checkInDate: { lt: end },
          checkOutDate: { gt: start },
        },
        select: {
          id: true,
          roomUnitId: true,
          referenceCode: true,
          checkInDate: true,
          checkOutDate: true,
          status: true,
          guest: { select: { name: true } },
        },
        orderBy: { checkInDate: "asc" },
      }),
    ]);

    return NextResponse.json(
      {
        properties,
        property: { ...property, roomUnits },
        reservations,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Dashboard calendar load error:", error);
    return NextResponse.json(
      { error: "Could not load room availability." },
      { status: 500 }
    );
  }
}
