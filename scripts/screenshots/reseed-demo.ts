/**
 * Vuelve a cargar los datos de demostración en la base de una demo que ya está corriendo
 * (`npm run demo`), sin reiniciarla: vacía las tablas (salvo la auditoría, que es
 * inmutable) y corre el mismo seed.
 *
 *   npx tsx scripts/screenshots/reseed-demo.ts kineturnos_demo_1234567890
 *
 * Solo acepta bases descartables de la demo (`kineturnos_demo_…`) en el servidor de
 * DATABASE_URL (.env.local, la rama de pruebas de Neon), nunca la de producción.
 */
import { PrismaClient } from "@prisma/client";
import { seedDemo } from "./demo-data";

async function main() {
  const name = process.argv[2];
  if (!name || !/^kineturnos_demo_\d+$/.test(name)) {
    throw new Error("Pasá el nombre de la base de la demo (kineturnos_demo_…), el que muestra `npm run demo`.");
  }
  process.loadEnvFile?.(".env.local");
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error("Falta DATABASE_URL (.env.local).");
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "20");

  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations', 'auditoria')`;
    const list = tables.map((table) => `"public"."${table.tablename}"`).join(", ");
    await db.$executeRawUnsafe(`TRUNCATE ${list} CASCADE`);
    const password = process.env.SEED_INITIAL_PASSWORD?.trim() || "demo1234";
    const demo = await seedDemo(db, password);
    console.log(`Demo recargada. Paciente destacado: ${demo.featuredPatientName} (${demo.featuredPatientId})`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
