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
    return "El DNI debe tener 7 u 8 dígitos";
  }

  return undefined;
}

export function licenseFormatValidationError(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return "La matrícula es obligatoria";
  }

  const normalized = normalizeLicense(trimmed);

  if (normalized.length < LICENSE_MIN_LENGTH) {
    return "Ingresá una matrícula válida";
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
  "Ya existe un profesional registrado con esa matrícula";

/** CUIL/CUIT de persona: prefijo de 2 dígitos, DNI de 8 y dígito verificador. */
const CUIL_LENGTH = 11;
const CUIL_PERSON_PREFIXES = ["20", "23", "24", "27"];
const CUIL_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function normalizeCuil(value: string): string {
  return value.replace(/\D/g, "");
}

/** 20-32456789-6. Si no tiene 11 dígitos, lo devuelve como vino. */
export function formatCuil(value: string): string {
  const digits = normalizeCuil(value);
  if (digits.length !== CUIL_LENGTH) return value;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

export function cuilCheckDigit(firstTen: string): number | null {
  const sum = CUIL_WEIGHTS.reduce((acc, weight, index) => acc + weight * Number(firstTen[index]), 0);
  const digit = 11 - (sum % 11);
  if (digit === 11) return 0;
  if (digit === 10) return null;
  return digit;
}

/** El CUIL es opcional; si se carga, tiene que ser válido y corresponder al DNI. */
export function cuilFormatValidationError(value: string, dni: string): string | undefined {
  const normalized = normalizeCuil(value);
  if (!normalized) return undefined;

  if (normalized.length !== CUIL_LENGTH) {
    return "El CUIL debe tener 11 dígitos";
  }
  if (
    !CUIL_PERSON_PREFIXES.includes(normalized.slice(0, 2)) ||
    cuilCheckDigit(normalized.slice(0, 10)) !== Number(normalized[10])
  ) {
    return "El CUIL no es válido: revisá los dígitos";
  }

  const dniDigits = normalizeDni(dni);
  if (dniDigits && normalized.slice(2, 10) !== dniDigits.padStart(8, "0")) {
    return "El CUIL no corresponde al DNI";
  }

  return undefined;
}
