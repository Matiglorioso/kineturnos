/** Validación de campos de formulario (email, obligatorios). */

// Sin tildes ni eñes: "martín@…" se aceptaba y después el correo no llegaba.
const EMAIL_REGEX = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return EMAIL_REGEX.test(trimmed);
}

export function emailValidationError(value: string): string | undefined {
  return isValidEmail(value) ? undefined : "Ingresá un email válido";
}

export function requiredFieldError(
  value: string,
  message: string
): string | undefined {
  return value.trim() ? undefined : message;
}
