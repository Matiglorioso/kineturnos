import { randomInt } from "node:crypto";
import { newPasswordValidationError } from "@/lib/auth/password-policy";

/** Sin 0/O, 1/l/I: se dicta o se copia a mano sin confusiones. */
const TEMPORARY_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Contraseña temporal para el alta o el restablecimiento, p. ej. "Kine-h7Rt-m4Wq".
 * Se muestra una sola vez; el usuario la cambia en su primer ingreso.
 */
export function generateTemporaryPassword(): string {
  const block = () =>
    Array.from({ length: 4 }, () => TEMPORARY_ALPHABET[randomInt(TEMPORARY_ALPHABET.length)]).join("");
  let password = "";
  // Garantiza letras y números (cumple la misma política que una contraseña propia).
  while (newPasswordValidationError(password)) {
    password = `Kine-${block()}-${block()}`;
  }
  return password;
}
