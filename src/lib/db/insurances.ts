import { createHash, randomUUID } from "node:crypto";
import type { ApiSessionUser } from "@/lib/auth/require-session";
import { getTodayAppDate } from "@/lib/date-utils";
import { appDateToDb, dbDateToApp, optionalDbDateToApp } from "@/lib/db/date-codec";
import {
  DeleteBlockedError,
  DuplicateFieldError,
  NotFoundError,
  ValidationError,
} from "@/lib/db/errors";
import { withAppointmentLocks } from "@/lib/db/locks";
import {
  collapseSpaces,
  getAuthorizationStatus,
  getCoverageStatus,
  normalizeInsuranceName,
  PARTICULAR,
  pickAuthorizationForSession,
  summarizeCoverage,
  type AuthorizationInput,
  type AuthorizationUsage,
} from "@/lib/insurance";
import { prisma, type DbClient } from "@/lib/prisma";
import type {
  AttendanceReport,
  Authorization,
  AuthorizationListItem,
  Insurance,
  PatientCoverage,
} from "@/types";
import type { Autorizacion, ObraSocial } from "@prisma/client";

/** Id estable por nombre normalizado: igual al que usa la migración (`'os-' || md5(...)`). */
export function insuranceIdFor(name: string): string {
  return `os-${createHash("md5").update(normalizeInsuranceName(name)).digest("hex")}`;
}

/**
 * Vincula los pacientes a la obra social del catálogo según el nombre escrito,
 * creando las que falten (misma lógica que la migración). Para seeds y scripts.
 */
export async function linkPatientsToInsuranceCatalog(db: DbClient | typeof prisma = prisma) {
  await db.$executeRawUnsafe(`
    INSERT INTO "obras_sociales" ("id", "nombre", "nombre_normalizado")
    SELECT 'os-' || md5(n.norm), n.nombre, n.norm
    FROM (
      SELECT DISTINCT ON (lower(regexp_replace(btrim("obra_social"), '\\s+', ' ', 'g')))
        lower(regexp_replace(btrim("obra_social"), '\\s+', ' ', 'g')) AS norm,
        regexp_replace(btrim("obra_social"), '\\s+', ' ', 'g') AS nombre
      FROM "pacientes"
      WHERE btrim("obra_social") <> '' AND lower(btrim("obra_social")) <> 'particular'
      ORDER BY 1, 2
    ) n
    ON CONFLICT ("nombre_normalizado") DO NOTHING`);
  await db.$executeRawUnsafe(`
    UPDATE "pacientes" p
    SET "obra_social_id" = os."id", "obra_social" = os."nombre"
    FROM "obras_sociales" os
    WHERE p."obra_social_id" IS NULL
      AND os."nombre_normalizado" = lower(regexp_replace(btrim(p."obra_social"), '\\s+', ' ', 'g'))`);
}

// ---------------------------------------------------------------- Catálogo

function mapInsurance(record: ObraSocial & { _count: { pacientes: number } }): Insurance {
  return {
    id: record.id,
    name: record.nombre,
    active: record.activo,
    notes: record.observaciones,
    patientCount: record._count.pacientes,
  };
}

export async function getInsurancesFromDb(): Promise<Insurance[]> {
  const records = await prisma.obraSocial.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pacientes: true } } },
  });
  return records.map(mapInsurance);
}

const DUPLICATE_INSURANCE = "Ya existe una obra social con ese nombre.";

export async function createInsuranceInDb(input: {
  name: string;
  active: boolean;
  notes: string | null;
}): Promise<Insurance> {
  const normalized = normalizeInsuranceName(input.name);
  if (await prisma.obraSocial.findUnique({ where: { nombreNormalizado: normalized } })) {
    throw new DuplicateFieldError("name", DUPLICATE_INSURANCE);
  }
  const record = await prisma.obraSocial.create({
    data: {
      id: insuranceIdFor(input.name),
      nombre: input.name,
      nombreNormalizado: normalized,
      activo: input.active,
      observaciones: input.notes,
    },
    include: { _count: { select: { pacientes: true } } },
  });
  return mapInsurance(record);
}

/** Renombrar actualiza el nombre guardado en los pacientes (está desnormalizado). */
export async function updateInsuranceInDb(
  id: string,
  input: { name: string; active: boolean; notes: string | null }
): Promise<Insurance> {
  const normalized = normalizeInsuranceName(input.name);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.obraSocial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Obra social no encontrada.");
    const clash = await tx.obraSocial.findUnique({ where: { nombreNormalizado: normalized } });
    if (clash && clash.id !== id) throw new DuplicateFieldError("name", DUPLICATE_INSURANCE);

    const record = await tx.obraSocial.update({
      where: { id },
      data: { nombre: input.name, nombreNormalizado: normalized, activo: input.active, observaciones: input.notes },
      include: { _count: { select: { pacientes: true } } },
    });
    if (existing.nombre !== input.name) {
      await tx.paciente.updateMany({ where: { obraSocialId: id }, data: { obraSocial: input.name } });
    }
    return mapInsurance(record);
  });
}

/** Solo se borra si nadie la usa; si no, se desactiva. */
export async function deleteInsuranceFromDb(id: string): Promise<void> {
  const record = await prisma.obraSocial.findUnique({
    where: { id },
    include: { _count: { select: { pacientes: true, autorizaciones: true } } },
  });
  if (!record) throw new NotFoundError("Obra social no encontrada.");
  if (record._count.pacientes > 0 || record._count.autorizaciones > 0) {
    throw new DeleteBlockedError(
      "No se puede eliminar: hay pacientes o autorizaciones con esta obra social. Desactivala para que no se pueda elegir más."
    );
  }
  await prisma.obraSocial.delete({ where: { id } });
}

/**
 * Obra social del paciente a partir de lo que mande el formulario: el id del
 * catálogo, o (por compatibilidad) el nombre escrito, que se busca o se crea.
 */
export async function resolvePatientInsurance(
  db: DbClient,
  input: { insuranceId?: string | null; insurance?: string }
): Promise<{ obraSocialId: string | null; obraSocial: string }> {
  if (input.insuranceId) {
    const record = await db.obraSocial.findUnique({ where: { id: input.insuranceId } });
    if (!record) throw new ValidationError("La obra social elegida no existe.", "insuranceId");
    return { obraSocialId: record.id, obraSocial: record.nombre };
  }
  if (input.insuranceId === null || !input.insurance?.trim()) {
    return { obraSocialId: null, obraSocial: PARTICULAR };
  }

  const name = collapseSpaces(input.insurance);
  if (normalizeInsuranceName(name) === normalizeInsuranceName(PARTICULAR)) {
    return { obraSocialId: null, obraSocial: PARTICULAR };
  }
  const normalized = normalizeInsuranceName(name);
  const record =
    (await db.obraSocial.findUnique({ where: { nombreNormalizado: normalized } })) ??
    (await db.obraSocial.create({
      data: { id: insuranceIdFor(name), nombre: name, nombreNormalizado: normalized },
    }));
  return { obraSocialId: record.id, obraSocial: record.nombre };
}

// ---------------------------------------------------------------- Autorizaciones

type AutorizacionWithUsage = Autorizacion & {
  obraSocial: { nombre: string };
  _count: { turnos: number };
};

const withUsage = {
  obraSocial: { select: { nombre: true } },
  _count: { select: { turnos: true } },
} as const;

function toUsage(record: AutorizacionWithUsage): AuthorizationUsage {
  return {
    id: record.id,
    number: record.numero,
    state: record.estado,
    sessions: record.sesiones,
    used: record._count.turnos,
    validFrom: dbDateToApp(record.fechaDesde),
    validUntil: optionalDbDateToApp(record.vencimiento) ?? null,
  };
}

function mapAuthorization(record: AutorizacionWithUsage, currentInsuranceId: string | null): Authorization {
  const usage = toUsage(record);
  return {
    id: record.id,
    patientId: record.pacienteId,
    insuranceId: record.obraSocialId,
    insuranceName: record.obraSocial.nombre,
    number: usage.number,
    state: usage.state,
    sessions: usage.sessions,
    used: usage.used,
    validFrom: usage.validFrom,
    validUntil: usage.validUntil,
    notes: record.observaciones,
    createdByName: record.creadoPorNombre,
    current: record.obraSocialId === currentInsuranceId,
  };
}

export function coverageFor(
  insuranceId: string | null,
  authorizations: AuthorizationUsage[],
  today: string = getTodayAppDate()
): PatientCoverage {
  const status = getCoverageStatus(insuranceId !== null, authorizations, today);
  return { kind: status.kind, ...summarizeCoverage(status, today) };
}

/** Cobertura de varios pacientes de una vez (para la lista). */
export async function getCoverageByPatient(
  patients: { id: string; obraSocialId: string | null }[]
): Promise<Map<string, PatientCoverage>> {
  const withInsurance = patients.filter((patient) => patient.obraSocialId);
  const records = withInsurance.length
    ? await prisma.autorizacion.findMany({
        where: { pacienteId: { in: withInsurance.map((patient) => patient.id) } },
        include: withUsage,
      })
    : [];
  const today = getTodayAppDate();
  return new Map(
    patients.map((patient) => [
      patient.id,
      coverageFor(
        patient.obraSocialId,
        records
          .filter((record) => record.pacienteId === patient.id && record.obraSocialId === patient.obraSocialId)
          .map(toUsage),
        today
      ),
    ])
  );
}

export async function getPatientAuthorizationsFromDb(
  patientId: string
): Promise<{ authorizations: Authorization[]; coverage: PatientCoverage }> {
  const patient = await prisma.paciente.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError("Paciente no encontrado.");
  const records = await prisma.autorizacion.findMany({
    where: { pacienteId: patientId },
    include: withUsage,
    orderBy: [{ fechaDesde: "desc" }, { creadoEn: "desc" }],
  });
  return {
    authorizations: records.map((record) => mapAuthorization(record, patient.obraSocialId)),
    coverage: coverageFor(
      patient.obraSocialId,
      records.filter((record) => record.obraSocialId === patient.obraSocialId).map(toUsage)
    ),
  };
}

/** Todas las autorizaciones, con el paciente y su situación (RF15). */
export async function getAllAuthorizationsFromDb(): Promise<AuthorizationListItem[]> {
  const records = await prisma.autorizacion.findMany({
    include: {
      ...withUsage,
      paciente: { select: { nombre: true, dni: true, obraSocialId: true } },
    },
  });
  const today = getTodayAppDate();
  return records.map((record) => ({
    ...mapAuthorization(record, record.paciente.obraSocialId),
    patientName: record.paciente.nombre,
    patientDni: record.paciente.dni,
    status: getAuthorizationStatus(toUsage(record), today),
  }));
}

/**
 * Vincula a una autorización las sesiones atendidas del paciente que todavía
 * no tienen una, en orden de fecha, siguiendo `pickAuthorizationForSession`.
 * Corre con el lock del paciente tomado.
 */
async function assignUnassignedSessions(tx: DbClient, patientId: string, obraSocialId: string | null) {
  if (!obraSocialId) return;
  const records = await tx.autorizacion.findMany({
    where: { pacienteId: patientId, obraSocialId },
    include: withUsage,
  });
  const usages = records.map(toUsage);
  if (!usages.some((usage) => usage.state === "aprobada" && usage.used < usage.sessions)) return;

  const sessions = await tx.turno.findMany({
    where: { pacienteId: patientId, estado: "atendido", autorizacionId: null },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    select: { id: true, fecha: true },
  });
  for (const session of sessions) {
    const picked = pickAuthorizationForSession(usages, dbDateToApp(session.fecha));
    if (!picked) continue;
    await tx.turno.update({ where: { id: session.id }, data: { autorizacionId: picked.id } });
    picked.used += 1;
  }
}

/** Al pasar un turno a atendido: descuenta una sesión de la autorización vigente (si hay). */
export async function assignSessionForAppointment(
  tx: DbClient,
  turno: { id: string; pacienteId: string; fecha: Date; estado: string; autorizacionId: string | null }
) {
  if (turno.estado !== "atendido" || turno.autorizacionId) return;
  const patient = await tx.paciente.findUnique({
    where: { id: turno.pacienteId },
    select: { obraSocialId: true },
  });
  if (!patient?.obraSocialId) return;
  const records = await tx.autorizacion.findMany({
    where: { pacienteId: turno.pacienteId, obraSocialId: patient.obraSocialId },
    include: withUsage,
  });
  const picked = pickAuthorizationForSession(records.map(toUsage), dbDateToApp(turno.fecha));
  if (picked) {
    await tx.turno.update({ where: { id: turno.id }, data: { autorizacionId: picked.id } });
  }
}

function authorizationData(input: AuthorizationInput) {
  return {
    numero: input.number,
    estado: input.state,
    sesiones: input.sessions,
    fechaDesde: appDateToDb(input.validFrom, "validFrom"),
    vencimiento: input.validUntil ? appDateToDb(input.validUntil, "validUntil") : null,
    observaciones: input.notes,
  };
}

function authorName(user: ApiSessionUser): string {
  return user.name?.trim() || user.email?.trim() || "Usuario";
}

/** Alta de una autorización para la obra social actual del paciente. */
export async function createAuthorizationInDb(
  patientId: string,
  input: AuthorizationInput,
  user: ApiSessionUser
): Promise<Authorization> {
  return withAppointmentLocks([patientId], [], async (tx) => {
    const patient = await tx.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError("Paciente no encontrado.");
    if (!patient.obraSocialId) {
      throw new ValidationError(
        "El paciente es particular: cargale primero la obra social en su ficha.",
        "insuranceId"
      );
    }

    const created = await tx.autorizacion.create({
      data: {
        id: `aut_${randomUUID()}`,
        pacienteId: patientId,
        obraSocialId: patient.obraSocialId,
        creadoPorNombre: authorName(user),
        ...authorizationData(input),
      },
    });
    // Las sesiones ya atendidas dentro del período (y sin autorización) la consumen.
    await assignUnassignedSessions(tx, patientId, patient.obraSocialId);

    const record = await tx.autorizacion.findUniqueOrThrow({ where: { id: created.id }, include: withUsage });
    return mapAuthorization(record, patient.obraSocialId);
  });
}

/**
 * Edición: se liberan sus sesiones y se vuelven a asignar con los datos nuevos
 * (fechas, cantidad o estado). No se puede bajar la cantidad por debajo de lo usado.
 */
export async function updateAuthorizationInDb(
  patientId: string,
  authorizationId: string,
  input: AuthorizationInput
): Promise<Authorization> {
  return withAppointmentLocks([patientId], [], async (tx) => {
    const existing = await tx.autorizacion.findUnique({ where: { id: authorizationId }, include: withUsage });
    if (!existing || existing.pacienteId !== patientId) {
      throw new NotFoundError("Autorización no encontrada.");
    }
    if (input.state === "aprobada" && input.sessions < existing._count.turnos) {
      throw new ValidationError(
        `Ya se usaron ${existing._count.turnos} sesiones de esta autorización: la cantidad no puede ser menor.`,
        "sessions"
      );
    }

    await tx.turno.updateMany({ where: { autorizacionId: authorizationId }, data: { autorizacionId: null } });
    await tx.autorizacion.update({ where: { id: authorizationId }, data: authorizationData(input) });
    await assignUnassignedSessions(tx, patientId, existing.obraSocialId);

    const patient = await tx.paciente.findUniqueOrThrow({ where: { id: patientId } });
    const record = await tx.autorizacion.findUniqueOrThrow({ where: { id: authorizationId }, include: withUsage });
    return mapAuthorization(record, patient.obraSocialId);
  });
}

/** Al borrarla, sus sesiones quedan libres y pasan a otra autorización vigente si hay. */
export async function deleteAuthorizationFromDb(patientId: string, authorizationId: string): Promise<void> {
  await withAppointmentLocks([patientId], [], async (tx) => {
    const existing = await tx.autorizacion.findUnique({ where: { id: authorizationId } });
    if (!existing || existing.pacienteId !== patientId) {
      throw new NotFoundError("Autorización no encontrada.");
    }
    await tx.autorizacion.delete({ where: { id: authorizationId } });
    const patient = await tx.paciente.findUniqueOrThrow({ where: { id: patientId } });
    await assignUnassignedSessions(tx, patientId, patient.obraSocialId);
  });
}

// ---------------------------------------------------------------- Planilla mensual

/**
 * Sesiones atendidas en el mes para una obra social: las que consumieron una
 * autorización de esa obra social, y las que no tienen autorización pero son
 * de pacientes con esa obra social (se marcan "sin autorización").
 */
export async function getAttendanceReportFromDb(
  insuranceId: string,
  month: string
): Promise<AttendanceReport> {
  const insurance = await prisma.obraSocial.findUnique({ where: { id: insuranceId } });
  if (!insurance) throw new NotFoundError("Obra social no encontrada.");
  const [year, monthNumber] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, monthNumber - 1, 1));
  const to = new Date(Date.UTC(year, monthNumber, 0));

  const sessions = await prisma.turno.findMany({
    where: {
      estado: "atendido",
      fecha: { gte: from, lte: to },
      OR: [
        { autorizacion: { obraSocialId: insuranceId } },
        { autorizacionId: null, paciente: { obraSocialId: insuranceId } },
      ],
    },
    include: {
      paciente: { select: { id: true, nombre: true, dni: true, nroAfiliado: true, planObraSocial: true } },
      autorizacion: { select: { numero: true } },
    },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  const rows = new Map<string, AttendanceReport["rows"][number]>();
  for (const session of sessions) {
    const row = rows.get(session.pacienteId) ?? {
      patientId: session.paciente.id,
      patientName: session.paciente.nombre,
      dni: session.paciente.dni,
      affiliateNumber: session.paciente.nroAfiliado,
      plan: session.paciente.planObraSocial,
      authorizationNumbers: [],
      dates: [],
      withoutAuthorization: 0,
    };
    row.dates.push(dbDateToApp(session.fecha));
    if (!session.autorizacionId) row.withoutAuthorization += 1;
    const number = session.autorizacion?.numero;
    if (number && !row.authorizationNumbers.includes(number)) row.authorizationNumbers.push(number);
    rows.set(session.pacienteId, row);
  }

  return {
    insurance: { id: insurance.id, name: insurance.nombre },
    month,
    rows: [...rows.values()].sort((a, b) => a.patientName.localeCompare(b.patientName, "es")),
    totalSessions: sessions.length,
  };
}
