/** Resultado de un parser de body: `input` si es válido, o `error` + `field` para el 400. */
export type ParseResult<T> = {
  input?: T;
  error?: string;
  field?: string;
};

/** Primer error de un objeto de errores de formulario, con su campo. */
export function firstFieldError(
  errors: Record<string, string | undefined>
): { error: string; field: string } | undefined {
  const entry = Object.entries(errors).find(([, message]) => message);
  return entry ? { error: entry[1]!, field: entry[0] } : undefined;
}
