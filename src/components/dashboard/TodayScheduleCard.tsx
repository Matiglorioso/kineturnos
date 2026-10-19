import { StatusBadge } from "@/components/appointments/StatusBadge";
import { DashboardCard, DashboardEmpty } from "@/components/dashboard/DashboardCard";
import { isActiveAppointmentStatus } from "@/lib/appointment-status";
import { normalizeTime, timeToMinutes } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { CalendarCheck, CalendarDays } from "lucide-react";

interface TodayScheduleCardProps {
  schedule: Appointment[];
  nowMinutes: number;
  /** El rol Profesional ve solo su agenda: no hace falta el nombre del profesional. */
  showProfessional: boolean;
}

/** Turnos de hoy por horario; el que está en curso se resalta. */
export function TodayScheduleCard({ schedule, nowMinutes, showProfessional }: TodayScheduleCardProps) {
  return (
    <DashboardCard
      title="Agenda de hoy"
      icon={CalendarDays}
      meta={schedule.length ? `${schedule.length} ${schedule.length === 1 ? "turno" : "turnos"}` : undefined}
      action={{ label: "Ver agenda", href: "/agenda" }}
      fixedHeight
    >
      {schedule.length === 0 ? (
        <DashboardEmpty icon={CalendarCheck} text="No hay turnos para hoy." />
      ) : (
        <ol className="space-y-2">
          {schedule.map((appointment) => {
            const start = timeToMinutes(normalizeTime(appointment.time));
            const now = isActiveAppointmentStatus(appointment.status) && nowMinutes >= start && nowMinutes < start + 60;
            return (
              <li
                key={appointment.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                  now ? "border-brand-200 bg-brand-50/60" : "border-slate-100"
                )}
              >
                <span
                  className={cn(
                    "w-12 shrink-0 text-sm font-semibold tabular-nums",
                    now ? "text-brand-700" : "text-slate-700"
                  )}
                >
                  {normalizeTime(appointment.time)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {appointment.patientName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {showProfessional ? `${appointment.professionalName} · ` : ""}
                    {appointment.sessionType}
                    {now ? " · en curso" : ""}
                  </span>
                </span>
                <StatusBadge status={appointment.status} />
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
