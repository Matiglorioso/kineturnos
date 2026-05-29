import { PrismaClient } from "@prisma/client";
import {
  clearAllTables,
  getDefaultUsers,
  resolveSeedPassword,
  seedUsers,
} from "./seed-shared";

const prisma = new PrismaClient();

async function main() {
  const password = resolveSeedPassword({ mode: "minimal" });

  console.log("Seed mínimo — solo usuarios (sin pacientes, profesionales ni turnos)");
  console.log("Limpiando tablas...");
  await clearAllTables(prisma);

  const users = getDefaultUsers(null);
  console.log(`Insertando ${users.length} usuarios...`);
  await seedUsers(prisma, users, password);

  const counts = {
    profesionales: await prisma.profesional.count(),
    pacientes: await prisma.paciente.count(),
    turnos: await prisma.turno.count(),
    usuarios: await prisma.usuario.count(),
  };

  console.log("Seed mínimo completado:", counts);
  console.log("");
  console.log("Usuarios creados:");
  for (const user of users) {
    console.log(`  - ${user.nombre} (${user.email}) · ${user.rol}`);
  }
  console.log("");
  console.log(
    "Registrá profesionales y pacientes desde la app. El usuario profesional queda sin vincular hasta que exista un kinesiólogo en el sistema."
  );
}

main()
  .catch((error) => {
    console.error("Error en seed mínimo:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
