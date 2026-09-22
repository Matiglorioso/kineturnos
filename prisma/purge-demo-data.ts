import { PrismaClient } from "@prisma/client";
import { mockPatients } from "./fixtures/mockPatients";
import { mockProfessionals } from "./fixtures/mockProfessionals";

const prisma = new PrismaClient();

const mockPatientIds = mockPatients.map((patient) => patient.id);
const mockProfessionalIds = mockProfessionals.map(
  (professional) => professional.id
);

async function main() {
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

  const clearedUltimoTurno = await prisma.paciente.updateMany({
    where: { ultimoTurno: { not: null } },
    data: { ultimoTurno: null },
  });

  console.log("Datos demo eliminados:", {
    turnos: turnos.count,
    pacientes: pacientes.count,
    profesionales: profesionales.count,
    ultimoTurnoLimpiadoEnOtrosPacientes: clearedUltimoTurno.count,
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
  });
