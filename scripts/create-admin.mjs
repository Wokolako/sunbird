import { PrismaClient } from "@prisma/client";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const clerkUserId = process.env.ADMIN_CLERK_USER_ID?.trim() || undefined;
if (!email) {
  console.error("Set ADMIN_EMAIL to the email used by the administrator in Clerk.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", accountStatus: "ACTIVE", ...(clerkUserId ? { clerkUserId } : {}) },
    create: { email, name: "Platform Admin", role: "ADMIN", accountStatus: "ACTIVE", clerkUserId },
  });
  console.log("Clerk administrator ready:", email);
} finally {
  await prisma.$disconnect();
}
