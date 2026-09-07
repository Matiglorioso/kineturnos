/** Devuelve "1 turno" / "2 turnos" según la cantidad. */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}
