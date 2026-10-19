import { prisma, type DbClient } from "@/lib/prisma";

/**
 * Serializa las escrituras de turnos que tocan al mismo paciente o profesional
 * (advisory locks de transacción): validar + escribir queda atómico frente a
 * altas concurrentes. Se toman primero los de pacientes y después los de
 * profesionales, en orden, para no generar deadlocks.
 */
export async function withAppointmentLocks<T>(
  patientIds: string[],
  professionalIds: string[],
  fn: (tx: DbClient) => Promise<T>
): Promise<T> {
  const keys = [
    ...[...new Set(patientIds)].sort().map((id) => `turno:paciente:${id}`),
    ...[...new Set(professionalIds)].sort().map((id) => `turno:profesional:${id}`),
  ];

  return prisma.$transaction(
    async (tx) => {
      for (const key of keys) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
      }
      return fn(tx);
    },
    { timeout: 15_000 }
  );
}
