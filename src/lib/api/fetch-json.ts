import { getApiErrorMessage } from "@/lib/api-error-message";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(
      "Sin conexión. Revisá tu internet e intentá de nuevo.",
      0
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(response.status, body?.error),
      response.status
    );
  }

  if (!body || body.data === undefined) {
    throw new ApiError("Respuesta invalida del servidor.");
  }

  return body.data;
}
