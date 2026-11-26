import { getWeekdayLabelFromAppDate } from "@/lib/professional-schedule";

/** "Miércoles" y "miercoles" son el mismo día. */
function normalizeDay(day: string): string {
  return day
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Desactivar un paciente o un profesional con turnos activos (pendientes o confirmados)
 * se bloquea, igual que eliminarlo: los turnos quedarían vigentes (y con recordatorios)
 * para alguien que ya no está. Devuelve el mensaje, o null si se puede.
 */
export function activeAppointmentsBlockMessage(
  subject: "paciente" | "profesional",
  activeCount: number
): string | null {
  if (activeCount <= 0) return null;
  const turnos =
    activeCount === 1
      ? "1 turno activo (pendiente o confirmado)"
      : `${activeCount} turnos activos (pendientes o confirmados)`;
  const action = activeCount === 1 ? "Cancelalo" : "Cancelalos";
  // Al paciente se lo da de baja; al profesional se lo desactiva.
  const [verb, verbAfter] = subject === "paciente" ? ["dar de baja", "darlo de baja"] : ["desactivar", "desactivarlo"];
  return `No se puede ${verb} al ${subject} porque tiene ${turnos}. ${action} o registrá su asistencia antes de ${verbAfter}.`;
}

/** Días que estaban en la agenda del profesional y ya no (conserva cómo estaban escritos antes). */
export function removedWorkDays(before: string[], after: string[]): string[] {
  const kept = new Set(after.map(normalizeDay));
  return before.filter((day) => !kept.has(normalizeDay(day)));
}

/** Fechas (dd-MM-yyyy) de los turnos que caen en alguno de los días que se sacan. */
export function appointmentsOnRemovedDays(appointments: { date: string }[], removedDays: string[]): string[] {
  const removed = new Set(removedDays.map(normalizeDay));
  return appointments
    .map((appointment) => appointment.date)
    .filter((date) => {
      const weekday = getWeekdayLabelFromAppDate(date);
      return weekday !== null && removed.has(normalizeDay(weekday));
    });
}

const MAX_DATES = 3;

/** "el martes y el jueves" */
function joinDays(days: string[]): string {
  const named = days.map((day) => `el ${day.toLowerCase()}`);
  return named.length <= 1 ? named.join("") : `${named.slice(0, -1).join(", ")} y ${named[named.length - 1]}`;
}

/** Mensaje para no guardar los días nuevos mientras haya turnos activos en los que se sacan, o null. */
export function removedDaysBlockMessage(removedDays: string[], dates: string[]): string | null {
  if (dates.length === 0) return null;
  // Varios turnos el mismo día: la fecha se muestra una vez (la cantidad cuenta turnos).
  const uniqueDates = [...new Set(dates)];
  const shown = uniqueDates.slice(0, MAX_DATES).join(", ");
  const hidden = uniqueDates.length - MAX_DATES;
  const rest = hidden > 0 ? ` y ${hidden} ${hidden === 1 ? "fecha" : "fechas"} más` : "";
  const turnos = dates.length === 1 ? "1 turno activo" : `${dates.length} turnos activos`;
  const when = removedDays.length === 1 ? "ese día" : "esos días";
  return `No se puede sacar ${joinDays(removedDays)}: hay ${turnos} ${when} (${shown}${rest}). Reprogramalos o cancelalos antes de cambiar los días de atención.`;
}
