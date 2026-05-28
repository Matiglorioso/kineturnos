/** Validacion de campos de formulario (email, obligatorios). */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return EMAIL_REGEX.test(trimmed);
}

export function emailValidationError(value: string): string | undefined {
  return isValidEmail(value) ? undefined : "Ingresa un email valido";
}

export function requiredFieldError(
  value: string,
  message: string
): string | undefined {
  return value.trim() ? undefined : message;
}
