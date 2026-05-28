import { StatusBadge } from "@/components/appointments/StatusBadge";
import { Appointment } from "@/types";
import { formatAppointmentListLine } from "@/lib/datetime-format";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Stethoscope } from "lucide-react";

interface PatientAppointmentListProps {
  appointments: Appointment[];
  className?: string;
}

export function PatientAppointmentList({
  appointments,
  className,
}: PatientAppointmentListProps) {
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
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-brand-200"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{dateLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {timeLabel}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Stethoscope className="h-4 w-4 text-slate-400" />
                  {appointment.professionalName}
                </p>
                <span className="inline-block rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {appointment.sessionType}
                </span>
              </div>
              <StatusBadge status={appointment.status} className="shrink-0 self-start" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
