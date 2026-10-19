import { APP_TIME_ZONE, getTodayAppDate } from "@/lib/date-utils";
import type { AppUser } from "@/types";

export const ALL_ROLES = "todos";
export type UserStatusFilter = "todos" | "activos" | "inactivos";

export interface UserListOptions {
  search: string;
  role: AppUser["role"] | typeof ALL_ROLES;
  status: UserStatusFilter;
}

export const DEFAULT_USER_LIST_OPTIONS: UserListOptions = {
  search: "",
  role: ALL_ROLES,
  status: "todos",
};

/** Sin mayúsculas ni tildes: "Pérez" se encuentra con "perez". */
function normalizeSearchText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Activos primero y por nombre; busca por nombre, email o profesional vinculado. */
export function filterUsers(users: AppUser[], options: UserListOptions): AppUser[] {
  const query = normalizeSearchText(options.search.trim());

  return users
    .filter((user) => options.role === ALL_ROLES || user.role === options.role)
    .filter(
      (user) =>
        options.status === "todos" || (options.status === "activos" ? user.active : !user.active)
    )
    .filter(
      (user) =>
        !query ||
        [user.name, user.email, user.professionalName ?? ""].some((value) =>
          normalizeSearchText(value).includes(query)
        )
    )
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "es"));
}

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "Hoy 14:32", "Ayer 09:10", "03/10/2026" o "Nunca", en la hora del consultorio. */
export function formatLastLogin(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Nunca";
  const date = new Date(iso);
  const day = getTodayAppDate(date);
  const time = timeFormatter.format(date);

  if (day === getTodayAppDate(now)) return `Hoy ${time}`;
  if (day === getTodayAppDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return `Ayer ${time}`;
  return dayFormatter.format(date);
}
