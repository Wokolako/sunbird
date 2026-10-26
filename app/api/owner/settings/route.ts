import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty, getPropertyOwner } from "@/lib/owner-property";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  legalName: z.string().trim().max(160),
  description: z.string().trim().min(10).max(5000),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  stateOrRegion: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(30),
  contactEmail: z.union([z.string().trim().email().max(254), z.literal("")]),
  contactPhone: z.string().trim().max(40),
  website: z.union([z.string().trim().url().max(300), z.literal("")]),
  checkInTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  checkOutTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  rules: z.string().trim().max(5000),
  cancellationPolicy: z.string().trim().max(5000),
  petsAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getPropertyOwner();
    if (!owner) return fail("Property owner access required.", 403);

    const propertyId = request.nextUrl.searchParams.get("propertyId") || "";
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        staff: {
          some: { userId: owner.id, role: StaffRole.OWNER, active: true },
        },
      },
      select: {
        id: true,
        name: true,
        legalName: true,
        description: true,
        address: true,
        city: true,
        stateOrRegion: true,
        country: true,
        postalCode: true,
        contactEmail: true,
        contactPhone: true,
        website: true,
        checkInTime: true,
        checkOutTime: true,
        rules: true,
        cancellationPolicy: true,
        petsAllowed: true,
        smokingAllowed: true,
      },
    });
    if (!property) return fail("You do not have access to this property.", 404);

    return NextResponse.json({ property }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Owner property settings load error:", error);
    return fail("Could not load property settings.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);

  try {
    const owner = await getPropertyOwner();
    if (!owner) return fail("Property owner access required.", 403);

    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid property settings.");
    }

    const { propertyId, ...values } = parsed.data;
    const property = await getOwnedProperty(propertyId, owner.id);
    if (!property) return fail("You do not have access to this property.", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.property.update({
        where: { id: propertyId },
        data: {
          ...values,
          legalName: values.legalName || null,
          contactEmail: values.contactEmail || null,
          contactPhone: values.contactPhone || null,
          website: values.website || null,
          rules: values.rules || null,
          cancellationPolicy: values.cancellationPolicy || null,
        },
        select: { id: true, name: true, updatedAt: true },
      });
      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userEmail: owner.email,
          action: "PROPERTY_SETTINGS_UPDATED",
          entity: "Property",
          entityId: propertyId,
          details: JSON.stringify({ name: saved.name }),
        },
      });
      return saved;
    });

    return NextResponse.json({ property: updated });
  } catch (error) {
    console.error("Owner property settings update error:", error);
    return fail("Could not save property settings.", 500);
  }
}
