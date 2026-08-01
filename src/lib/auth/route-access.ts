import { canAccessPage } from "@/lib/auth/permissions";

export function isPublicPath(pathname: string): boolean {
  const publicPaths = ["/login", "/ayuda"];

  return (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    ) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health")
  );
}

export function hasVerifyBypass(request: Request, pathname: string): boolean {
  const verifySecret = process.env.VERIFY_SECRET;

  return !!(
    verifySecret &&
    request.headers.get("x-verify-secret") === verifySecret &&
    pathname.startsWith("/api/")
  );
}

/** Solo páginas UI (no /api). */
export function canAccessAppPath(
  role: "admin" | "recepcion" | "profesional",
  pathname: string
): boolean {
  if (pathname.startsWith("/api/")) return true;
  return canAccessPage(role, pathname);
}
