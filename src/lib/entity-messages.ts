export function buildPermanentDeleteDescription(
  entityName: string,
  appointmentCount: number
): string {
  if (appointmentCount > 0) {
    const turnoLabel = appointmentCount === 1 ? "turno" : "turnos";
    return `Se elimina a ${entityName} y sus ${appointmentCount} ${turnoLabel}.`;
  }

  return `Se elimina a ${entityName}. No tiene turnos registrados.`;
}
