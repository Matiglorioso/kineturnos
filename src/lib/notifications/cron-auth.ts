import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/**
 * El cron (GitHub Actions) se autentica con `Authorization: Bearer <CRON_SECRET>`.
 * Sin CRON_SECRET configurado, el endpoint queda cerrado.
 */
export function isAuthorizedCronRequest(
  authorization: string | null,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  const expected = secret?.trim();
  if (!expected || !authorization?.startsWith("Bearer ")) return false;

  const received = authorization.slice("Bearer ".length).trim();
  return timingSafeEqual(digest(received), digest(expected));
}
