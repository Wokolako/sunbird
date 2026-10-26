import type { ServerResponse } from "node:http";
import type { AuthenticatedRequest } from "../auth/auth.middleware";
import { database } from "../database";
import { pmsAccess } from "../../lib/pms";
import { savePropertyImage } from "./image.service";

const json = (response: ServerResponse, status: number, data: unknown) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(data)); };
export function upload(request: AuthenticatedRequest, response: ServerResponse, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || "");
  if (!pmsAccess(database(), request.user!, propertyId, ["manager"])) return json(response, 403, { error: "Property access denied." });
  try { return json(response, 201, { ok: true, image: savePropertyImage(body) }); } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "Image upload failed." }); }
}
