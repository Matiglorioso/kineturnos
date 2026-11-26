/** Tope de las observaciones de turnos y pacientes: son notas cortas, no la historia clínica. */
export const NOTES_MAX_LENGTH = 1000;

export function notesLengthError(notes: string | undefined): { error: string; field: "notes" } | null {
  if (notes && notes.trim().length > NOTES_MAX_LENGTH) {
    return {
      error: `Las observaciones no pueden superar los ${NOTES_MAX_LENGTH} caracteres.`,
      field: "notes",
    };
  }
  return null;
}
