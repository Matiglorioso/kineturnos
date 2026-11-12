import { Appointment } from "@/types";

/** Orden y filtros de los turnos de la agenda. */
export function sortAppointmentsByTime(
  appointments: Appointment[]
): Appointment[] {
  return [...appointments].sort((a, b) => a.time.localeCompare(b.time));
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filterAgendaAppointments(
  appointments: Appointment[],
  options: {
    statusFilter: Appointment["status"] | "todos";
    professionalFilter: string;
    /** Texto a buscar en el nombre del paciente (sin importar mayúsculas ni tildes). */
    patientQuery?: string;
  }
): Appointment[] {
  const query = normalizeSearch(options.patientQuery ?? "");
  return appointments.filter((appointment) => {
    if (
      options.statusFilter !== "todos" &&
      appointment.status !== options.statusFilter
    ) {
      return false;
    }

    if (
      options.professionalFilter !== "todos" &&
      appointment.professionalId !== options.professionalFilter
    ) {
      return false;
    }

    if (query && !normalizeSearch(appointment.patientName).includes(query)) {
      return false;
    }

    return true;
  });
}
