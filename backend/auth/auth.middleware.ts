import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticate, type AuthUser } from "./auth.service";

export type AuthenticatedRequest = IncomingMessage & { user?: AuthUser };

export function requireAuth(request: AuthenticatedRequest, response: ServerResponse) {
  const user = authenticate(request.headers.authorization);
  if (!user) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Authentication required." }));
    return false;
  }
  request.user = user;
  return true;
}
