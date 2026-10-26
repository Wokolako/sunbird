import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { database } from "../database";

export type AuthUser = { id: string; name: string; email: string; role: "owner" | "admin" | "guest" };
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const received = scryptSync(password, salt, expectedBuffer.length);
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export function signIn(email: string, password: string) {
  const db = database();
  const user = db.prepare("SELECT id,name,email,role,password_hash FROM users WHERE email=? AND status='active'").get(email.toLowerCase()) as (AuthUser & { password_hash: string }) | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(tokenHash(token), user.id, expiresAt);
  return { token, expiresAt, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export function authenticate(authorization?: string) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const db = database();
  return db.prepare(`SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'`).get(tokenHash(token), new Date().toISOString()) as AuthUser | undefined;
}

export function signOut(authorization?: string) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (token) database().prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash(token));
}
