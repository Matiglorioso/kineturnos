import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const publicPaths = ["/login", "/proyecto"];

      const isPublic =
        publicPaths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`)
        ) ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health");

      const verifySecret = process.env.VERIFY_SECRET;
      if (
        verifySecret &&
        request.headers.get("x-verify-secret") === verifySecret &&
        pathname.startsWith("/api/")
      ) {
        return true;
      }

      if (isPublic) {
        if (auth && pathname === "/login") {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      return !!auth;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "recepcion" | "profesional";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
