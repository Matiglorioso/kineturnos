import { parseAppDate } from "@/lib/date-utils";
import type { Appointment, Patient } from "@/types";

/** Pacientes activos con la cobertura a resolver: sin sesiones cubiertas (rojo) o por renovar / en trámite (ámbar). */
export function summarizeCoverageAlerts(patients: Patient[]): { toResolve: number; toRenew: number } {
  let toResolve = 0;
  let toRenew = 0;
  for (const patient of patients) {
    if (patient.status !== "activo") continue;
    if (patient.coverage?.tone === "alert") toResolve += 1;
    else if (patient.coverage?.tone === "warning") toRenew += 1;
  }
  return { toResolve, toRenew };
}

export interface MonthInsuranceSessions {
  total: number;
  /** De mayor a menor cantidad de sesiones. */
  byInsurance: { name: string; count: number }[];
}

/**
 * Sesiones atendidas en el mes de `today` por pacientes con obra social (las
 * que van a la planilla mensual para facturar), agrupadas por obra social.
 */
export function summarizeMonthInsuranceSessions(
  appointments: Appointment[],
  patients: Patient[],
  today: string
): MonthInsuranceSessions {
  const reference = parseAppDate(today);
  if (!reference) return { total: 0, byInsurance: [] };
  const insuranceOf = new Map(patients.map((patient) => [patient.id, patient.insurance]));
  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    if (appointment.status !== "atendido") continue;
    const date = parseAppDate(appointment.date);
    if (!date || date.getMonth() !== reference.getMonth() || date.getFullYear() !== reference.getFullYear()) continue;
    const insurance = insuranceOf.get(appointment.patientId);
    if (!insurance || insurance === "Particular") continue;
    counts.set(insurance, (counts.get(insurance) ?? 0) + 1);
  }
  const byInsurance = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
  return { total: byInsurance.reduce((sum, item) => sum + item.count, 0), byInsurance };
}
