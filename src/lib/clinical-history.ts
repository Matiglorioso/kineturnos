import type { ParseResult } from "@/lib/api/parse-result";
import { isValidAppDate, normalizeAppDate } from "@/lib/date-utils";
import type { ClinicalSummary } from "@/types";

/** El autor puede corregir un registro durante este tiempo; después queda cerrado. */
export const CLINICAL_EDIT_WINDOW_HOURS = 24;

export const CLINICAL_TEXT_MAX_LENGTH = 4000;

export const CLINICAL_EDIT_CLOSED_ERROR =
  "Este registro ya no se puede editar: solo su autor lo corrige, y dentro de las 24 h. Cargá la corrección como un registro nuevo.";

export const CLINICAL_ACCESS_DENIED_ERROR =
  "Solo podés ver la historia clínica de pacientes con los que tenés o tuviste turnos.";

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

/**
 * Diagnóstico y plan vigentes: los del registro más reciente que los cargó.
 * `entries` viene ordenado del más nuevo al más viejo.
 */
export function getClinicalSummary(
  entries: { date: string; diagnosis: string | null; treatment: string | null }[]
): ClinicalSummary {
  const withDiagnosis = entries.find((entry) => entry.diagnosis);
  const withTreatment = entries.find((entry) => entry.treatment);
  return {
    diagnosis: withDiagnosis
      ? { text: withDiagnosis.diagnosis!, date: withDiagnosis.date }
      : null,
    treatment: withTreatment
      ? { text: withTreatment.treatment!, date: withTreatment.date }
      : null,
  };
}

export type ClinicalEntryInput = {
  appointmentId: string | null;
  /** dd-MM-yyyy; si falta, la del turno o la de hoy. */
  date: string | null;
  diagnosis: string | null;
  treatment: string | null;
  evolution: string;
};

const FIELD_LABELS = {
  diagnosis: "El diagnóstico",
  treatment: "El plan de tratamiento",
  evolution: "La evolución",
} as const;

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
    diagnosis: optionalText(raw.diagnosis),
    treatment: optionalText(raw.treatment),
    evolution,
  };

  for (const field of ["diagnosis", "treatment", "evolution"] as const) {
    const value = input[field];
    if (value && value.length > CLINICAL_TEXT_MAX_LENGTH) {
      return {
        error: `${FIELD_LABELS[field]} no puede superar los ${CLINICAL_TEXT_MAX_LENGTH} caracteres.`,
        field,
      };
    }
  }

  if (input.date) {
    if (!isValidAppDate(input.date)) {
      return { error: "Fecha inválida. Usá el formato dd-mm-aaaa.", field: "date" };
    }
    input.date = normalizeAppDate(input.date);
  }

  return { input };
}
