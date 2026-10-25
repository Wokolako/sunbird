export const PROPERTY_ROLES = [
  "ADMIN",
  "OWNER",
  "MANAGER",
  "FRONT_DESK",
  "HOUSEKEEPER",
] as const;

export type UserRole =
  | "ADMIN"
  | "OWNER"
  | "MANAGER"
  | "FRONT_DESK"
  | "HOUSEKEEPER"
  | "GUEST";

export function canAccessAdmin(role?: string | null): boolean {
  return role === "ADMIN";
}

export function canAccessDashboard(role?: string | null): boolean {
  if (!role) return false;
  return (PROPERTY_ROLES as readonly string[]).includes(role);
}

export function canAccessAccount(isAuthenticated: boolean): boolean {
  return isAuthenticated;
}

export interface RouteAccessEvaluation {
  allowed: boolean;
  redirectUrl?: string;
  requiredRole?: string;
}

export function evaluateRouteAccess(
  pathname: string,
  isAuthenticated: boolean,
  role?: string | null
): RouteAccessEvaluation {
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAccountRoute = pathname.startsWith("/account");

  // Public routes
  if (!isAdminRoute && !isDashboardRoute && !isAccountRoute) {
    return { allowed: true };
  }

  // Unauthenticated user attempting to access protected route
  if (!isAuthenticated) {
    return {
      allowed: false,
      redirectUrl: `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  // Admin route check
  if (isAdminRoute) {
    if (!canAccessAdmin(role)) {
      return {
        allowed: false,
        requiredRole: "ADMIN",
        redirectUrl: `/auth/unauthorized?requiredRole=ADMIN&currentRole=${role || "GUEST"}`,
      };
    }
  }

  // Dashboard route check
  if (isDashboardRoute) {
    if (!canAccessDashboard(role)) {
      return {
        allowed: false,
        requiredRole: "Property Staff / Manager",
        redirectUrl: `/auth/unauthorized?requiredRole=Property+Staff+/+Manager&currentRole=${role || "GUEST"}`,
      };
    }
  }

  // Authenticated user accessing /account or authorized role
  return { allowed: true };
}
