import { authConfig } from "@/auth.config";
import {
  canAccessAppPath,
  hasVerifyBypass,
  isPublicPath,
} from "@/lib/auth/route-access";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const PASSWORD_CHANGE_PATH = "/cambiar-contrasena";

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (hasVerifyBypass(req, pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (req.auth?.user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Iniciá sesión." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("reason", "auth_required");
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Contraseña temporal: hasta cambiarla, cualquier página lleva al cambio.
  if (
    req.auth.user.mustChangePassword &&
    !pathname.startsWith("/api/") &&
    pathname !== PASSWORD_CHANGE_PATH
  ) {
    return NextResponse.redirect(new URL(PASSWORD_CHANGE_PATH, req.url));
  }

  const role = req.auth.user.role;
  if (!pathname.startsWith("/api/") && !canAccessAppPath(role, pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
