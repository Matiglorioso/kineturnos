import { mapAppointment } from "@/lib/db/mappers";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/db/errors";
import {
  resolveAppointmentId,
  toAppointmentFormInput,
  toTurnoWriteData,
  type AppointmentWriteInput,
} from "@/lib/db/appointment-write";
import { getProfessionalsFromDb } from "@/lib/db/professionals";
import { recomputePatientLastAppointment } from "@/lib/db/sync";
import { isFinalAppointmentStatus } from "@/lib/appointment-status";
import {
  APPOINTMENT_OVERLAP_ERROR,
  validateAppointmentForm,
  validateAppointmentStatusChange,
} from "@/lib/appointment-validation";
import { prisma, type DbClient } from "@/lib/prisma";
import type { Appointment, AppointmentStatus } from "@/types";
import { Prisma } from "@prisma/client";

export type { AppointmentWriteInput } from "@/lib/db/appointment-write";
export { appointmentToWriteInput } from "@/lib/db/appointment-write";

export async function getAppointmentsFromDb(
  options?: { professionalId?: string },
  db: DbClient = prisma
): Promise<Appointment[]> {
  const records = await db.turno.findMany({
    where: options?.professionalId
      ? { profesionalId: options.professionalId }
      : undefined,
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  return records.map(mapAppointment);
}

export async function getAppointmentByIdFromDb(
  id: string,
  db: DbClient = prisma
): Promise<Appointment | null> {
  const record = await db.turno.findUnique({ where: { id } });
  return record ? mapAppointment(record) : null;
}

/**
 * Serializa las escrituras de turnos que tocan al mismo paciente o profesional
 * (advisory locks de transacción): validar + escribir queda atómico frente a
 * altas concurrentes. Se toman primero los de pacientes y después los de
 * profesionales, en orden, para no generar deadlocks.
 */
async function withAppointmentLocks<T>(
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

async function resolveAppointmentNames(
  patientId: string,
  professionalId: string,
  db: DbClient = prisma
) {
  const [paciente, profesional] = await Promise.all([
    db.paciente.findUnique({ where: { id: patientId } }),
    db.profesional.findUnique({ where: { id: professionalId } }),
  ]);

  if (!paciente) {
    throw new NotFoundError("Paciente no encontrado.");
  }

  if (!profesional) {
    throw new NotFoundError("Profesional no encontrado.");
  }

  return {
    pacienteNombre: paciente.nombre,
    profesionalNombre: profesional.nombre,
  };
}

function isTurnoProfessionalSlotViolation(
  error: Prisma.PrismaClientKnownRequestError
): boolean {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return (
      target.includes("turno_profesional_slot") ||
      (target.includes("profesional_id") &&
        target.includes("fecha") &&
        target.includes("hora"))
    );
  }
  if (typeof target === "string") {
    return target.includes("turno_profesional_slot");
  }
  return false;
}

function rethrowTurnoSlotUniqueViolation(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    isTurnoProfessionalSlotViolation(error)
  ) {
    throw new ConflictError(APPOINTMENT_OVERLAP_ERROR, "overlap");
  }
  throw error;
}

/** Lanza el primer error de validación; un choque de horario es un conflicto (409). */
function throwFirstValidationError(errors: Record<string, string | undefined>): void {
  const firstErrorEntry = Object.entries(errors).find(([, message]) => message);
  if (!firstErrorEntry) return;

  const [field, message] = firstErrorEntry;
  if (field === "overlap") throw new ConflictError(message!, field);
  throw new ValidationError(message!, field);
}

export async function assertAppointmentInputValid(
  input: AppointmentWriteInput,
  excludeId?: string,
  db: DbClient = prisma
): Promise<void> {
  // create/update pasan por validateAppointmentForm (días de atención + overlap).
  const [appointments, professionals, existing] = await Promise.all([
    getAppointmentsFromDb(undefined, db),
    getProfessionalsFromDb(db),
    excludeId ? getAppointmentByIdFromDb(excludeId, db) : Promise.resolve(null),
  ]);

  const errors = validateAppointmentForm(
    toAppointmentFormInput(input),
    appointments,
    professionals,
    excludeId,
    existing
      ? { previousDate: existing.date, previousTime: existing.time }
      : undefined
  );

  throwFirstValidationError(errors);
}

export async function createAppointmentInDb(
  input: AppointmentWriteInput
): Promise<Appointment> {
  const record = await withAppointmentLocks(
    [input.patientId],
    [input.professionalId],
    async (tx) => {
      await assertAppointmentInputValid(input, undefined, tx);
      const names = await resolveAppointmentNames(
        input.patientId,
        input.professionalId,
        tx
      );

      try {
        return await tx.turno.create({
          data: {
            id: resolveAppointmentId(input),
            ...toTurnoWriteData(input, names),
          },
        });
      } catch (error) {
        rethrowTurnoSlotUniqueViolation(error);
      }
    }
  );

  if (input.status === "atendido") {
    await recomputePatientLastAppointment(input.patientId);
  }

  return mapAppointment(record);
}

export async function updateAppointmentInDb(
  id: string,
  input: AppointmentWriteInput
): Promise<Appointment> {
  const existing = await getAppointmentByIdFromDb(id);
  if (!existing) {
    throw new NotFoundError("Turno no encontrado.");
  }

  const record = await withAppointmentLocks(
    [existing.patientId, input.patientId],
    [existing.professionalId, input.professionalId],
    async (tx) => {
      await assertAppointmentInputValid(input, id, tx);
      const names = await resolveAppointmentNames(
        input.patientId,
        input.professionalId,
        tx
      );

      try {
        return await tx.turno.update({
          where: { id },
          data: toTurnoWriteData(input, names),
        });
      } catch (error) {
        rethrowTurnoSlotUniqueViolation(error);
      }
    }
  );

  const statusChanged = existing.status !== input.status;
  const patientChanged = existing.patientId !== input.patientId;

  if (
    statusChanged ||
    patientChanged ||
    existing.status === "atendido" ||
    input.status === "atendido"
  ) {
    const patientIds = new Set([existing.patientId, input.patientId]);
    await Promise.all(
      [...patientIds].map((patientId) => recomputePatientLastAppointment(patientId))
    );
  }

  return mapAppointment(record);
}

export async function updateAppointmentStatusInDb(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const existing = await getAppointmentByIdFromDb(id);
  if (!existing) {
    throw new NotFoundError("Turno no encontrado.");
  }

  const record = await withAppointmentLocks(
    [existing.patientId],
    [existing.professionalId],
    async (tx) => {
      // Solo reglas de estado: no se revalida contra la agenda actual del profesional.
      const errors = validateAppointmentStatusChange(
        existing,
        status,
        await getAppointmentsFromDb(undefined, tx)
      );
      throwFirstValidationError(errors);

      try {
        return await tx.turno.update({
          where: { id },
          data: { estado: status },
        });
      } catch (error) {
        rethrowTurnoSlotUniqueViolation(error);
      }
    }
  );

  if (existing.status === "atendido" || status === "atendido") {
    await recomputePatientLastAppointment(existing.patientId);
  }

  return mapAppointment(record);
}

/**
 * Elimina el turno de forma permanente.
 * Solo permitido para estados finales (atendido / cancelado / ausente).
 */
export async function deleteAppointmentFromDb(id: string): Promise<Appointment> {
  const existing = await getAppointmentByIdFromDb(id);
  if (!existing) {
    throw new NotFoundError("Turno no encontrado.");
  }

  if (!isFinalAppointmentStatus(existing.status)) {
    throw new ValidationError(
      "Solo se pueden eliminar turnos en estado final (atendido, cancelado o ausente). Cancelá el turno activo primero.",
      "status"
    );
  }

  await prisma.turno.delete({ where: { id } });
  await recomputePatientLastAppointment(existing.patientId);

  return existing;
}
