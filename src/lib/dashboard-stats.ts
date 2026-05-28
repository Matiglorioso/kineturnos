import {
  areSameAppDay,
  getAppointmentDateTime,
  getTodayAppDate,
} from "@/lib/date-utils";
import { Appointment, AppointmentStatus, Patient } from "@/types";

export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "pendiente",
  "confirmado",
  "atendido",
  "cancelado",
  "ausente",
];

export { getTodayAppDate };

export function getAppointmentsForDay(
  appointments: Appointment[],
  day: string
): Appointment[] {
  return appointments.filter((appointment) =>
    areSameAppDay(appointment.date, day)
  );
}

export function getTodayDashboardMetrics(
  appointments: Appointment[],
  today: string
) {
  const todayAppointments = getAppointmentsForDay(appointments, today);

  return {
    todayTotal: todayAppointments.length,
    todayConfirmed: todayAppointments.filter((a) => a.status === "confirmado")
      .length,
    todayPending: todayAppointments.filter((a) => a.status === "pendiente")
      .length,
    todayCancelled: todayAppointments.filter((a) => a.status === "cancelado")
      .length,
    todayAppointments,
  };
}

export function getActivePatientsCount(patients: Patient[]): number {
  return patients.filter((patient) => patient.status === "activo").length;
}

export function getUpcomingAppointments(
  appointments: Appointment[],
  limit = 5,
  referenceDate: Date = new Date()
): Appointment[] {
  return appointments
    .filter(
      (appointment) =>
        getAppointmentDateTime(appointment.date, appointment.time) >=
        referenceDate
    )
    .sort(
      (a, b) =>
        getAppointmentDateTime(a.date, a.time).getTime() -
        getAppointmentDateTime(b.date, b.time).getTime()
    )
    .slice(0, limit);
}

export function getAppointmentStatusCounts(
  appointments: Appointment[]
): Record<AppointmentStatus, number> {
  const counts: Record<AppointmentStatus, number> = {
    pendiente: 0,
    confirmado: 0,
    atendido: 0,
    cancelado: 0,
    ausente: 0,
  };

  appointments.forEach((appointment) => {
    counts[appointment.status] += 1;
  });

  return counts;
}
