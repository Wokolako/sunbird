import { createClerkClient, verifyToken } from "@clerk/backend";
import { config } from "../config";
import { prisma, roleToApi } from "../data/prisma";

export type AuthUser = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "guest";
};

export async function authenticate(authorization?: string): Promise<AuthUser | null> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || (!config.clerkSecretKey && !config.clerkJwtKey)) return null;
  try {
    const claims = await verifyToken(token, {
      secretKey: config.clerkSecretKey || undefined,
      jwtKey: config.clerkJwtKey || undefined,
      authorizedParties: config.clerkAuthorizedParties,
    });
    const clerkUserId = claims.sub;
    if (!clerkUserId) return null;
    let user = await prisma.user.findFirst({
      where: { clerkUserId, accountStatus: "ACTIVE" },
    });
    if (!user && config.clerkSecretKey) {
      const clerk = createClerkClient({ secretKey: config.clerkSecretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email =
        clerkUser.emailAddresses.find(
          (item) => item.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) return null;
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        email.split("@")[0];
      user = await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        update: { clerkUserId, name },
        create: { clerkUserId, name, email: email.toLowerCase(), role: "GUEST" },
      });
    }
    return user
      ? {
          id: user.id,
          clerkUserId: user.clerkUserId!,
          name: user.name || user.email.split("@")[0],
          email: user.email,
          role: roleToApi(user.role),
        }
      : null;
  } catch {
    return null;
  }
}
