import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.turno.deleteMany();
  const clearedPatients = await prisma.paciente.updateMany({
    data: { ultimoTurno: null },
  });

  console.log("Turnos eliminados:", deleted.count);
  console.log("Pacientes sin ultimoTurno:", clearedPatients.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
