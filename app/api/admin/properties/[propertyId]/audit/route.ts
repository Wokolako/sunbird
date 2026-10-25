import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { propertyId } = await params;
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        city: true,
        stateOrRegion: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const events = await prisma.auditLog.findMany({
      where: { entityId: propertyId },
      select: {
        id: true,
        action: true,
        entity: true,
        details: true,
        userEmail: true,
        ipAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(
      { property, events },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin property audit error:", error);
    return NextResponse.json(
      { error: "Could not load the property audit trail." },
      { status: 500 }
    );
  }
}
