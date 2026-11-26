import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
import type { AppointmentStatus } from "@/types";

export interface StatusConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

/**
 * Texto de la confirmación antes de cambiar el estado de un turno, el mismo en la
 * Agenda y en el Panel. Atendido, ausente y cancelado son finales (no se vuelve atrás),
 * así que se confirman; confirmar se aplica directo (devuelve null).
 */
export function statusChangeConfirmation(
  appointment: { patientName: string; date: string; time: string },
  status: AppointmentStatus
): StatusConfirmation | null {
  const slot = formatAppointmentSlotLabel(appointment.date, appointment.time);
  const who = `el turno de ${appointment.patientName} el ${slot}`;
  switch (status) {
    case "atendido":
      return {
        title: "Marcar turno como atendido",
        description: `Se marcará como atendido ${who}. Después no se puede cambiar el estado.`,
        confirmLabel: "Sí, marcar atendido",
        destructive: false,
      };
    case "ausente":
      return {
        title: "Marcar turno como ausente",
        description: `Se marcará como ausente ${who}. Después no se puede cambiar el estado.`,
        confirmLabel: "Sí, marcar ausente",
        destructive: false,
      };
    case "cancelado":
      return {
        title: "Cancelar turno",
        description: `Se cancelará ${who}. Esta acción no elimina el registro, solo cambia su estado.`,
        confirmLabel: "Sí, cancelar turno",
        destructive: true,
      };
    default:
      return null;
  }
}
