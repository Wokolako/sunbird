import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole, PropertyType, PropertyStatus, StaffRole } from "@prisma/client";

const ownerRegisterSchema = z.object({
  // Owner Contact
  name: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  // Property Details
  propertyName: z.string().min(3, "Property name must be at least 3 characters"),
  propertyType: z.enum(["HOTEL", "LODGE"]),
  description: z.string().min(10, "Please provide a short description of the property"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().default("United Kingdom"),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ownerRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      password,
      propertyName,
      propertyType,
      description,
      address,
      city,
      country,
      taxId,
      registrationNumber,
    } = parsed.data;

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
    const slug = propertyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;

    // Create Owner User, Property (PENDING approval), and Staff assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          passwordHash,
          role: UserRole.OWNER,
        },
      });

      const property = await tx.property.create({
        data: {
          name: propertyName,
          slug,
          type: propertyType as PropertyType,
          status: PropertyStatus.PENDING,
          description,
          address,
          city,
          stateOrRegion: city,
          country,
          taxId: taxId || null,
          registrationNumber: registrationNumber || null,
          contactEmail: normalizedEmail,
          contactPhone: phone,
          staff: {
            create: {
              userId: user.id,
              role: StaffRole.OWNER,
            },
          },
        },
      });

      // Audit log registration
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: "OWNER_PROPERTY_REGISTERED",
          entity: "Property",
          entityId: property.id,
          details: `Registered property "${propertyName}" pending admin verification.`,
        },
      });

      return { user, property };
    });

    return NextResponse.json({
      success: true,
      message: "Property owner account and listing application submitted successfully.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      propertyId: result.property.id,
    });
  } catch (err) {
    console.error("Owner registration error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register property owner" },
      { status: 500 }
    );
  }
}
