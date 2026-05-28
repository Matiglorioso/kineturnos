import { prisma } from "../src/lib/prisma";

async function main() {
  const tables = await prisma.$queryRaw<
    { table_name: string }[]
  >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;

  console.log("Tablas en public:");
  for (const row of tables) {
    console.log(" -", row.table_name);
  }

  const columns = await prisma.$queryRaw<
    { table_name: string; column_name: string }[]
  >`SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('pacientes', 'turnos', 'profesionales')
    ORDER BY table_name, ordinal_position`;

  console.log("\nColumnas:");
  for (const row of columns) {
    console.log(` ${row.table_name}.${row.column_name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
