import { verifyToken } from "@clerk/backend";
import { database } from "../database";
import { config } from "../config";

export type AuthUser = { id: string; clerkUserId: string; name: string; email: string; role: "owner" | "admin" | "guest" };

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
    const user = database().prepare("SELECT id,clerk_user_id,name,email,role FROM users WHERE clerk_user_id=? AND status='active'").get(clerkUserId) as { id: string; clerk_user_id: string; name: string; email: string; role: AuthUser["role"] } | undefined;
    return user ? { id: user.id, clerkUserId: user.clerk_user_id, name: user.name, email: user.email, role: user.role } : null;
  } catch {
    return null;
  }
}
