export function buildPermanentDeleteDescription(
  entityName: string,
  appointmentCount: number
): string {
  if (appointmentCount > 0) {
    const turnoLabel = appointmentCount === 1 ? "turno" : "turnos";
    return `Se eliminara permanentemente a ${entityName} y sus ${appointmentCount} ${turnoLabel}. Esta accion no se puede deshacer.`;
  }

  return `Se eliminara permanentemente a ${entityName}. No tiene turnos registrados. Esta accion no se puede deshacer.`;
}
