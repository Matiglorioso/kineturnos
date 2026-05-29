import { getAppointmentDateTime, parseAppDate } from "@/lib/date-utils";
import { formatAppDate, formatTimeShort } from "@/lib/datetime-format";
import { ActivityItem, Appointment, Patient } from "@/types";
import { parseISO } from "date-fns";

function getPatientActivityTimestamp(patient: Patient): Date | null {
  if (patient.createdAt) {
    return parseAppDate(patient.createdAt);
  }

  const idMatch = patient.id.match(/^p-(\d+)$/);
  if (idMatch) {
    return new Date(Number(idMatch[1]));
  }

  return null;
}

function getAppointmentActivityTimestamp(appointment: Appointment): Date {
  const idMatch = appointment.id.match(/^a-(\d+)$/);
  if (idMatch) {
    return new Date(Number(idMatch[1]));
  }

  return getAppointmentDateTime(appointment.date, appointment.time);
}

function buildActivityFromData(
  patients: Patient[],
  appointments: Appointment[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  patients.forEach((patient) => {
    const timestamp = getPatientActivityTimestamp(patient);
    if (!timestamp) return;

    items.push({
      id: `patient-${patient.id}`,
      type: "patient",
      message: `Nuevo paciente registrado: ${patient.name}`,
      timestamp: timestamp.toISOString(),
    });
  });

  appointments.forEach((appointment) => {
    const timestamp = getAppointmentActivityTimestamp(appointment);
    const dateLabel = formatAppDate(appointment.date);
    const timeLabel = formatTimeShort(appointment.time);

    switch (appointment.status) {
      case "confirmado":
        items.push({
          id: `confirm-${appointment.id}`,
          type: "confirmation",
          message: `Turno confirmado para ${appointment.patientName} - ${appointment.sessionType} (${dateLabel} ${timeLabel})`,
          timestamp: timestamp.toISOString(),
        });
        break;
      case "cancelado":
        items.push({
          id: `cancel-${appointment.id}`,
          type: "cancellation",
          message: `${appointment.patientName} cancelo su turno del ${dateLabel} a las ${timeLabel}`,
          timestamp: timestamp.toISOString(),
        });
        break;
      case "atendido":
        items.push({
          id: `attended-${appointment.id}`,
          type: "appointment",
          message: `${appointment.patientName} fue atendido por ${appointment.professionalName}`,
          timestamp: timestamp.toISOString(),
        });
        break;
      case "ausente":
        items.push({
          id: `absent-${appointment.id}`,
          type: "cancellation",
          message: `${appointment.patientName} marcado como ausente (${dateLabel})`,
          timestamp: timestamp.toISOString(),
        });
        break;
      default:
        break;
    }
  });

  return items.sort(
    (a, b) =>
      parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
  );
}

export function getRecentActivityItems(
  patients: Patient[],
  appointments: Appointment[],
  maxItems = 6
): ActivityItem[] {
  return buildActivityFromData(patients, appointments).slice(0, maxItems);
}
