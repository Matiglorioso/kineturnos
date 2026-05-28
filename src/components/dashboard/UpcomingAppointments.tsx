import { StatusBadge } from "@/components/appointments/StatusBadge";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { formatAppointmentListLine } from "@/lib/datetime-format";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Stethoscope, User } from "lucide-react";

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  className?: string;
}

export function UpcomingAppointments({
  appointments,
  className,
}: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <EmptyStateFromPreset
        preset={emptyStates.dashboard.noUpcoming}
        size="compact"
        actionLabel={emptyStateActions.goToAgenda}
        actionHref="/agenda"
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {appointments.map((appointment) => {
        const { dateLabel, timeLabel } = formatAppointmentListLine(
          appointment.date,
          appointment.time,
          appointment.duration
        );

        return (
          <div
            key={appointment.id}
            className="rounded-xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-brand-200 hover:shadow-soft"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="flex items-center gap-1.5 font-medium text-slate-900">
                  <User className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{appointment.patientName}</span>
                </p>
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{appointment.professionalName}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium capitalize text-brand-700">
                    <Calendar className="h-3.5 w-3.5" />
                    {dateLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {timeLabel}
                  </span>
                  <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {appointment.sessionType}
                  </span>
                </div>
              </div>
              <StatusBadge status={appointment.status} className="shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
