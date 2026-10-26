import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { PropertyStatus, StaffRole } from "@prisma/client";
import { z } from "zod";
import { getAdminActor } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        stateOrRegion: true,
        type: true,
        status: true,
        registrationNumber: true,
        createdAt: true,
        staff: {
          where: { role: StaffRole.OWNER },
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
          take: 1,
        },
        _count: { select: { roomCategories: true, staff: true } },
      },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    });
    const decisions = await prisma.auditLog.findMany({
      where: {
        entity: "Property",
        entityId: { in: properties.map((property) => property.id) },
        action: { in: ["PROPERTY_APPROVED", "PROPERTY_DECLINED"] },
      },
      select: { entityId: true, action: true },
      orderBy: { createdAt: "desc" },
    });
    const decisionByProperty = new Map<string, string>();
    for (const decision of decisions) {
      if (decision.entityId && !decisionByProperty.has(decision.entityId)) {
        decisionByProperty.set(decision.entityId, decision.action);
      }
    }
    const propertyRecords = properties.map((property) => ({
      ...property,
      status:
        decisionByProperty.get(property.id) === "PROPERTY_DECLINED"
          ? "REJECTED"
          : property.status,
    }));
    return NextResponse.json(
      { properties: propertyRecords },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin property list error:", error);
    return NextResponse.json(
      { error: "Could not load platform properties." },
      { status: 500 }
    );
  }
}

const reviewSchema = z.object({
  propertyId: z.string().min(1),
  decision: z.enum(["approve", "decline"]),
  reason: z.string().trim().max(1000).optional().default(""),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review decision." },
        { status: 400 }
      );
    }
    if (parsed.data.decision === "decline" && !parsed.data.reason) {
      return NextResponse.json(
        { error: "Provide a reason when declining a property." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: parsed.data.propertyId },
        select: { id: true, name: true, status: true },
      });
      if (!property) throw new Error("PROPERTY_NOT_FOUND");
      if (property.status !== PropertyStatus.PENDING) {
        throw new Error("PROPERTY_ALREADY_REVIEWED");
      }

      const status =
        parsed.data.decision === "approve"
          ? PropertyStatus.APPROVED
          : PropertyStatus.SUSPENDED;
      const updateResult = await tx.property.updateMany({
        where: { id: property.id, status: PropertyStatus.PENDING },
        data: { status },
      });
      if (updateResult.count !== 1) throw new Error("PROPERTY_ALREADY_REVIEWED");

      const updated = await tx.property.findUniqueOrThrow({
        where: { id: property.id },
        select: { id: true, name: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          userEmail: actor.email,
          action:
            parsed.data.decision === "approve"
              ? "PROPERTY_APPROVED"
              : "PROPERTY_DECLINED",
          entity: "Property",
          entityId: property.id,
          details: JSON.stringify({
            name: property.name,
            previousStatus: property.status,
            status,
            reason: parsed.data.reason || null,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({
      property: {
        ...result,
        status: parsed.data.decision === "decline" ? "REJECTED" : result.status,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PROPERTY_NOT_FOUND") {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "PROPERTY_ALREADY_REVIEWED") {
      return NextResponse.json(
        { error: "This property has already been reviewed." },
        { status: 409 }
      );
    }
    console.error("Admin property review error:", error);
    return NextResponse.json(
      { error: "Could not save the property review decision." },
      { status: 500 }
    );
  }
}
