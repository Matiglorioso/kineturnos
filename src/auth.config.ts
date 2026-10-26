import type { RolUsuario } from "@prisma/client";
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
    authorized: () => true,
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.professionalId = user.professionalId ?? null;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      // Después de cambiar la contraseña temporal. Solo afecta la redirección:
      // la API lo vuelve a verificar contra la base en cada llamada.
      if (trigger === "update" && session?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as RolUsuario;
        session.user.professionalId =
          (token.professionalId as string | null | undefined) ?? null;
        session.user.mustChangePassword = token.mustChangePassword === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
