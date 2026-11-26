/**
 * El número de autorización lo da la obra social y no se repite dentro de ella: si ya
 * está cargado, casi seguro es un error de tipeo o una carga doble.
 */
export function duplicateAuthorizationNumberMessage(
  number: string,
  insuranceName: string,
  existing: { patientName: string; samePatient: boolean }
): string {
  if (existing.samePatient) {
    return `Este paciente ya tiene la autorización ${number} de ${insuranceName}. Editala en lugar de cargarla de nuevo.`;
  }
  return `El número ${number} ya está cargado en ${insuranceName} para ${existing.patientName}. Revisá el número.`;
}
