import { PrismaClient } from "@prisma/client";
import {
  assertDatabaseEmptyOrForced,
  getDefaultUsers,
  resolveSeedPassword,
  upsertUsers,
} from "./seed-shared";

const prisma = new PrismaClient();

/**
 * Seed mínimo (go-live): solo los usuarios iniciales. Nunca borra datos.
 * Con datos existentes aborta; con --force crea los usuarios que falten y
 * restablece la contraseña de los que ya existen.
 */
async function main() {
  const password = resolveSeedPassword({ mode: "minimal" });

  console.log("Seed mínimo — solo usuarios (sin pacientes, profesionales ni turnos)");
  await assertDatabaseEmptyOrForced(
    prisma,
    "npm run db:seed:minimal -- --force (no borra datos: crea los usuarios que falten y restablece su contraseña)"
  );

  const users = getDefaultUsers(null);
  console.log(`Creando o actualizando ${users.length} usuarios...`);
  await upsertUsers(prisma, users, password);

  const counts = {
    profesionales: await prisma.profesional.count(),
    pacientes: await prisma.paciente.count(),
    turnos: await prisma.turno.count(),
    usuarios: await prisma.usuario.count(),
  };

  console.log("Seed mínimo completado:", counts);
  console.log("");
  console.log("Usuarios:");
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
