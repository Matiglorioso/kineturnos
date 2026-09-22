export type LoginErrorKind =
  | "credentials"
  | "rate_limited"
  | "network"
  | "unknown";

export function getLoginErrorMessage(
  error: unknown,
  signInError?: string | null,
  signInCode?: string | null
): { kind: LoginErrorKind; message: string } {
  if (signInCode === "rate_limited") {
    return {
      kind: "rate_limited",
      message:
        "Demasiados intentos fallidos. Esperá 15 minutos e intentá de nuevo.",
    };
  }

  if (signInError) {
    return {
      kind: "credentials",
      message: "Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.",
    };
  }

  if (error instanceof TypeError) {
    return {
      kind: "network",
      message:
        "Sin conexión con el servidor. Revisá tu internet e intentá de nuevo.",
    };
  }

  if (error instanceof Error && error.message) {
    return {
      kind: "unknown",
      message: error.message,
    };
  }

  return {
    kind: "unknown",
    message: "No se pudo iniciar sesión. Intentá de nuevo en unos segundos.",
  };
}
