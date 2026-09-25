/** Utilidades de hora en formato HH:mm (24 h). */

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** HH:mm (o HH:mm:ss) entre 00:00 y 23:59. */
export function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

export function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}
