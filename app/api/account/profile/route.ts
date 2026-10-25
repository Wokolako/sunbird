import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateOrRegion: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  nationality: z.string().optional(),
  idOrPassportNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredCurrency: z.string().optional(),
  paymentMethodPref: z.string().optional(),
  specialRequests: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        guestProfile: true,
        reservations: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
              },
            },
            roomCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            roomUnit: {
              select: {
                name: true,
              },
            },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      // In demo mode with mock JWT, return mock profile
      return NextResponse.json({
        user: {
          id: session.user.id || "guest-id",
          name: session.user.name || "Thoko Mwale",
          email: session.user.email,
          role: session.user.role || "GUEST",
          phone: "+44 7700 900077",
          guestProfile: {
            nationality: "British",
            preferredCurrency: "GBP",
            address: "14 Kensington Church Street",
            city: "London",
            country: "United Kingdom",
            postalCode: "W8 4EP",
            emergencyContactName: "Alistair Mwale",
            emergencyContactPhone: "+44 7700 900199",
            idOrPassportNumber: "GB-982314-P",
            paymentMethodPref: "CREDIT_CARD",
            specialRequests: "High floor lake view suite, hypoallergenic bedding.",
          },
          reservations: [
            {
              id: "res-demo-1",
              referenceCode: "RES-2026-8941",
              status: "UPCOMING",
              checkIn: "2026-11-14T14:00:00Z",
              checkOut: "2026-11-17T11:00:00Z",
              nights: 3,
              adults: 2,
              children: 0,
              totalAmount: 555000,
              currency: "GBP",
              totalAmountGbp: 275,
              property: {
                name: "Windermere Lakeside Retreat & Lodge",
                city: "Windermere",
                address: "Lakeside Drive, Lake District",
              },
              roomCategory: {
                name: "Executive Lakeview Suite",
              },
              roomUnit: {
                name: "Suite 101",
              },
              idVerificationStatus: "VERIFIED",
            },
          ],
        },
      });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Fetch profile error:", err);
    return NextResponse.json(
      { error: "Failed to load guest profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { guestProfile: true },
    });

    if (!user) {
      // Demo session acknowledgement
      return NextResponse.json({
        success: true,
        message: "Preferences updated in demo session",
        data,
      });
    }

    // Update User and GuestProfile
    const updated = await prisma.$transaction(async (tx) => {
      if (data.name || data.phone) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
          },
        });
      }

      const profile = await tx.guestProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          phone: data.phone,
          address: data.address,
          city: data.city,
          stateOrRegion: data.stateOrRegion,
          country: data.country || "United Kingdom",
          postalCode: data.postalCode,
          nationality: data.nationality || "British",
          idOrPassportNumber: data.idOrPassportNumber,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          preferredCurrency: data.preferredCurrency || "GBP",
          paymentMethodPref: data.paymentMethodPref,
          specialRequests: data.specialRequests,
        },
        update: {
          phone: data.phone,
          address: data.address,
          city: data.city,
          stateOrRegion: data.stateOrRegion,
          country: data.country,
          postalCode: data.postalCode,
          nationality: data.nationality,
          idOrPassportNumber: data.idOrPassportNumber,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          preferredCurrency: data.preferredCurrency,
          paymentMethodPref: data.paymentMethodPref,
          specialRequests: data.specialRequests,
        },
      });

      return profile;
    });

    return NextResponse.json({
      success: true,
      message: "Guest profile and preferences updated successfully",
      profile: updated,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Failed to update guest profile" },
      { status: 500 }
    );
  }
}
