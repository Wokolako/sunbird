import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((_auth, request) => {
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
    !(portal === "guest" && path.startsWith("/stays/"))
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
});

export const config = {
  matcher: [
    "/((?!_next(?:/|$)|assets(?:/|$)|images(?:/|$)|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
