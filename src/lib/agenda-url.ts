import { areSameAppDay, isValidAppDate, normalizeAppDate } from "@/lib/date-utils";

/**
 * URL de la agenda para el día elegido: ?fecha=dd-MM-yyyy si no es hoy, así recargar la
 * página o compartir el enlace mantiene el día.
 */
export function agendaUrlForDate(date: string, today: string): string {
  if (!isValidAppDate(date) || areSameAppDay(date, today)) return "/agenda";
  return `/agenda?fecha=${normalizeAppDate(date)}`;
}
