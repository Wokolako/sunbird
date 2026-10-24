import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const guestRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  nationality: z.string().optional().default("British"),
  preferredCurrency: z.string().optional().default("GBP"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = guestRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, phone, password, nationality, preferredCurrency } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Guest User and GuestProfile
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: UserRole.GUEST,
        guestProfile: {
          create: {
            phone,
            nationality,
            preferredCurrency,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Guest account registered successfully",
      user,
    });
  } catch (err) {
    console.error("Guest registration error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register guest" },
      { status: 500 }
    );
  }
}
