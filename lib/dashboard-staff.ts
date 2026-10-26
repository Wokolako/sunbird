import { StaffRole, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleForUser: Partial<Record<UserRole, StaffRole>> = {
  [UserRole.OWNER]: StaffRole.OWNER,
  [UserRole.MANAGER]: StaffRole.MANAGER,
  [UserRole.FRONT_DESK]: StaffRole.FRONT_DESK,
};

export async function getDashboardStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  const staffRole = roleForUser[user.role];
  if (!staffRole) return null;

  return { ...user, staffRole };
}
