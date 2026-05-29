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
  const response = await fetch(url, init);
  const body = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      body?.error ?? "No se pudo completar la solicitud.",
      response.status
    );
  }

  if (!body || body.data === undefined) {
    throw new ApiError("Respuesta invalida del servidor.");
  }

  return body.data;
}
