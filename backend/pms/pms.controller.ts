import type { ServerResponse } from "node:http";
import type { AuthenticatedRequest } from "../auth/auth.middleware";
import * as pms from "./pms.service";

const json = (response: ServerResponse, status: number, data: unknown) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(data)); };
export async function dashboard(request: AuthenticatedRequest, response: ServerResponse, propertyId: string) { const data = await pms.dashboard(request.user!, propertyId); return data ? json(response, 200, data) : json(response, 403, { error: "Property access denied." }); }
export async function calendar(request: AuthenticatedRequest, response: ServerResponse, propertyId: string, query: URLSearchParams) { const data = await pms.calendar(request.user!, propertyId, query.get("roomId") || "", query.get("start") || "", query.get("end") || ""); return data ? json(response, 200, data) : json(response, 400, { error: "Invalid calendar request or property access denied." }); }
export async function action(request: AuthenticatedRequest, response: ServerResponse, body: Record<string, unknown>) {
  try {
    const services: Record<string, (user: NonNullable<typeof request.user>, input: Record<string, unknown>) => Promise<unknown>> = {
      "create-room-type": pms.createRoomType,
      "update-availability": pms.updateAvailability,
      "quick-update-day": pms.quickUpdateDay,
      "create-unit": pms.createUnit,
      "set-unit-status": pms.setUnitStatus,
      "create-rate-plan": pms.createRatePlan,
      "create-rate-rule": pms.createRateRule,
      "create-task": pms.createTask,
      "update-task-status": pms.updateTaskStatus,
      quote: pms.quote,
      "upsert-staff": pms.upsertStaff,
      "resend-invite": pms.resendInvite,
      "update-staff-permissions": pms.updateStaffPermissions,
      "assign-room": pms.assignRoom,
    };
    const service = services[String(body.action || "")]; if (!service) return json(response, 404, { error: "Unknown PMS action." });
    const data = await service(request.user!, body); return data ? json(response, 200, { ok: true, data }) : json(response, 403, { error: "Property access denied." });
  } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "PMS request failed." }); }
}
