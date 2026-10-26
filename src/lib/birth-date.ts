import { differenceInYears } from "date-fns";
import { getTodayAppDate, isValidAppDate, parseAppDate } from "@/lib/date-utils";

const MAX_AGE = 120;

/** Acepta 05/03/1990 o 5-3-1990 y lo deja en dd-MM-yyyy. */
export function normalizeBirthDateInput(value: string): string {
  const match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}-${match[3]}`;
}

/** La fecha de nacimiento es opcional: no puede ser futura ni de hace más de 120 años. */
export function birthDateValidationError(
  value: string,
  today: string = getTodayAppDate()
): string | undefined {
  const normalized = normalizeBirthDateInput(value);
  if (!normalized) return undefined;

  if (!isValidAppDate(normalized)) {
    return "Ingresá la fecha con el formato dd-mm-aaaa";
  }

  const age = ageOn(normalized, today);
  if (age === null) {
    return "La fecha de nacimiento no puede ser futura";
  }
  if (age > MAX_AGE) {
    return "Revisá la fecha de nacimiento";
  }

  return undefined;
}

/** Edad cumplida a una fecha (dd-MM-yyyy). */
export function ageOn(birthDate: string, today: string = getTodayAppDate()): number | null {
  const birth = parseAppDate(birthDate);
  const reference = parseAppDate(today);
  if (!birth || !reference || birth > reference) return null;
  return differenceInYears(reference, birth);
}

/** "34 años" o "1 año"; vacío si no hay fecha. */
export function formatAge(birthDate: string | undefined, today?: string): string {
  if (!birthDate) return "";
  const age = ageOn(birthDate, today);
  if (age === null) return "";
  return age === 1 ? "1 año" : `${age} años`;
}
