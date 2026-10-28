import type { ServerResponse } from "node:http";
import type { AuthenticatedRequest } from "../auth/auth.middleware";
import * as platform from "./platform.service";

const json = (response: ServerResponse, status: number, data: unknown) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(data)); };
export async function get(request: AuthenticatedRequest, response: ServerResponse, query: URLSearchParams) {
  try {
    const view = query.get("view") || "session";
    if (view === "session") return json(response, 200, platform.session(request.user || null));
    if (view === "geocode") return json(response, 200, await platform.geocodeLocation(query.get("q") || ""));
    if (view === "search") return json(response, 200, await platform.search(query));
    if (view === "mine") { if (!request.user) return json(response, 401, { error: "Manager sign-in required." }); const data = await platform.managerWorkspace(request.user); return data ? json(response, 200, data) : json(response, 403, { error: "Hotel manager access required." }); }
    if (view === "admin") { if (!request.user) return json(response, 401, { error: "Administrator sign-in required." }); const data = await platform.adminWorkspace(request.user); return data ? json(response, 200, data) : json(response, 403, { error: "Super administrator access required." }); }
    if (view === "document") { if (!request.user) return json(response, 401, { error: "Administrator sign-in required." }); const document = await platform.adminDocument(request.user, query.get("id") || ""); if (!document) return json(response, 404, { error: "Document not found." }); response.writeHead(302, { Location: document.url, "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="${document.filename.replace(/["\r\n]/g, "")}"` }); response.end(); return; }
    if (view === "bookings") { if (!request.user) return json(response, 401, { error: "Guest sign-in required." }); const data = await platform.guestBookings(request.user); return data ? json(response, 200, { bookings: data }) : json(response, 403, { error: "Guest access required." }); }
    if (view === "notifications") { if (!request.user) return json(response, 401, { error: "Sign in required." }); return json(response, 200, { notifications: await platform.getUserNotifications(request.user) }); }
    if (view === "messages") { if (!request.user) return json(response, 401, { error: "Sign in required." }); return json(response, 200, { messages: await platform.getMessages(request.user, query) }); }
    if (view === "invoice") { if (!request.user) return json(response, 401, { error: "Sign in required." }); const inv = await platform.getInvoiceData(request.user, query); return inv ? json(response, 200, inv) : json(response, 404, { error: "Invoice not found." }); }
    return json(response, 404, { error: "Unknown platform view." });
  } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "Could not load platform data." }); }
}
export async function property(response: ServerResponse, propertyId: string) { const data = await platform.publicProperty(propertyId); return data ? json(response, 200, { property: data }) : json(response, 404, { error: "Property not found." }); }
export async function action(request: AuthenticatedRequest, response: ServerResponse, body: Record<string, unknown>) {
  if (!request.user) return json(response, 401, { error: "Sign in to continue." });
  try {
    const actionName = String(body.action || "");
    if (actionName === "create-checkout-session") return json(response, 200, await platform.createCheckoutSession(request.user, body));
    if (actionName === "confirm-payment") return json(response, 200, await platform.confirmBookingPayment(request.user, body));
    if (actionName === "send-message") return json(response, 200, await platform.sendMessage(request.user, body));
    if (actionName === "mark-notifications-read") return json(response, 200, await platform.markNotificationsRead(request.user));
    const data = request.user.role === "admin" ? await platform.adminAction(request.user, body) : actionName === "request-stay" ? await platform.requestStay(request.user, body) : actionName === "booking-status" && request.user.role === "guest" ? await platform.updateBookingStatus(request.user, body) : await platform.managerAction(request.user, body);
    return data ? json(response, 200, { ok: true, ...data, data }) : json(response, 403, { error: "You do not have permission for this action." });
  }
  catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : "The request could not be completed." }); }
}
