export const PASSWORD_MIN_LENGTH = 8;

/** Contraseña elegida por el usuario: 8 caracteres o más, con letras y números. */
export function newPasswordValidationError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[a-zA-ZñÑ]/.test(password) || !/\d/.test(password)) {
    return "La contraseña tiene que combinar letras y números";
  }
  return undefined;
}
