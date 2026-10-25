import { NextRequest, NextResponse } from "next/server";
import { PropertyStatus, PropertyType, StaffRole, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDeclineReason(details: string | null) {
  if (!details) return null;
  try {
    const parsed: unknown = JSON.parse(details);
    if (
      parsed &&
      typeof parsed === "object" &&
      "reason" in parsed &&
      typeof parsed.reason === "string"
    ) {
      return parsed.reason;
    }
  } catch {
    return null;
  }
  return null;
}

const newPropertySchema = z.object({
  name: z.string().trim().min(3).max(120),
  type: z.nativeEnum(PropertyType),
  description: z.string().trim().min(10).max(5000),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  stateOrRegion: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  taxId: z.string().trim().max(100).optional().default(""),
  registrationNumber: z.string().trim().max(100).optional().default(""),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function getOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== UserRole.OWNER) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
  return user?.role === UserRole.OWNER ? user : null;
}

export async function GET() {
  try {
    const owner = await getOwner();
    if (!owner) {
      return NextResponse.json(
        { error: "Property owner access required." },
        { status: 403 }
      );
    }

    const properties = await prisma.property.findMany({
      where: { staff: { some: { userId: owner.id, role: StaffRole.OWNER } } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        city: true,
        stateOrRegion: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const decisions = await prisma.auditLog.findMany({
      where: {
        entity: "Property",
        entityId: { in: properties.map((property) => property.id) },
        action: { in: ["PROPERTY_APPROVED", "PROPERTY_DECLINED"] },
      },
      select: { entityId: true, action: true, details: true },
      orderBy: { createdAt: "desc" },
    });
    const decisionByProperty = new Map<
      string,
      { action: string; details: string | null }
    >();
    for (const decision of decisions) {
      if (decision.entityId && !decisionByProperty.has(decision.entityId)) {
        decisionByProperty.set(decision.entityId, decision);
      }
    }
    const propertyRecords = properties.map((property) => ({
      ...property,
      status:
        decisionByProperty.get(property.id)?.action === "PROPERTY_DECLINED"
          ? "REJECTED"
          : property.status,
      reviewReason:
        decisionByProperty.get(property.id)?.action === "PROPERTY_DECLINED"
          ? getDeclineReason(decisionByProperty.get(property.id)?.details || null)
          : null,
    }));

    return NextResponse.json(
      { properties: propertyRecords },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Owner property list error:", error);
    return NextResponse.json(
      { error: "Could not load your properties." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  try {
    const owner = await getOwner();
    if (!owner) {
      return NextResponse.json(
        { error: "Property owner access required." },
        { status: 403 }
      );
    }

    const parsed = newPropertySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid property details." },
        { status: 400 }
      );
    }

    const values = parsed.data;
    const baseSlug =
      values.name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "property";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          name: values.name,
          slug,
          type: values.type,
          status: PropertyStatus.PENDING,
          description: values.description,
          address: values.address,
          city: values.city,
          stateOrRegion: values.stateOrRegion,
          country: values.country,
          taxId: values.taxId || null,
          registrationNumber: values.registrationNumber || null,
          contactEmail: owner.email,
          contactPhone: owner.phone,
          staff: {
            create: {
              userId: owner.id,
              role: StaffRole.OWNER,
            },
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          city: true,
          stateOrRegion: true,
          country: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: owner.id,
          userEmail: owner.email,
          action: "PROPERTY_SUBMITTED_FOR_REVIEW",
          entity: "Property",
          entityId: created.id,
          details: JSON.stringify({ name: created.name, status: created.status }),
        },
      });

      return created;
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("Owner property submission error:", error);
    return NextResponse.json(
      { error: "Could not submit the property for review." },
      { status: 500 }
    );
  }
}
