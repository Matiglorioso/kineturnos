/**
 * ATENCIÓN: borra pacientes y profesionales del seed (fixtures), no solo turnos.
 * Para vaciar solo turnos usá npm run db:clear-turnos.
 */
import { PrismaClient } from "@prisma/client";
import { recomputePatientLastAppointment } from "../src/lib/db/sync";
import { prisma as appPrisma } from "../src/lib/prisma";
import { mockPatients } from "./fixtures/mockPatients";
import { mockProfessionals } from "./fixtures/mockProfessionals";

const prisma = new PrismaClient();

const mockPatientIds = mockPatients.map((patient) => patient.id);
const mockProfessionalIds = mockProfessionals.map(
  (professional) => professional.id
);

async function main() {
  // Pacientes reales que tienen turnos con profesionales demo: al borrar esos
  // turnos hay que recalcular su último turno (y solo el de ellos).
  const affected = await prisma.turno.findMany({
    where: {
      profesionalId: { in: mockProfessionalIds },
      pacienteId: { notIn: mockPatientIds },
    },
    select: { pacienteId: true },
    distinct: ["pacienteId"],
  });

  const turnos = await prisma.turno.deleteMany({
    where: {
      OR: [
        { pacienteId: { in: mockPatientIds } },
        { profesionalId: { in: mockProfessionalIds } },
      ],
    },
  });

  const pacientes = await prisma.paciente.deleteMany({
    where: { id: { in: mockPatientIds } },
  });

  const profesionales = await prisma.profesional.deleteMany({
    where: { id: { in: mockProfessionalIds } },
  });

  for (const { pacienteId } of affected) {
    await recomputePatientLastAppointment(pacienteId);
  }

  console.log("Datos demo eliminados:", {
    turnos: turnos.count,
    pacientes: pacientes.count,
    profesionales: profesionales.count,
    ultimoTurnoRecalculadoEnPacientesReales: affected.length,
  });
  console.log(
    "Usuarios de login no se tocaron. Vinculá el usuario profesional desde la app cuando cargues kinesiólogos reales."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await appPrisma.$disconnect();
  });
