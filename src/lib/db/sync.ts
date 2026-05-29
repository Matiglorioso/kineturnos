import { maxAppDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

export async function recomputePatientLastAppointment(
  patientId: string
): Promise<void> {
  const attended = await prisma.turno.findMany({
    where: { pacienteId: patientId, estado: "atendido" },
    select: { fecha: true },
  });

  const ultimoTurno = maxAppDate(attended.map((t) => t.fecha));

  await prisma.paciente.update({
    where: { id: patientId },
    data: { ultimoTurno },
  });
}

export async function syncTurnoPatientName(
  patientId: string,
  nombre: string
): Promise<void> {
  await prisma.turno.updateMany({
    where: { pacienteId: patientId },
    data: { pacienteNombre: nombre },
  });
}

export async function syncTurnoProfessionalName(
  professionalId: string,
  nombre: string
): Promise<void> {
  await prisma.turno.updateMany({
    where: { profesionalId: professionalId },
    data: { profesionalNombre: nombre },
  });
}
