import { prisma } from "@/lib/prisma";

/** Verifica que la conexión a Neon/Postgres funcione. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
