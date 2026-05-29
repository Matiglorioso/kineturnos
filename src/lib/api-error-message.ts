import { ApiError } from "@/lib/api/fetch-json";

export function getApiErrorMessage(
  status: number,
  serverMessage?: string
): string {
  if (serverMessage && status !== 500) {
    return serverMessage;
  }

  switch (status) {
    case 401:
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    case 403:
      return "No tenés permiso para realizar esta acción.";
    case 503:
      return "No pudimos conectar con la base de datos. Intentá de nuevo en unos segundos.";
    case 500:
      return serverMessage ?? "Ocurrió un error en el servidor.";
    default:
      return serverMessage ?? "No se pudo completar la solicitud.";
  }
}

export function getLoadErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error.status, error.message);
  }

  if (error instanceof TypeError) {
    return "Sin conexión. Revisá tu internet e intentá de nuevo.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
