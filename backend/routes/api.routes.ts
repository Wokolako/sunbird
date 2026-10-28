import type { IncomingMessage, ServerResponse } from "node:http";
import { requireAuth, type AuthenticatedRequest } from "../auth/auth.middleware";
import * as pms from "../pms/pms.controller";
import * as properties from "../properties/property.controller";
import * as images from "../uploads/image.controller";
import { readPropertyImage } from "../uploads/image.service";
import { syncClerkWebhook } from "../auth/clerk-webhook.service";
import { authenticate } from "../auth/auth.service";
import * as platform from "../platform/platform.controller";
import { geocode } from "../../lib/maps/mapbox";
import { deliverQueuedNotifications } from "../../lib/notifications/service";

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
};
async function body(request: IncomingMessage) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 8_000_000) throw new Error("Request body is too large.");
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Valid JSON is required.");
  }
}
async function rawBody(request: IncomingMessage) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw;
}

export async function route(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url || "/", "http://localhost");
  if (request.method === "GET" && url.pathname === "/health")
    return json(response, 200, { ok: true });
  if (request.method === "POST" && url.pathname === "/api/jobs/notifications") {
    if (
      !process.env.CRON_SECRET ||
      request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
    )
      return json(response, 401, { error: "Job authorization required." });
    try {
      const results = await deliverQueuedNotifications();
      return json(response, 200, { ok: true, processed: results.length, results });
    } catch (error) {
      return json(response, 500, {
        error: error instanceof Error ? error.message : "Notification job failed.",
      });
    }
  }
  if (request.method === "POST" && url.pathname === "/api/webhooks/clerk") {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers))
        if (typeof value === "string") headers.set(name, value);
      const result = await syncClerkWebhook(headers, await rawBody(request));
      return json(response, 200, { ok: true, ...result });
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Webhook verification failed.",
      });
    }
  }
  const imageMatch = url.pathname.match(/^\/uploads\/([a-f0-9-]+\.(?:jpg|png|webp))$/);
  if (request.method === "GET" && imageMatch) {
    const image = readPropertyImage(imageMatch[1]);
    if (!image) return json(response, 404, { error: "Image not found." });
    response.writeHead(200, {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(image.content);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/platform") {
    const authenticated = request as AuthenticatedRequest;
    authenticated.user = (await authenticate(request.headers.authorization)) || undefined;
    return platform.get(authenticated, response, url.searchParams);
  }
  if (request.method === "GET" && url.pathname === "/api/maps/geocode") {
    const authenticated = request as AuthenticatedRequest;
    if (!(await requireAuth(authenticated, response))) return;
    if (!authenticated.user || authenticated.user.role === "guest")
      return json(response, 403, { error: "Hotel manager access required." });
    try {
      return json(response, 200, {
        results: await geocode(url.searchParams.get("q") || "", {
          country: url.searchParams.get("country") || undefined,
          limit: Number(url.searchParams.get("limit") || 5),
        }),
      });
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Location search failed.",
      });
    }
  }
  const publicPropertyMatch = url.pathname.match(
    /^\/api\/platform\/properties\/([^/]+)$/
  );
  if (request.method === "GET" && publicPropertyMatch)
    return platform.property(response, publicPropertyMatch[1]);
  if (request.method === "POST" && url.pathname === "/api/platform") {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    try {
      return platform.action(
        request as AuthenticatedRequest,
        response,
        await body(request)
      );
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  }
  if (request.method === "POST" && url.pathname === "/api/pms/properties") {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    try {
      return properties.create(
        request as AuthenticatedRequest,
        response,
        await body(request)
      );
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  }
  const propertyMatch = url.pathname.match(
    /^\/api\/pms\/properties\/([^/]+)(?:\/(publish))?$/
  );
  if (
    propertyMatch &&
    ((request.method === "PATCH" && !propertyMatch[2]) ||
      (request.method === "POST" && propertyMatch[2] === "publish"))
  ) {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    if (request.method === "POST")
      return properties.publish(
        request as AuthenticatedRequest,
        response,
        propertyMatch[1]
      );
    try {
      return properties.update(
        request as AuthenticatedRequest,
        response,
        propertyMatch[1],
        await body(request)
      );
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  }
  if (request.method === "POST" && url.pathname === "/api/pms/uploads/images") {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    try {
      return images.upload(
        request as AuthenticatedRequest,
        response,
        await body(request)
      );
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  }
  const match = url.pathname.match(
    /^\/api\/pms\/properties\/([^/]+)\/(dashboard|calendar)$/
  );
  if (request.method === "GET" && match) {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    return match[2] === "dashboard"
      ? pms.dashboard(request as AuthenticatedRequest, response, match[1])
      : pms.calendar(
          request as AuthenticatedRequest,
          response,
          match[1],
          url.searchParams
        );
  }
  if (request.method === "POST" && url.pathname === "/api/pms/actions") {
    if (!(await requireAuth(request as AuthenticatedRequest, response))) return;
    try {
      return pms.action(request as AuthenticatedRequest, response, await body(request));
    } catch (error) {
      return json(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  }
  return json(response, 404, { error: "Route not found." });
}
