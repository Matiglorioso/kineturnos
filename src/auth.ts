import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { findAuthUserByEmail } from "@/lib/auth/users";
import { recordLoginInDb } from "@/lib/db/users";
import { loginAuditContext, recordAuditEvent } from "@/lib/db/audit";
import { verifyPassword } from "@/lib/auth/password";
import {
  buildLimitKeys,
  clearLoginFailures,
  getClientIp,
  isLoginLocked,
  LoginRateLimitedError,
  registerLoginFailure,
} from "@/lib/auth/login-rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const limitKeys = buildLimitKeys(email, getClientIp(request));
        if (await isLoginLocked(limitKeys)) {
          throw new LoginRateLimitedError();
        }

        const user = await findAuthUserByEmail(email);
        const valid =
          !!user && user.active && (await verifyPassword(password, user.passwordHash));

        const audit = loginAuditContext(user, email, request instanceof Request ? request : undefined);

        if (!user || !valid) {
          await registerLoginFailure(limitKeys);
          await recordAuditEvent(audit, {
            entity: "sesion",
            entityId: user?.id ?? null,
            action: "ingreso_fallido",
            label: email.trim().toLowerCase().slice(0, 200),
          });
          return null;
        }

        await clearLoginFailures(email);
        await recordLoginInDb(user.id);
        await recordAuditEvent(audit, { entity: "sesion", entityId: user.id, action: "ingreso", label: user.email });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          professionalId: user.professionalId ?? null,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
