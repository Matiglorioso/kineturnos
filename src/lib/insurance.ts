import type { ParseResult } from "@/lib/api/parse-result";
import { compareAppDates, formatAppDate, isValidAppDate, normalizeAppDate } from "@/lib/date-utils";

export const PARTICULAR = "Particular";

/** "  OSDE   210 " → "osde 210": clave para no duplicar obras sociales en el catálogo. */
export function normalizeInsuranceName(name: string): string {
  return collapseSpaces(name).toLowerCase();
}

export function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export type AuthorizationState = "pendiente" | "aprobada" | "rechazada";

export const AUTHORIZATION_STATE_LABELS: Record<AuthorizationState, string> = {
  pendiente: "En trámite",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

/** Lo que hace falta de una autorización para calcular su estado y su consumo. */
export type AuthorizationUsage = {
  id: string;
  number: string | null;
  state: AuthorizationState;
  sessions: number;
  used: number;
  /** dd-MM-yyyy */
  validFrom: string;
  /** dd-MM-yyyy, o null si no vence. */
  validUntil: string | null;
};

export type CoverageStatus =
  | { kind: "particular" }
  | { kind: "sin-autorizacion" }
  | { kind: "pendiente"; authorization: AuthorizationUsage }
  | { kind: "vigente"; authorization: AuthorizationUsage; remaining: number }
  | { kind: "agotada"; authorization: AuthorizationUsage }
  | { kind: "vencida"; authorization: AuthorizationUsage };

/** Cuántas sesiones quedan para avisar que se está por agotar. */
export const FEW_SESSIONS_LEFT = 2;
/** Días antes del vencimiento para avisar. */
export const EXPIRING_SOON_DAYS = 7;

function byExpiration(a: AuthorizationUsage, b: AuthorizationUsage): number {
  if (a.validUntil && b.validUntil) return compareAppDates(a.validUntil, b.validUntil);
  if (a.validUntil) return -1;
  if (b.validUntil) return 1;
  return compareAppDates(a.validFrom, b.validFrom);
}

function isExpired(authorization: AuthorizationUsage, date: string): boolean {
  return authorization.validUntil !== null && compareAppDates(date, authorization.validUntil) > 0;
}

/**
 * Autorización que consume una sesión atendida en `date`: aprobada, vigente en
 * esa fecha y con sesiones disponibles; si hay varias, la que vence primero.
 */
export function pickAuthorizationForSession(
  authorizations: AuthorizationUsage[],
  date: string
): AuthorizationUsage | null {
  return (
    authorizations
      .filter(
        (item) =>
          item.state === "aprobada" &&
          item.used < item.sessions &&
          compareAppDates(item.validFrom, date) <= 0 &&
          !isExpired(item, date)
      )
      .sort(byExpiration)[0] ?? null
  );
}

/**
 * Estado de la cobertura del paciente con su obra social actual, para avisar
 * (no bloquea): vigente con sesiones, en trámite, agotada, vencida o sin autorización.
 */
export function getCoverageStatus(
  hasInsurance: boolean,
  authorizations: AuthorizationUsage[],
  today: string
): CoverageStatus {
  if (!hasInsurance) return { kind: "particular" };

  const usable = authorizations
    .filter((item) => item.state === "aprobada" && item.used < item.sessions && !isExpired(item, today))
    .sort(byExpiration);
  if (usable[0]) {
    return { kind: "vigente", authorization: usable[0], remaining: usable[0].sessions - usable[0].used };
  }

  const pending = authorizations.find((item) => item.state === "pendiente");
  if (pending) return { kind: "pendiente", authorization: pending };

  const approved = authorizations
    .filter((item) => item.state === "aprobada")
    .sort((a, b) => compareAppDates(b.validFrom, a.validFrom));
  const latest = approved[0];
  if (latest) {
    return latest.used >= latest.sessions
      ? { kind: "agotada", authorization: latest }
      : { kind: "vencida", authorization: latest };
  }

  return { kind: "sin-autorizacion" };
}

function shortDate(date: string): string {
  return formatAppDate(date, "dd/MM/yyyy");
}

/** Días entre hoy y el vencimiento (0 = vence hoy). */
function daysUntil(date: string, today: string): number {
  const [d1, m1, y1] = today.split("-").map(Number);
  const [d2, m2, y2] = date.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export type CoverageSummary = {
  /** "ok": nada que avisar; "warning": por agotarse o por vencer; "alert": no hay sesiones cubiertas. */
  tone: "none" | "ok" | "warning" | "alert";
  label: string;
};

/** Texto corto para chips y avisos. */
export function summarizeCoverage(status: CoverageStatus, today: string): CoverageSummary {
  switch (status.kind) {
    case "particular":
      return { tone: "none", label: "Particular" };
    case "sin-autorizacion":
      return { tone: "alert", label: "Sin autorización cargada" };
    case "pendiente":
      return { tone: "warning", label: "Autorización en trámite" };
    case "agotada":
      return {
        tone: "alert",
        label: `Autorización agotada (${status.authorization.used} de ${status.authorization.sessions} sesiones)`,
      };
    case "vencida":
      return {
        tone: "alert",
        label: `Autorización vencida el ${shortDate(status.authorization.validUntil!)}`,
      };
    case "vigente": {
      const { authorization, remaining } = status;
      const expiry = authorization.validUntil;
      const expiresSoon = expiry !== null && daysUntil(expiry, today) <= EXPIRING_SOON_DAYS;
      const parts = [
        `${remaining} de ${authorization.sessions} ${authorization.sessions === 1 ? "sesión" : "sesiones"} disponibles`,
      ];
      if (expiry) parts.push(`vence ${shortDate(expiry)}`);
      return {
        tone: remaining <= FEW_SESSIONS_LEFT || expiresSoon ? "warning" : "ok",
        label: parts.join(" · "),
      };
    }
  }
}

/** Situación de una autorización puntual (para el listado de autorizaciones). */
export type AuthorizationStatus =
  | "por-renovar"
  | "vigente"
  | "pendiente"
  | "agotada"
  | "vencida"
  | "rechazada";

export const AUTHORIZATION_STATUS_LABELS: Record<AuthorizationStatus, string> = {
  "por-renovar": "Por renovar",
  vigente: "Vigente",
  pendiente: "En trámite",
  agotada: "Agotada",
  vencida: "Vencida",
  rechazada: "Rechazada",
};

/** Orden del listado: primero lo que hay que gestionar. */
export const AUTHORIZATION_STATUS_PRIORITY: AuthorizationStatus[] = [
  "agotada",
  "vencida",
  "por-renovar",
  "pendiente",
  "vigente",
  "rechazada",
];

/**
 * Situación de una autorización: agotada (usó todas sus sesiones), vencida,
 * por renovar (quedan pocas sesiones o vence pronto), vigente, en trámite o rechazada.
 */
export function getAuthorizationStatus(
  authorization: AuthorizationUsage,
  today: string
): AuthorizationStatus {
  if (authorization.state === "rechazada") return "rechazada";
  if (authorization.state === "pendiente") return "pendiente";
  if (authorization.used >= authorization.sessions) return "agotada";
  if (isExpired(authorization, today)) return "vencida";
  const remaining = authorization.sessions - authorization.used;
  const expiresSoon =
    authorization.validUntil !== null && daysUntil(authorization.validUntil, today) <= EXPIRING_SOON_DAYS;
  return remaining <= FEW_SESSIONS_LEFT || expiresSoon ? "por-renovar" : "vigente";
}

export type AuthorizationListFilters = {
  search: string;
  /** Id de la obra social, o "todas". */
  insuranceId: string;
  /** Situación, o "todas". */
  status: AuthorizationStatus | "todas";
};

/** Busca (paciente, DNI o Nº de autorización), filtra y ordena: lo que hay que gestionar primero. */
export function filterAuthorizations<
  T extends {
    patientName: string;
    patientDni: string;
    number: string | null;
    insuranceId: string;
    status: AuthorizationStatus;
    validUntil: string | null;
  },
>(items: T[], filters: AuthorizationListFilters): T[] {
  const query = filters.search.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  return items
    .filter((item) => filters.insuranceId === "todas" || item.insuranceId === filters.insuranceId)
    .filter((item) => filters.status === "todas" || item.status === filters.status)
    .filter(
      (item) =>
        !query ||
        item.patientName.toLowerCase().includes(query) ||
        (item.number?.toLowerCase().includes(query) ?? false) ||
        item.patientDni.includes(query) ||
        (digits.length >= 3 && item.patientDni.replace(/\D/g, "").includes(digits))
    )
    .sort((a, b) => {
      const byStatus =
        AUTHORIZATION_STATUS_PRIORITY.indexOf(a.status) - AUTHORIZATION_STATUS_PRIORITY.indexOf(b.status);
      if (byStatus !== 0) return byStatus;
      if (a.validUntil && b.validUntil) return compareAppDates(a.validUntil, b.validUntil);
      if (a.validUntil) return -1;
      if (b.validUntil) return 1;
      return a.patientName.localeCompare(b.patientName, "es");
    });
}

export type AuthorizationInput = {
  number: string | null;
  state: AuthorizationState;
  sessions: number;
  validFrom: string;
  validUntil: string | null;
  notes: string | null;
};

export const MAX_AUTHORIZED_SESSIONS = 100;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Valida el body de alta o edición de una autorización. */
export function parseAuthorizationInput(body: unknown): ParseResult<AuthorizationInput> {
  if (!body || typeof body !== "object") return { error: "Datos inválidos." };
  const raw = body as Record<string, unknown>;

  const state = (raw.state ?? "pendiente") as AuthorizationState;
  if (!(state in AUTHORIZATION_STATE_LABELS)) {
    return { error: "Estado de autorización inválido.", field: "state" };
  }

  const sessions = Number(raw.sessions);
  if (!Number.isInteger(sessions) || sessions < 1 || sessions > MAX_AUTHORIZED_SESSIONS) {
    return {
      error: `Indicá la cantidad de sesiones autorizadas (de 1 a ${MAX_AUTHORIZED_SESSIONS}).`,
      field: "sessions",
    };
  }

  const validFrom = text(raw.validFrom);
  if (!validFrom || !isValidAppDate(validFrom)) {
    return { error: "Indicá desde qué fecha vale la autorización (dd-mm-aaaa).", field: "validFrom" };
  }

  const validUntil = text(raw.validUntil);
  if (validUntil && !isValidAppDate(validUntil)) {
    return { error: "Fecha de vencimiento inválida (dd-mm-aaaa).", field: "validUntil" };
  }
  if (validUntil && compareAppDates(validUntil, validFrom) < 0) {
    return { error: "El vencimiento no puede ser anterior a la fecha de inicio.", field: "validUntil" };
  }

  return {
    input: {
      number: text(raw.number),
      state,
      sessions,
      validFrom: normalizeAppDate(validFrom),
      validUntil: validUntil ? normalizeAppDate(validUntil) : null,
      notes: text(raw.notes),
    },
  };
}

export const INSURANCE_NAME_MAX_LENGTH = 80;

/** Valida el alta o edición de una obra social del catálogo. */
export function parseInsuranceInput(
  body: unknown
): ParseResult<{ name: string; active: boolean; notes: string | null }> {
  if (!body || typeof body !== "object") return { error: "Datos inválidos." };
  const raw = body as Record<string, unknown>;
  const name = text(raw.name);
  if (!name) return { error: "Escribí el nombre de la obra social.", field: "name" };
  if (name.length > INSURANCE_NAME_MAX_LENGTH) {
    return { error: `El nombre no puede superar los ${INSURANCE_NAME_MAX_LENGTH} caracteres.`, field: "name" };
  }
  if (normalizeInsuranceName(name) === normalizeInsuranceName(PARTICULAR)) {
    return { error: "\"Particular\" significa sin obra social: no hace falta cargarlo.", field: "name" };
  }
  return {
    input: { name: collapseSpaces(name), active: raw.active !== false, notes: text(raw.notes) },
  };
}
