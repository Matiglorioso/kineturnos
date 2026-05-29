/** Normalización y validación de DNI y matrículas. */

const DNI_MIN_LENGTH = 7;
const DNI_MAX_LENGTH = 8;
const LICENSE_MIN_LENGTH = 4;

export function normalizeDni(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeLicense(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.]/g, "");
}

export function dniFormatValidationError(value: string): string | undefined {
  const normalized = normalizeDni(value);

  if (!normalized) {
    return "El DNI es obligatorio";
  }

  if (normalized.length < DNI_MIN_LENGTH || normalized.length > DNI_MAX_LENGTH) {
    return "El DNI debe tener 7 u 8 digitos";
  }

  return undefined;
}

export function licenseFormatValidationError(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return "La matricula es obligatoria";
  }

  const normalized = normalizeLicense(trimmed);

  if (normalized.length < LICENSE_MIN_LENGTH) {
    return "Ingresa una matricula valida";
  }

  return undefined;
}

export function isDuplicateDni(
  dni: string,
  records: Array<{ id: string; dni: string }>,
  excludeId?: string
): boolean {
  const normalized = normalizeDni(dni);
  if (!normalized) return false;

  return records.some(
    (record) =>
      record.id !== excludeId && normalizeDni(record.dni) === normalized
  );
}

export function isDuplicateLicense(
  license: string,
  records: Array<{ id: string; license?: string }>,
  excludeId?: string
): boolean {
  const normalized = normalizeLicense(license);
  if (!normalized) return false;

  return records.some(
    (record) =>
      record.id !== excludeId &&
      Boolean(record.license) &&
      normalizeLicense(record.license!) === normalized
  );
}

export const DUPLICATE_DNI_MESSAGE =
  "Ya existe un paciente registrado con ese DNI";

export const DUPLICATE_LICENSE_MESSAGE =
  "Ya existe un profesional registrado con esa matricula";
