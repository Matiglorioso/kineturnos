/**
 * Auditoría (seguridad y auditoría de la tesis): qué se registra de cada
 * cambio y cómo se muestra. Lógica pura; la escritura en la base está en
 * src/lib/db/audit.ts.
 *
 * Solo se guardan los campos listados en AUDIT_FIELDS (lista blanca): así
 * nunca entra al registro un hash de contraseña ni una contraseña temporal.
 */

export type AuditEntity =
  | "turno"
  | "paciente"
  | "profesional"
  | "obra_social"
  | "autorizacion"
  | "historia_clinica"
  | "ficha_clinica"
  | "objetivo"
  | "usuario"
  | "sesion";

/** Igual al enum AccionAuditoria de Prisma. */
export type AuditAction =
  | "alta"
  | "modificacion"
  | "baja"
  | "cambio_estado"
  | "ingreso"
  | "ingreso_fallido"
  | "cambio_password"
  | "restablecimiento_password";

type FieldKind = "text" | "date" | "time" | "bool" | "list";

interface FieldSpec {
  label: string;
  kind?: FieldKind;
}

export const AUDIT_FIELDS: Record<AuditEntity, Record<string, FieldSpec>> = {
  turno: {
    pacienteNombre: { label: "Paciente" },
    profesionalNombre: { label: "Profesional" },
    fecha: { label: "Fecha", kind: "date" },
    hora: { label: "Hora", kind: "time" },
    estado: { label: "Estado" },
    tipoSesion: { label: "Tipo de sesión" },
    observaciones: { label: "Observaciones" },
  },
  paciente: {
    nombrePila: { label: "Nombre" },
    apellido: { label: "Apellido" },
    dni: { label: "DNI" },
    cuil: { label: "CUIL" },
    fechaNacimiento: { label: "Fecha de nacimiento", kind: "date" },
    telefono: { label: "Teléfono" },
    email: { label: "Email" },
    obraSocial: { label: "Obra social" },
    nroAfiliado: { label: "N° de afiliado" },
    planObraSocial: { label: "Plan" },
    estado: { label: "Estado" },
    observaciones: { label: "Observaciones" },
  },
  profesional: {
    nombrePila: { label: "Nombre" },
    apellido: { label: "Apellido" },
    matricula: { label: "Matrícula" },
    especialidad: { label: "Especialidad" },
    email: { label: "Email" },
    telefono: { label: "Teléfono" },
    diasAtencion: { label: "Días de atención", kind: "list" },
    activo: { label: "Activo", kind: "bool" },
    observaciones: { label: "Observaciones" },
  },
  obra_social: {
    nombre: { label: "Nombre" },
    activo: { label: "Activa", kind: "bool" },
    observaciones: { label: "Observaciones" },
  },
  autorizacion: {
    obraSocialNombre: { label: "Obra social" },
    numero: { label: "Número" },
    estado: { label: "Estado" },
    sesiones: { label: "Sesiones" },
    fechaDesde: { label: "Desde", kind: "date" },
    vencimiento: { label: "Vencimiento", kind: "date" },
    observaciones: { label: "Observaciones" },
  },
  historia_clinica: {
    fecha: { label: "Fecha", kind: "date" },
    diagnostico: { label: "Diagnóstico" },
    tratamiento: { label: "Plan de tratamiento" },
    evolucion: { label: "Evolución" },
  },
  ficha_clinica: {
    alertas: { label: "Alertas" },
    antecedentes: { label: "Antecedentes" },
  },
  objetivo: {
    descripcion: { label: "Objetivo" },
    cumplido: { label: "Cumplido", kind: "bool" },
  },
  usuario: {
    nombre: { label: "Nombre" },
    email: { label: "Email" },
    rol: { label: "Perfil" },
    profesionalNombre: { label: "Profesional vinculado" },
    activo: { label: "Activo", kind: "bool" },
  },
  sesion: {},
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  turno: "Turno",
  paciente: "Paciente",
  profesional: "Profesional",
  obra_social: "Obra social",
  autorizacion: "Autorización",
  historia_clinica: "Historia clínica",
  ficha_clinica: "Alertas y antecedentes",
  objetivo: "Objetivo de tratamiento",
  usuario: "Usuario",
  sesion: "Ingreso al sistema",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  alta: "Alta",
  modificacion: "Modificación",
  baja: "Baja",
  cambio_estado: "Cambio de estado",
  ingreso: "Ingresó",
  ingreso_fallido: "Ingreso fallido",
  cambio_password: "Cambió su contraseña",
  restablecimiento_password: "Restableció la contraseña",
};

export interface AuditChange {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
}

export type AuditSnapshot = Record<string, unknown>;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Valor legible y comparable. Las columnas DATE y TIME llegan de Prisma como
 * Date en UTC: se leen las partes UTC para no correr el día ni la hora.
 */
export function formatAuditValue(value: unknown, kind: FieldKind = "text"): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    if (kind === "time") return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
    if (kind === "date") {
      return `${pad(value.getUTCDate())}-${pad(value.getUTCMonth() + 1)}-${value.getUTCFullYear()}`;
    }
    return value.toISOString();
  }

  if (kind === "bool" || typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : null;

  const text = String(value).trim();
  return text === "" ? null : text;
}

/**
 * Campos que cambiaron entre dos fotos del registro. En un alta (sin "antes")
 * quedan los datos cargados; en una baja (sin "después"), los que tenía.
 */
export function diffAuditSnapshots(
  entity: AuditEntity,
  before: AuditSnapshot | null,
  after: AuditSnapshot | null
): AuditChange[] {
  const changes: AuditChange[] = [];

  for (const [field, spec] of Object.entries(AUDIT_FIELDS[entity])) {
    const previous = before ? formatAuditValue(before[field], spec.kind) : null;
    const next = after ? formatAuditValue(after[field], spec.kind) : null;
    if (previous === next) continue;
    changes.push({ field, label: spec.label, before: previous, after: next });
  }

  return changes;
}

/** Un cambio que solo toca el estado se registra como "cambio de estado". */
export function resolveAuditAction(requested: AuditAction, changes: AuditChange[]): AuditAction {
  if (requested !== "modificacion") return requested;
  return changes.length > 0 && changes.every((change) => change.field === "estado")
    ? "cambio_estado"
    : "modificacion";
}

/** Una modificación que no cambió nada no se registra (p. ej. guardar sin tocar). */
export function shouldRecordAudit(action: AuditAction, changes: AuditChange[]): boolean {
  if (action === "modificacion" || action === "cambio_estado") return changes.length > 0;
  return true;
}

/** Períodos del filtro de la pantalla, en días hacia atrás (incluye hoy). */
export const AUDIT_PERIODS = [
  { days: 1, label: "Hoy" },
  { days: 7, label: "Últimos 7 días" },
  { days: 30, label: "Últimos 30 días" },
  { days: 90, label: "Últimos 90 días" },
  { days: 365, label: "Último año" },
] as const;

export const DEFAULT_AUDIT_PERIOD_DAYS = 7;
/** Tope de filas por consulta: si se alcanza, la pantalla pide acotar el período. */
export const AUDIT_MAX_ROWS = 2000;

export function parseAuditPeriodDays(raw: string | null): number {
  const days = Number(raw);
  return AUDIT_PERIODS.some((period) => period.days === days) ? days : DEFAULT_AUDIT_PERIOD_DAYS;
}

/**
 * Inicio del período en Buenos Aires: "Hoy" arranca a las 00:00 de hoy; "7 días",
 * a las 00:00 de hace 6 días. Argentina no tiene horario de verano (UTC-3 fijo).
 */
export function auditPeriodStart(days: number, now: Date = new Date()): Date {
  const BUENOS_AIRES_OFFSET_MS = 3 * 60 * 60 * 1000;
  const local = new Date(now.getTime() - BUENOS_AIRES_OFFSET_MS);
  const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (days - 1));
  return new Date(startLocal + BUENOS_AIRES_OFFSET_MS);
}

export interface AuditEntryFilters {
  userKey: string;
  entity: AuditEntity | "todas";
}

export const DEFAULT_AUDIT_FILTERS: AuditEntryFilters = { userKey: "todos", entity: "todas" };

/** Clave del usuario para filtrar: el id, o el nombre si no es un usuario (paciente, intento fallido). */
export function auditUserKey(entry: { userId: string | null; userName: string }): string {
  return entry.userId ?? `nombre:${entry.userName}`;
}

export function filterAuditEntries<T extends { userId: string | null; userName: string; entity: AuditEntity }>(
  entries: T[],
  filters: AuditEntryFilters
): T[] {
  return entries.filter(
    (entry) =>
      (filters.userKey === "todos" || auditUserKey(entry) === filters.userKey) &&
      (filters.entity === "todas" || entry.entity === filters.entity)
  );
}
