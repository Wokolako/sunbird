import { NextRequest, NextResponse } from "next/server";
import { ReservationStatus, StaffRole, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  type: z.enum(["CANCELLATION", "DATE_CHANGE"]),
  message: z.string().trim().max(1000).optional().default(""),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== UserRole.GUEST) {
      return NextResponse.json(
        { error: "Guest account access required." },
        { status: 403 }
      );
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 }
      );
    }

    const { reservationId } = await params;
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        guest: { email: session.user.email },
      },
      select: {
        id: true,
        referenceCode: true,
        propertyId: true,
        status: true,
        checkInDate: true,
        checkOutDate: true,
        property: { select: { name: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    const isCancellation = parsed.data.type === "CANCELLATION";
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (
      isCancellation &&
      (reservation.status !== ReservationStatus.UPCOMING ||
        reservation.checkInDate < today)
    ) {
      return NextResponse.json(
        { error: "Only upcoming reservations can be sent for cancellation review." },
        { status: 409 }
      );
    }

    const subject = isCancellation
      ? "Guest cancellation request"
      : "Guest date change request";
    const existingRequest = await prisma.message.findFirst({
      where: {
        reservationId: reservation.id,
        sender: { email: session.user.email },
        subject,
      },
      select: { id: true },
    });
    if (existingRequest) {
      return NextResponse.json(
        {
          error: isCancellation
            ? "A cancellation request has already been sent for this reservation."
            : "A date-change request has already been sent for this reservation.",
        },
        { status: 409 }
      );
    }

    const recipient = await prisma.propertyStaff.findFirst({
      where: {
        propertyId: reservation.propertyId,
        active: true,
        role: { in: [StaffRole.OWNER, StaffRole.MANAGER] },
      },
      orderBy: { role: "asc" },
      select: { userId: true },
    });
    if (!recipient) {
      return NextResponse.json(
        { error: "The property has no active manager to receive this request." },
        { status: 409 }
      );
    }

    await prisma.message.create({
      data: {
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        senderId: session.user.id,
        recipientId: recipient.userId,
        subject,
        content: [
          `${isCancellation ? "Cancellation" : "Date change"} request for reservation ${reservation.referenceCode}.`,
          `Property: ${reservation.property.name}.`,
          `Current dates: ${reservation.checkInDate.toISOString().slice(0, 10)} to ${reservation.checkOutDate.toISOString().slice(0, 10)}.`,
          parsed.data.message ? `Guest note: ${parsed.data.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });

    return NextResponse.json({
      success: true,
      message: isCancellation
        ? "Your cancellation request has been sent to the property."
        : "Your date-change request has been sent to the property.",
    });
  } catch (error) {
    console.error("Guest reservation request error:", error);
    return NextResponse.json(
      { error: "Could not send your reservation request." },
      { status: 500 }
    );
  }
}
