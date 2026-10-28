import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

function portalRouting(request: NextRequest) {
  const portal = process.env.APP_PORTAL || "guest";
  const path = request.nextUrl.pathname;
  const backendProxy = path.startsWith("/api/backend/");
  const allowed =
    portal === "admin"
      ? ["/", "/admin", "/api/platform", "/api/pms"]
      : portal === "management"
        ? ["/", "/manager", "/api/platform", "/api/pms"]
        : [
            "/",
            "/search",
            "/saved",
            "/bookings",
            "/account",
            "/hotels",
            "/resorts",
            "/api/platform",
            "/api/stripe/webhook",
          ];
  if (
    !backendProxy &&
    !allowed.includes(path) &&
    !(
      portal === "guest" &&
      (path.startsWith("/stays/") ||
        path.startsWith("/bookings/") ||
        path.startsWith("/booking/"))
    )
  )
    return new NextResponse("This page is not available in this portal.", {
      status: 404,
    });
  if (path === "/" && portal !== "guest") {
    const url = request.nextUrl.clone();
    url.pathname = portal === "admin" ? "/admin" : "/manager";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export default function middleware(request: NextRequest, event: any) {
  if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY.startsWith("sk_")) {
    return clerkMiddleware((_auth, req) => portalRouting(req as unknown as NextRequest))(request, event);
  }
  return portalRouting(request);
}

export const config = {
  matcher: [
    "/((?!_next(?:/|$)|assets(?:/|$)|images(?:/|$)|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
