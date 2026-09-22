import { prisma } from "@/lib/prisma";
import { CredentialsSignin } from "next-auth";

/**
 * Rate limiting de login persistido en PostgreSQL (serverless-safe: no depende
 * de memoria de una instancia). Cuenta fallos por email y por IP dentro de una
 * ventana; al superar el máximo bloquea la clave durante LOCK_MINUTES.
 */
const WINDOW_MINUTES = 15;
const LOCK_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

export const LOGIN_RATE_LIMITED_CODE = "rate_limited";

export class LoginRateLimitedError extends CredentialsSignin {
  code = LOGIN_RATE_LIMITED_CODE;
}

type LimitKey = { key: string; max: number };

export function getClientIp(request?: Request): string | null {
  if (!request) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return ip || null;
}

export function buildLimitKeys(email: string, ip: string | null): LimitKey[] {
  const keys: LimitKey[] = [
    { key: `email:${email.trim().toLowerCase()}`, max: MAX_FAILURES_PER_EMAIL },
  ];
  if (ip) keys.push({ key: `ip:${ip}`, max: MAX_FAILURES_PER_IP });
  return keys;
}

export async function isLoginLocked(keys: LimitKey[]): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ clave: string }[]>`
    SELECT clave FROM login_intentos
    WHERE clave = ANY(${keys.map((k) => k.key)}::text[])
      AND bloqueado_hasta IS NOT NULL
      AND bloqueado_hasta > NOW()
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function registerLoginFailure(keys: LimitKey[]): Promise<void> {
  const now = Date.now();
  const windowCutoff = new Date(now - WINDOW_MINUTES * 60_000);
  const lockUntil = new Date(now + LOCK_MINUTES * 60_000);

  for (const { key, max } of keys) {
    await prisma.$executeRaw`
      INSERT INTO login_intentos (clave, fallos, ventana_inicio, bloqueado_hasta)
      VALUES (${key}, 1, NOW(), NULL)
      ON CONFLICT (clave) DO UPDATE SET
        fallos = CASE
          WHEN login_intentos.ventana_inicio < ${windowCutoff} THEN 1
          ELSE login_intentos.fallos + 1
        END,
        ventana_inicio = CASE
          WHEN login_intentos.ventana_inicio < ${windowCutoff} THEN NOW()
          ELSE login_intentos.ventana_inicio
        END,
        bloqueado_hasta = CASE
          WHEN login_intentos.ventana_inicio >= ${windowCutoff}
            AND login_intentos.fallos + 1 >= ${max}
          THEN ${lockUntil}
          ELSE login_intentos.bloqueado_hasta
        END
    `;
  }
}

export async function clearLoginFailures(email: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM login_intentos
    WHERE clave = ${`email:${email.trim().toLowerCase()}`}
       OR (bloqueado_hasta IS NULL AND ventana_inicio < NOW() - INTERVAL '1 day')
  `;
}
