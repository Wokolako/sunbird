import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getAdminActor } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET() {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { email: "asc" }],
    });
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin user list error:", error);
    return NextResponse.json(
      { error: "Could not load platform users." },
      { status: 500 }
    );
  }
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

    const parsed = updateRoleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid role update." },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;
    if (userId === actor.id) {
      return NextResponse.json(
        { error: "You cannot change your own administrator role." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!target) throw new Error("USER_NOT_FOUND");

      if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
        const adminCount = await tx.user.count({ where: { role: UserRole.ADMIN } });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          userEmail: actor.email,
          action: "USER_ROLE_UPDATED",
          entity: "User",
          entityId: target.id,
          details: JSON.stringify({
            email: target.email,
            previousRole: target.role,
            newRole: role,
          }),
        },
      });
      return updated;
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "The last administrator cannot be demoted." },
        { status: 409 }
      );
    }
    console.error("Admin role update error:", error);
    return NextResponse.json(
      { error: "Could not update the user's role." },
      { status: 500 }
    );
  }
}
