import { areSameAppDay, getAppointmentDateTime } from "@/lib/date-utils";
import {
  getProfessionalScheduleLabel,
  getWeekdayLabelFromAppDate,
  isEndTimeAfterStart,
  professionalWorksOnDay,
  validateProfessionalAppointmentSlot,
} from "@/lib/professional-schedule";
import { Appointment, Professional, WeekDay } from "@/types";

export {
  getProfessionalScheduleLabel,
  getWeekdayLabelFromAppDate,
  isEndTimeAfterStart,
  professionalWorksOnDay,
  validateProfessionalAppointmentSlot,
};

export const WEEK_DAYS: WeekDay[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const PROFESSIONAL_SPECIALTIES = [
  "Traumatología",
  "Deportiva",
  "Respiratoria",
  "RPG",
  "Neurológica",
  "Rehabilitación general",
] as const;

export const PROFESSIONAL_DURATION_OPTIONS = [30, 45, 60] as const;

export const PROFESSIONAL_AVATAR_COLORS = [
  "bg-brand-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export function buildProfessionalName(
  firstName: string,
  lastName: string
): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function getProfessionalAppointments(
  appointments: Appointment[],
  professionalId: string
): Appointment[] {
  return appointments.filter(
    (appointment) => appointment.professionalId === professionalId
  );
}

export function countProfessionalAppointments(
  appointments: Appointment[],
  professionalId: string
): number {
  return getProfessionalAppointments(appointments, professionalId).length;
}

export function removeProfessionalAppointments(
  appointments: Appointment[],
  professionalId: string
): Appointment[] {
  return appointments.filter(
    (appointment) => appointment.professionalId !== professionalId
  );
}

export function getProfessionalTodayCount(
  appointments: Appointment[],
  professionalId: string,
  today: string
): number {
  return getProfessionalAppointments(appointments, professionalId).filter(
    (appointment) => areSameAppDay(appointment.date, today)
  ).length;
}

export function getProfessionalUpcomingAppointments(
  appointments: Appointment[],
  professionalId: string,
  limit = 5,
  referenceDate: Date = new Date()
): Appointment[] {
  return getProfessionalAppointments(appointments, professionalId)
    .filter(
      (appointment) =>
        (appointment.status === "pendiente" ||
          appointment.status === "confirmado") &&
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

export function pickAvatarColor(index: number): string {
  return PROFESSIONAL_AVATAR_COLORS[index % PROFESSIONAL_AVATAR_COLORS.length];
}
