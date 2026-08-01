/**
 * Normaliza nombres de pacientes a Title Case (es-AR).
 * También actualiza el snapshot `paciente_nombre` en turnos.
 *
 * Uso (con DATABASE_URL apuntando a Neon):
 *   npx tsx prisma/backfill-patient-names.ts
 *   npm run db:backfill-patient-names
 *
 * Por defecto es dry-run (solo lista cambios). Pasá --apply para escribir.
 */
import { PrismaClient } from "@prisma/client";
import { toTitleCaseName } from "../src/lib/person-name";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const pacientes = await prisma.paciente.findMany();
  let patientsToUpdate = 0;
  let appointmentsToUpdate = 0;

  console.log(
    apply
      ? "Aplicando Title Case a nombres de pacientes…"
      : "Dry-run: revisá los cambios. Ejecutá con --apply para escribir en Neon."
  );

  for (const paciente of pacientes) {
    const firstName = toTitleCaseName(
      paciente.nombrePila?.trim() || paciente.nombre.split(/\s+/)[0] || ""
    );
    const lastName = toTitleCaseName(
      paciente.apellido?.trim() ||
        paciente.nombre.split(/\s+/).slice(1).join(" ") ||
        ""
    );
    const fullName = `${firstName} ${lastName}`.trim();

    const needsPatientUpdate =
      paciente.nombre !== fullName ||
      (paciente.nombrePila ?? null) !== (firstName || null) ||
      (paciente.apellido ?? null) !== (lastName || null);

    if (!needsPatientUpdate) continue;

    patientsToUpdate += 1;
    console.log(`  paciente ${paciente.id}: "${paciente.nombre}" → "${fullName}"`);

    if (apply) {
      await prisma.paciente.update({
        where: { id: paciente.id },
        data: {
          nombre: fullName,
          nombrePila: firstName || null,
          apellido: lastName || null,
        },
      });
    }

    const turnos = await prisma.turno.findMany({
      where: { pacienteId: paciente.id },
      select: { id: true, pacienteNombre: true },
    });

    for (const turno of turnos) {
      if (turno.pacienteNombre === fullName) continue;
      appointmentsToUpdate += 1;
      if (apply) {
        await prisma.turno.update({
          where: { id: turno.id },
          data: { pacienteNombre: fullName },
        });
      }
    }
  }

  console.log(
    apply
      ? {
          pacientesActualizados: patientsToUpdate,
          turnosActualizados: appointmentsToUpdate,
        }
      : {
          pacientesQueCambiarian: patientsToUpdate,
          turnosQueCambiarian: appointmentsToUpdate,
          hint: "npx tsx prisma/backfill-patient-names.ts --apply",
        }
  );
}

main()
  .catch((error) => {
    console.error("Error en backfill de nombres:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
