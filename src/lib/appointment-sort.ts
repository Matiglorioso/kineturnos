import type { Appointment } from "@/types";

/** Orden cronológico de turnos: fecha y luego hora. */
export function compareAppointmentsByDateTime(
  a: Pick<Appointment, "date" | "time">,
  b: Pick<Appointment, "date" | "time">
): number {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;
  return a.time.localeCompare(b.time);
}

export function sortAppointmentsByDateTime<T extends Pick<Appointment, "date" | "time">>(
  items: T[]
): T[] {
  return [...items].sort(compareAppointmentsByDateTime);
}
