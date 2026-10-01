import { randomUUID } from "node:crypto";
import { getRoleLabel } from "@/lib/auth/roles";
import { canAccessClinicalHistory } from "@/lib/auth/permissions";
import type { ApiSessionUser } from "@/lib/auth/require-session";
import {
  canEditClinicalEntry,
  CLINICAL_EDIT_CLOSED_ERROR,
  getClinicalEditDeadline,
  getClinicalSummary,
  type ClinicalEntryInput,
} from "@/lib/clinical-history";
import { compareAppDates, getNowAppMinutes, getTodayAppDate } from "@/lib/date-utils";
import { timeToMinutes } from "@/lib/time-utils";
import { appDateToDb, dbDateToApp, dbTimeToApp } from "@/lib/db/date-codec";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/db/errors";
import { prisma, type DbClient } from "@/lib/prisma";
import type {
  ClinicalAccessLogItem,
  ClinicalEntry,
  ClinicalHistory,
  ClinicalProfile,
  ClinicalSessionOption,
  TreatmentGoal,
} from "@/types";
import type {
  AccionHistoriaClinica,
  FichaClinica,
  HistoriaClinica,
  ObjetivoTratamiento,
} from "@prisma/client";

function mapEntry(record: HistoriaClinica, userId: string, now: Date): ClinicalEntry {
  const editable = canEditClinicalEntry(
    { authorId: record.autorId, createdAt: record.creadoEn },
    userId,
    now
  );
  return {
    id: record.id,
    patientId: record.pacienteId,
    professionalId: record.profesionalId,
    professionalName: record.profesionalNombre,
    appointmentId: record.turnoId,
    authorName: record.autorNombre,
    date: dbDateToApp(record.fecha),
    diagnosis: record.diagnostico,
    treatment: record.tratamiento,
    evolution: record.evolucion,
    createdAt: record.creadoEn.toISOString(),
    updatedAt: record.actualizadoEn.toISOString(),
    editable,
    editableUntil: editable ? getClinicalEditDeadline(record.creadoEn).toISOString() : null,
  };
}

function mapGoal(record: ObjetivoTratamiento): TreatmentGoal {
  return {
    id: record.id,
    description: record.descripcion,
    achieved: record.cumplido,
    achievedAt: record.cumplidoEn?.toISOString() ?? null,
    createdByName: record.creadoPorNombre,
  };
}

function mapProfile(record: FichaClinica): ClinicalProfile {
  return {
    alerts: record.alertas,
    background: record.antecedentes,
    updatedByName: record.actualizadoPorNombre,
    updatedAt: record.actualizadoEn.toISOString(),
  };
}

function authorName(user: ApiSessionUser): string {
  return user.name?.trim() || user.email?.trim() || "Usuario";
}

/**
 * Acceso a la historia clínica de un paciente: el Administrador siempre; el
 * Profesional si tiene o tuvo un turno no cancelado con el paciente.
 */
export async function hasClinicalAccess(
  user: ApiSessionUser,
  patientId: string,
  db: DbClient = prisma
): Promise<boolean> {
  if (user.role !== "profesional") return canAccessClinicalHistory(user.role, false);
  if (!user.professionalId) return false;

  const count = await db.turno.count({
    where: {
      pacienteId: patientId,
      profesionalId: user.professionalId,
      estado: { not: "cancelado" },
    },
  });
  return canAccessClinicalHistory(user.role, count > 0);
}

export async function logClinicalAccess(
  db: DbClient,
  input: {
    patientId: string;
    user: ApiSessionUser;
    action: AccionHistoriaClinica;
    entryId?: string | null;
  }
): Promise<void> {
  await db.accesoHistoriaClinica.create({
    data: {
      id: `acc_${randomUUID()}`,
      pacienteId: input.patientId,
      registroId: input.entryId ?? null,
      usuarioId: input.user.id,
      usuarioNombre: authorName(input.user),
      usuarioRol: getRoleLabel(input.user.role),
      accion: input.action,
    },
  });
}

/** Turnos del paciente que se pueden asociar a un registro nuevo (ya ocurridos, sin registro). */
async function getSessionOptions(
  patientId: string,
  user: ApiSessionUser,
  now: Date
): Promise<ClinicalSessionOption[]> {
  const records = await prisma.turno.findMany({
    where: {
      pacienteId: patientId,
      estado: { notIn: ["cancelado", "ausente"] },
      fecha: { lte: appDateToDb(getTodayAppDate(now)) },
      historiaClinica: null,
      ...(user.role === "profesional" ? { profesionalId: user.professionalId ?? "" } : {}),
    },
    orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    take: 30,
  });

  return records.map((record) => ({
    id: record.id,
    date: dbDateToApp(record.fecha),
    time: dbTimeToApp(record.hora),
    professionalName: record.profesionalNombre,
    status: record.estado,
  }));
}

export async function getClinicalHistoryFromDb(
  patientId: string,
  user: ApiSessionUser,
  now: Date = new Date()
): Promise<ClinicalHistory> {
  const patient = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError("Paciente no encontrado.");

  const records = await prisma.historiaClinica.findMany({
    where: { pacienteId: patientId },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
  });
  const entries = records.map((record) => mapEntry(record, user.id, now));

  const [profile, goals, sessionOptions, nextAppointment] = await Promise.all([
    prisma.fichaClinica.findUnique({ where: { pacienteId: patientId } }),
    prisma.objetivoTratamiento.findMany({
      where: { pacienteId: patientId },
      orderBy: { creadoEn: "asc" },
    }),
    getSessionOptions(patientId, user, now),
    getNextAppointment(patientId, now),
  ]);

  return {
    patient: {
      id: patient.id,
      name: patient.nombre,
      dni: patient.dni,
      insurance: patient.obraSocial,
      phone: patient.telefono,
    },
    entries,
    summary: getClinicalSummary(entries),
    sessionOptions,
    profile: profile ? mapProfile(profile) : null,
    goals: goals.map(mapGoal),
    nextAppointment,
  };
}

/** Próximo turno activo del paciente (de hoy en adelante, sin los que ya empezaron). */
async function getNextAppointment(
  patientId: string,
  now: Date
): Promise<ClinicalHistory["nextAppointment"]> {
  const today = getTodayAppDate(now);
  const upcoming = await prisma.turno.findMany({
    where: {
      pacienteId: patientId,
      estado: { in: ["pendiente", "confirmado"] },
      fecha: { gte: appDateToDb(today) },
    },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    take: 5,
  });
  const next = upcoming.find(
    (record) =>
      dbDateToApp(record.fecha) !== today ||
      timeToMinutes(dbTimeToApp(record.hora)) >= getNowAppMinutes(now)
  );
  return next
    ? {
        date: dbDateToApp(next.fecha),
        time: dbTimeToApp(next.hora),
        professionalName: next.profesionalNombre,
      }
    : null;
}

/** Alertas y antecedentes del paciente: cualquiera con acceso a la historia los actualiza. */
export async function saveClinicalProfileInDb(
  patientId: string,
  input: { alerts: string | null; background: string | null },
  user: ApiSessionUser
): Promise<ClinicalProfile> {
  const record = await prisma.$transaction(async (tx) => {
    const patient = await tx.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError("Paciente no encontrado.");

    const data = {
      alertas: input.alerts,
      antecedentes: input.background,
      actualizadoPorNombre: authorName(user),
    };
    const saved = await tx.fichaClinica.upsert({
      where: { pacienteId: patientId },
      create: { pacienteId: patientId, ...data },
      update: data,
    });
    await logClinicalAccess(tx, { patientId, user, action: "edicion" });
    return saved;
  });
  return mapProfile(record);
}

export async function createTreatmentGoalInDb(
  patientId: string,
  description: string,
  user: ApiSessionUser
): Promise<TreatmentGoal> {
  const record = await prisma.$transaction(async (tx) => {
    const patient = await tx.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError("Paciente no encontrado.");

    const created = await tx.objetivoTratamiento.create({
      data: {
        id: `obj_${randomUUID()}`,
        pacienteId: patientId,
        descripcion: description,
        creadoPorNombre: authorName(user),
      },
    });
    await logClinicalAccess(tx, { patientId, user, action: "alta", entryId: created.id });
    return created;
  });
  return mapGoal(record);
}

export async function updateTreatmentGoalInDb(
  patientId: string,
  goalId: string,
  achieved: boolean,
  user: ApiSessionUser
): Promise<TreatmentGoal> {
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.objetivoTratamiento.findUnique({ where: { id: goalId } });
    if (!existing || existing.pacienteId !== patientId) {
      throw new NotFoundError("Objetivo no encontrado.");
    }
    const updated = await tx.objetivoTratamiento.update({
      where: { id: goalId },
      data: { cumplido: achieved, cumplidoEn: achieved ? new Date() : null },
    });
    await logClinicalAccess(tx, { patientId, user, action: "edicion", entryId: goalId });
    return updated;
  });
  return mapGoal(record);
}

export async function deleteTreatmentGoalInDb(
  patientId: string,
  goalId: string,
  user: ApiSessionUser
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.objetivoTratamiento.findUnique({ where: { id: goalId } });
    if (!existing || existing.pacienteId !== patientId) {
      throw new NotFoundError("Objetivo no encontrado.");
    }
    await tx.objetivoTratamiento.delete({ where: { id: goalId } });
    await logClinicalAccess(tx, { patientId, user, action: "edicion", entryId: goalId });
  });
}

async function resolveSession(
  db: DbClient,
  patientId: string,
  input: ClinicalEntryInput,
  user: ApiSessionUser,
  now: Date
): Promise<{ date: string; professionalId: string | null; turnoId: string | null }> {
  const today = getTodayAppDate(now);

  if (!input.appointmentId) {
    const date = input.date ?? today;
    if (compareAppDates(date, today) > 0) {
      throw new ValidationError("No se puede registrar una sesión con fecha futura.", "date");
    }
    return {
      date,
      professionalId: user.professionalId,
      turnoId: null,
    };
  }

  const turno = await db.turno.findUnique({
    where: { id: input.appointmentId },
    include: { historiaClinica: { select: { id: true } } },
  });
  if (!turno || turno.pacienteId !== patientId) {
    throw new ValidationError("El turno no corresponde a este paciente.", "appointmentId");
  }
  if (user.role === "profesional" && turno.profesionalId !== user.professionalId) {
    throw new ForbiddenError("Solo podés registrar la sesión de tus propios turnos.");
  }
  if (turno.estado === "cancelado" || turno.estado === "ausente") {
    throw new ValidationError(
      "No se registra historia clínica de un turno cancelado o ausente.",
      "appointmentId"
    );
  }
  const date = dbDateToApp(turno.fecha);
  if (compareAppDates(date, today) > 0) {
    throw new ValidationError(
      "El turno todavía no ocurrió: la evolución se registra el día de la sesión o después.",
      "appointmentId"
    );
  }
  if (turno.historiaClinica) {
    throw new ConflictError(
      "Ese turno ya tiene un registro en la historia clínica. Editalo o elegí otra sesión.",
      "appointmentId"
    );
  }

  return { date, professionalId: turno.profesionalId, turnoId: turno.id };
}

export async function createClinicalEntryInDb(
  patientId: string,
  input: ClinicalEntryInput,
  user: ApiSessionUser,
  now: Date = new Date()
): Promise<ClinicalEntry> {
  const record = await prisma.$transaction(async (tx) => {
    const patient = await tx.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError("Paciente no encontrado.");

    const session = await resolveSession(tx, patientId, input, user, now);
    const professional = session.professionalId
      ? await tx.profesional.findUnique({ where: { id: session.professionalId } })
      : null;

    const created = await tx.historiaClinica.create({
      data: {
        id: `hc_${randomUUID()}`,
        pacienteId: patientId,
        profesionalId: professional?.id ?? null,
        profesionalNombre: professional?.nombre ?? null,
        turnoId: session.turnoId,
        autorId: user.id,
        autorNombre: authorName(user),
        fecha: appDateToDb(session.date),
        diagnostico: input.diagnosis,
        tratamiento: input.treatment,
        evolucion: input.evolution,
      },
    });

    await logClinicalAccess(tx, { patientId, user, action: "alta", entryId: created.id });
    return created;
  });

  return mapEntry(record, user.id, now);
}

/** Corrige un registro: solo su autor y dentro de las 24 h. No cambia la sesión ni la fecha. */
export async function updateClinicalEntryInDb(
  patientId: string,
  entryId: string,
  input: ClinicalEntryInput,
  user: ApiSessionUser,
  now: Date = new Date()
): Promise<ClinicalEntry> {
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.historiaClinica.findUnique({ where: { id: entryId } });
    if (!existing || existing.pacienteId !== patientId) {
      throw new NotFoundError("Registro de historia clínica no encontrado.");
    }
    if (
      !canEditClinicalEntry(
        { authorId: existing.autorId, createdAt: existing.creadoEn },
        user.id,
        now
      )
    ) {
      throw new ForbiddenError(CLINICAL_EDIT_CLOSED_ERROR);
    }

    const updated = await tx.historiaClinica.update({
      where: { id: entryId },
      data: {
        diagnostico: input.diagnosis,
        tratamiento: input.treatment,
        evolucion: input.evolution,
      },
    });

    await logClinicalAccess(tx, { patientId, user, action: "edicion", entryId });
    return updated;
  });

  return mapEntry(record, user.id, now);
}

export async function getClinicalAccessLogFromDb(
  patientId: string,
  limit = 100
): Promise<ClinicalAccessLogItem[]> {
  const records = await prisma.accesoHistoriaClinica.findMany({
    where: { pacienteId: patientId },
    orderBy: { fecha: "desc" },
    take: limit,
  });

  return records.map((record) => ({
    id: record.id,
    userName: record.usuarioNombre,
    userRole: record.usuarioRol,
    action: record.accion,
    entryId: record.registroId,
    at: record.fecha.toISOString(),
  }));
}
