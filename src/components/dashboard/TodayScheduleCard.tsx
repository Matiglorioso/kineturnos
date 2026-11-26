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
      fixedHeight
    >
      {schedule.length === 0 ? (
        <DashboardEmpty icon={CalendarCheck} text="No hay turnos para hoy." />
      ) : (
        <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white lg:border-slate-100">
          {schedule.map((appointment) => {
            const start = timeToMinutes(normalizeTime(appointment.time));
            const now = isActiveAppointmentStatus(appointment.status) && nowMinutes >= start && nowMinutes < start + 60;
            return (
              <li
                key={appointment.id}
                className={cn("flex items-center gap-3 px-3 py-2.5", now && "bg-brand-50/60")}
              >
                <span
                  className={cn(
                    "w-11 shrink-0 text-sm font-bold tabular-nums",
                    now ? "text-brand-700" : "text-brand-800"
                  )}
                >
                  {normalizeTime(appointment.time)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {appointment.patientName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {showProfessional ? `${appointment.professionalName} · ` : ""}
                    {appointment.sessionType}
                    {now ? " · en curso" : ""}
                  </span>
                </span>
                <StatusBadge status={appointment.status} showIcon={false} />
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
