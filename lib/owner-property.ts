import { StaffRole, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPropertyOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== UserRole.OWNER) return null;

  const owner = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, role: true },
  });

  return owner?.role === UserRole.OWNER ? owner : null;
}

export async function getOwnedProperty(propertyId: string, ownerId: string) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      staff: {
        some: { userId: ownerId, role: StaffRole.OWNER, active: true },
      },
    },
    select: { id: true, name: true },
  });
}
