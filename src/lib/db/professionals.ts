import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/appointment-status";
import { dbDateToApp } from "@/lib/db/date-codec";
import { mapProfessional } from "@/lib/db/mappers";
import { DeleteBlockedError, DuplicateFieldError } from "@/lib/db/errors";
import {
  professionalToWriteInput,
  resolveProfessionalId,
  toProfesionalWriteData,
  type ProfessionalWriteInput,
} from "@/lib/db/professional-write";
import { syncTurnoProfessionalName } from "@/lib/db/sync";
import {
  activeAppointmentsBlockMessage,
  appointmentsOnRemovedDays,
  removedDaysBlockMessage,
  removedWorkDays,
} from "@/lib/deactivation-rules";
import {
  DUPLICATE_LICENSE_MESSAGE,
  normalizeLicense,
} from "@/lib/document-validation";
import { prisma, type DbClient } from "@/lib/prisma";
import type { Professional } from "@/types";

export type { ProfessionalWriteInput } from "@/lib/db/professional-write";
export { professionalToWriteInput } from "@/lib/db/professional-write";

export async function getProfessionalsFromDb(
  db: DbClient = prisma
): Promise<Professional[]> {
  const records = await db.profesional.findMany({
    orderBy: { nombre: "asc" },
  });

  return records.map(mapProfessional);
}

export async function getProfessionalByIdFromDb(
  id: string
): Promise<Professional | null> {
  const record = await prisma.profesional.findUnique({ where: { id } });
  return record ? mapProfessional(record) : null;
}

export async function assertProfessionalLicenseAvailable(
  license: string,
  excludeId?: string
): Promise<void> {
  const matriculaNormalizada = normalizeLicense(license);
  if (!matriculaNormalizada) return;

  const existing = await prisma.profesional.findUnique({
    where: { matriculaNormalizada },
  });

  if (existing && existing.id !== excludeId) {
    throw new DuplicateFieldError("license", DUPLICATE_LICENSE_MESSAGE);
  }
}

export async function createProfessionalInDb(
  input: ProfessionalWriteInput
): Promise<Professional> {
  await assertProfessionalLicenseAvailable(input.license);

  const record = await prisma.profesional.create({
    data: {
      id: resolveProfessionalId(input),
      ...toProfesionalWriteData(input),
    },
  });

  return mapProfessional(record);
}

export async function updateProfessionalInDb(
  id: string,
  input: ProfessionalWriteInput
): Promise<Professional> {
  await assertProfessionalLicenseAvailable(input.license, id);

  const existing = await getProfessionalByIdFromDb(id);
  const writeData = toProfesionalWriteData(input);

  if (existing) await assertProfessionalChangeAllowed(id, existing, input);

  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.profesional.update({ where: { id }, data: writeData });
    // Su usuario acompaña al profesional: se desactiva con él y vuelve con él.
    if (existing && existing.active !== input.active) {
      await tx.usuario.updateMany({ where: { profesionalId: id }, data: { activo: input.active } });
    }
    return updated;
  });

  if (existing && existing.name !== writeData.nombre) {
    await syncTurnoProfessionalName(id, writeData.nombre);
  }

  return mapProfessional(record);
}

/**
 * Con turnos activos no se puede desactivar al profesional ni sacarle un día de atención
 * en el que ya tiene turnos: quedarían turnos fuera de su agenda.
 */
async function assertProfessionalChangeAllowed(
  id: string,
  existing: Professional,
  input: ProfessionalWriteInput
): Promise<void> {
  const deactivating = existing.active && !input.active;
  const removedDays = removedWorkDays(existing.days, input.days);
  if (!deactivating && removedDays.length === 0) return;

  const active = await prisma.turno.findMany({
    where: { profesionalId: id, estado: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
    select: { fecha: true },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  if (deactivating) {
    const blocked = activeAppointmentsBlockMessage("profesional", active.length);
    if (blocked) throw new DeleteBlockedError(blocked);
  }

  const dates = appointmentsOnRemovedDays(
    active.map((turno) => ({ date: dbDateToApp(turno.fecha) })),
    removedDays
  );
  const blocked = removedDaysBlockMessage(removedDays, dates);
  if (blocked) throw new DeleteBlockedError(blocked);
}

export async function countProfessionalAppointmentsInDb(
  professionalId: string
): Promise<number> {
  return prisma.turno.count({ where: { profesionalId: professionalId } });
}

export async function countProfessionalActiveAppointmentsInDb(
  professionalId: string
): Promise<number> {
  return prisma.turno.count({
    where: {
      profesionalId: professionalId,
      estado: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
  });
}

/**
 * Elimina el profesional. Bloquea si tiene turnos activos (pendiente/confirmado).
 * Si solo hay turnos finales (atendido/cancelado/ausente), se borran en cascada.
 */
export async function deleteProfessionalFromDb(id: string): Promise<number> {
  const activeCount = await countProfessionalActiveAppointmentsInDb(id);

  if (activeCount > 0) {
    throw new DeleteBlockedError(
      `No se puede eliminar el profesional porque tiene ${activeCount} turno(s) activo(s) (pendiente o confirmado). Cancelalos o atendelos antes de eliminar.`
    );
  }

  const deletedAppointments = await countProfessionalAppointmentsInDb(id);
  await prisma.profesional.delete({ where: { id } });
  return deletedAppointments;
}
