import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { findAuthUserByEmail } from "@/lib/auth/users";
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

        if (!user || !valid) {
          await registerLoginFailure(limitKeys);
          return null;
        }

        await clearLoginFailures(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          professionalId: user.professionalId ?? null,
        };
      },
    }),
  ],
});
