import { maxAppDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

/**
 * Recalcula `ultimoTurno` como la fecha más reciente entre todos los turnos
 * del paciente (cualquier estado). Las fechas son dd-MM-yyyy: no se puede
 * ordenar lexicográficamente en SQL.
 */
export async function recomputePatientLastAppointment(
  patientId: string
): Promise<void> {
  const turnos = await prisma.turno.findMany({
    where: { pacienteId: patientId },
    select: { fecha: true },
  });

  const ultimoTurno = maxAppDate(turnos.map((t) => t.fecha));

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
