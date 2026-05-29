export type LoginErrorKind = "credentials" | "network" | "unknown";

export function getLoginErrorMessage(
  error: unknown,
  signInError?: string | null
): { kind: LoginErrorKind; message: string } {
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
