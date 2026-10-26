import { NextRequest, NextResponse } from "next/server";
import { StaffRole, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty, getPropertyOwner } from "@/lib/owner-property";

export const dynamic = "force-dynamic";

const addStaffSchema = z.object({
  propertyId: z.string().min(1),
  email: z.string().trim().email().max(254),
  role: z.enum([StaffRole.MANAGER, StaffRole.FRONT_DESK, StaffRole.HOUSEKEEPER]),
});

const updateStaffSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum([StaffRole.MANAGER, StaffRole.FRONT_DESK, StaffRole.HOUSEKEEPER]),
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
    const property = await getOwnedProperty(propertyId, owner.id);
    if (!property) return fail("You do not have access to this property.", 404);

    const staff = await prisma.propertyStaff.findMany({
      where: { propertyId, active: true },
      select: {
        id: true,
        role: true,
        assignedAt: true,
        userId: true,
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: [{ role: "asc" }, { assignedAt: "asc" }],
    });

    return NextResponse.json(
      { property, staff },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Owner team list error:", error);
    return fail("Could not load the property team.", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);

  try {
    const owner = await getPropertyOwner();
    if (!owner) return fail("Property owner access required.", 403);

    const parsed = addStaffSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid team member details.");
    }

    const { propertyId, role } = parsed.data;
    const property = await getOwnedProperty(propertyId, owner.id);
    if (!property) return fail("You do not have access to this property.", 404);

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) {
      return fail(
        "No account exists for that email. Ask the team member to register first.",
        404
      );
    }
    if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
      return fail("Admin and property-owner accounts cannot be added as staff.");
    }

    const otherMemberships = await prisma.propertyStaff.findMany({
      where: { userId: user.id, active: true, propertyId: { not: propertyId } },
      select: { role: true },
    });
    if (otherMemberships.some((membership) => membership.role !== role)) {
      return fail(
        "This account has a different staff role at another property. Use the same role across properties."
      );
    }

    const membership = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { role } });
      const savedMembership = await tx.propertyStaff.upsert({
        where: { propertyId_userId: { propertyId, userId: user.id } },
        create: { propertyId, userId: user.id, role, active: true },
        update: { role, active: true },
        select: { id: true, role: true, assignedAt: true },
      });
      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userEmail: owner.email,
          action: "PROPERTY_STAFF_ADDED",
          entity: "PropertyStaff",
          entityId: savedMembership.id,
          details: JSON.stringify({ propertyId, userId: user.id, role }),
        },
      });
      return savedMembership;
    });

    return NextResponse.json(
      { membership: { ...membership, user: { name: user.name, email: user.email } } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Owner team add error:", error);
    return fail("Could not add the team member.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);

  try {
    const owner = await getPropertyOwner();
    if (!owner) return fail("Property owner access required.", 403);

    const parsed = updateStaffSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid team member details.");
    }

    const membership = await prisma.propertyStaff.findFirst({
      where: {
        id: parsed.data.membershipId,
        active: true,
        property: {
          staff: {
            some: { userId: owner.id, role: StaffRole.OWNER, active: true },
          },
        },
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!membership) return fail("Team member not found.", 404);
    if (
      membership.role === StaffRole.OWNER ||
      membership.user.role === UserRole.OWNER ||
      membership.user.role === UserRole.ADMIN
    ) {
      return fail("The property owner role cannot be changed.");
    }

    const otherMemberships = await prisma.propertyStaff.findMany({
      where: {
        userId: membership.userId,
        active: true,
        propertyId: { not: membership.propertyId },
      },
      select: { role: true },
    });
    if (otherMemberships.some((entry) => entry.role !== parsed.data.role)) {
      return fail(
        "This account has a different staff role at another property. Use the same role across properties."
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: membership.userId },
        data: { role: parsed.data.role },
      });
      const saved = await tx.propertyStaff.update({
        where: { id: membership.id },
        data: { role: parsed.data.role },
        select: { id: true, role: true, assignedAt: true },
      });
      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userEmail: owner.email,
          action: "PROPERTY_STAFF_ROLE_CHANGED",
          entity: "PropertyStaff",
          entityId: saved.id,
          details: JSON.stringify({
            propertyId: membership.propertyId,
            userId: membership.user.id,
            role: saved.role,
          }),
        },
      });
      return saved;
    });

    return NextResponse.json({
      membership: {
        ...updated,
        user: { email: membership.user.email },
      },
    });
  } catch (error) {
    console.error("Owner team update error:", error);
    return fail("Could not update the team member.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);

  try {
    const owner = await getPropertyOwner();
    if (!owner) return fail("Property owner access required.", 403);

    const parsed = z
      .object({ membershipId: z.string().min(1) })
      .safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid team member.");
    }

    const membership = await prisma.propertyStaff.findFirst({
      where: {
        id: parsed.data.membershipId,
        active: true,
        property: {
          staff: {
            some: { userId: owner.id, role: StaffRole.OWNER, active: true },
          },
        },
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!membership) return fail("Team member not found.", 404);
    if (
      membership.role === StaffRole.OWNER ||
      membership.userId === owner.id ||
      membership.user.role === UserRole.OWNER ||
      membership.user.role === UserRole.ADMIN
    ) {
      return fail("The property owner cannot be removed from the team.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyStaff.update({
        where: { id: membership.id },
        data: { active: false },
      });
      const otherMembership = await tx.propertyStaff.findFirst({
        where: {
          userId: membership.userId,
          active: true,
          id: { not: membership.id },
        },
        select: { id: true },
      });
      if (!otherMembership) {
        await tx.user.update({
          where: { id: membership.userId },
          data: { role: UserRole.GUEST },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userEmail: owner.email,
          action: "PROPERTY_STAFF_REMOVED",
          entity: "PropertyStaff",
          entityId: membership.id,
          details: JSON.stringify({
            propertyId: membership.propertyId,
            userId: membership.user.id,
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Owner team removal error:", error);
    return fail("Could not remove the team member.", 500);
  }
}
