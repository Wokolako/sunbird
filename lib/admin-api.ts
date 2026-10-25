import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminActor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "ADMIN") return null;

  return prisma.user
    .findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    })
    .then((user) => (user?.role === "ADMIN" ? user : null));
}
