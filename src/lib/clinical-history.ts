import type { ParseResult } from "@/lib/api/parse-result";
import {
  NONEXISTENT_DATE_MESSAGE,
  compareAppDates,
  isAppDateFormat,
  isValidAppDate,
  normalizeAppDate,
} from "@/lib/date-utils";

/** El autor puede corregir un registro durante este tiempo; después queda cerrado. */
export const CLINICAL_EDIT_WINDOW_HOURS = 24;

export const CLINICAL_TEXT_MAX_LENGTH = 4000;

export const CLINICAL_EDIT_CLOSED_ERROR =
  "Este registro ya no se puede editar: solo su autor lo corrige, y dentro de las 24 h. Cargá la corrección como un registro nuevo.";

export const CLINICAL_ACCESS_DENIED_ERROR =
  "Solo podés ver la historia clínica de pacientes con los que tenés o tuviste turnos.";

/** Hasta cuándo el autor puede corregir un registro. */
export function getClinicalEditDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + CLINICAL_EDIT_WINDOW_HOURS * 60 * 60 * 1000);
}

export function canEditClinicalEntry(
  entry: { authorId: string; createdAt: Date },
  userId: string,
  now: Date = new Date()
): boolean {
  if (entry.authorId !== userId) return false;
  // Puede dar unos ms negativo: `now` es del servidor y creado_en lo pone la base.
  const elapsed = now.getTime() - entry.createdAt.getTime();
  return elapsed < CLINICAL_EDIT_WINDOW_HOURS * 60 * 60 * 1000;
}

export type ClinicalEntryInput = {
  appointmentId: string | null;
  /** dd-MM-yyyy; si falta, la del turno o la de hoy. */
  date: string | null;
  evolution: string;
  /** Quién atendió una sesión sin turno, cuando la carga alguien sin profesional propio (Administración). */
  professionalId: string | null;
};

/**
 * Toda evolución queda a nombre de un profesional: con turno, el del turno; sin turno, el
 * del usuario, y si el usuario no es profesional (Administración), el que elija.
 */
export function sessionProfessionalError(
  user: { professionalId: string | null },
  input: { appointmentId: string | null; professionalId: string | null }
): { error: string; field: string } | null {
  if (input.appointmentId || user.professionalId || input.professionalId) return null;
  return { error: "Elegí qué profesional atendió la sesión.", field: "professionalId" };
}


function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Valida el body de alta o edición de un registro de historia clínica. */
export function parseClinicalEntryInput(body: unknown): ParseResult<ClinicalEntryInput> {
  if (!body || typeof body !== "object") {
    return { error: "Datos inválidos." };
  }
  const raw = body as Record<string, unknown>;

  const evolution = optionalText(raw.evolution);
  if (!evolution) {
    return { error: "Escribí la evolución de la sesión.", field: "evolution" };
  }

  const input: ClinicalEntryInput = {
    appointmentId: optionalText(raw.appointmentId),
    date: optionalText(raw.date),
    evolution,
    professionalId: optionalText(raw.professionalId),
  };

  // La evolución es el único texto: diagnóstico y plan ya no se cargan (los viejos se conservan).
  if (evolution.length > CLINICAL_TEXT_MAX_LENGTH) {
    return {
      error: `La evolución no puede superar los ${CLINICAL_TEXT_MAX_LENGTH} caracteres.`,
      field: "evolution",
    };
  }

  if (input.date) {
    if (isAppDateFormat(input.date) && !isValidAppDate(input.date)) {
      return { error: NONEXISTENT_DATE_MESSAGE, field: "date" };
    }
    if (!isValidAppDate(input.date)) {
      return { error: "Fecha inválida. Usá el formato dd-mm-aaaa.", field: "date" };
    }
    input.date = normalizeAppDate(input.date);
  }

  return { input };
}

/**
 * Número de sesión de cada registro, en orden cronológico (la 1 es la más vieja).
 * `entries` puede venir en cualquier orden; desempata por hora de carga.
 */
export function getSessionNumbers(
  entries: { id: string; date: string; createdAt: string }[]
): Map<string, number> {
  const sorted = [...entries].sort(
    (a, b) => compareAppDates(a.date, b.date) || a.createdAt.localeCompare(b.createdAt)
  );
  return new Map(sorted.map((entry, index) => [entry.id, index + 1]));
}
