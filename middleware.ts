import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { evaluateRouteAccess } from "@/lib/auth-guard";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract JWT token session
  const token = await getToken({
    req,
    secret:
      process.env.NEXTAUTH_SECRET ||
      "development-secret-change-me-in-production-at-least-32-chars-long",
  });

  const isAuthenticated = !!token;
  const userRole = (token?.role as string) || null;

  // Evaluate route permissions using shared auth-guard logic
  const evaluation = evaluateRouteAccess(pathname, isAuthenticated, userRole);

  if (!evaluation.allowed && evaluation.redirectUrl) {
    const redirectUrl = new URL(evaluation.redirectUrl, req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*"],
};
