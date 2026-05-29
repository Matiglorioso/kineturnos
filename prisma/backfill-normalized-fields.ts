import { PrismaClient } from "@prisma/client";
import { normalizeDni, normalizeLicense } from "../src/lib/document-validation";

const prisma = new PrismaClient();

async function main() {
  console.log("Backfill de dni_normalizado...");
  const pacientes = await prisma.paciente.findMany();

  for (const paciente of pacientes) {
    await prisma.paciente.update({
      where: { id: paciente.id },
      data: { dniNormalizado: normalizeDni(paciente.dni) },
    });
  }

  console.log("Backfill de matricula_normalizada...");
  const profesionales = await prisma.profesional.findMany();

  for (const profesional of profesionales) {
    if (!profesional.matricula) continue;

    await prisma.profesional.update({
      where: { id: profesional.id },
      data: {
        matriculaNormalizada: normalizeLicense(profesional.matricula),
      },
    });
  }

  console.log("Backfill completado:", {
    pacientes: pacientes.length,
    profesionales: profesionales.length,
  });
}

main()
  .catch((error) => {
    console.error("Error en backfill:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
