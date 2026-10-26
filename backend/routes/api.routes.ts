import type { IncomingMessage, ServerResponse } from "node:http";
import { signIn, signOut } from "../auth/auth.service";
import { requireAuth, type AuthenticatedRequest } from "../auth/auth.middleware";
import * as pms from "../pms/pms.controller";

const json = (response: ServerResponse, status: number, body: unknown) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); };
async function body(request: IncomingMessage) {
  let raw = ""; for await (const chunk of request) raw += chunk; if (!raw) return {}; try { return JSON.parse(raw) as Record<string, unknown>; } catch { throw new Error("Valid JSON is required."); }
}

export async function route(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url || "/", "http://localhost");
  if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true });
  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    try { const input = await body(request); const result = signIn(String(input.email || ""), String(input.password || "")); return result ? json(response, 200, result) : json(response, 401, { error: "Invalid email or password." }); } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "Invalid request." }); }
  }
  if (request.method === "POST" && url.pathname === "/api/auth/logout") { signOut(request.headers.authorization); return json(response, 200, { ok: true }); }
  const match = url.pathname.match(/^\/api\/pms\/properties\/([^/]+)\/(dashboard|calendar)$/);
  if (request.method === "GET" && match) {
    if (!requireAuth(request as AuthenticatedRequest, response)) return;
    return match[2] === "dashboard" ? pms.dashboard(request as AuthenticatedRequest, response, match[1]) : pms.calendar(request as AuthenticatedRequest, response, match[1], url.searchParams);
  }
  if (request.method === "POST" && url.pathname === "/api/pms/actions") {
    if (!requireAuth(request as AuthenticatedRequest, response)) return;
    try { return pms.action(request as AuthenticatedRequest, response, await body(request)); } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "Invalid request." }); }
  }
  return json(response, 404, { error: "Route not found." });
}
