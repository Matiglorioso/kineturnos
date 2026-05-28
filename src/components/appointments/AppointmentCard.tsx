import { StatusBadge } from "@/components/appointments/StatusBadge";
import { Appointment } from "@/types";
import { cn, formatTime, getInitials } from "@/lib/utils";
import { Calendar, Clock, Stethoscope, User } from "lucide-react";
import { formatAppDate } from "@/lib/date-utils";
import { ReactNode } from "react";

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: "default" | "compact";
  className?: string;
  actions?: ReactNode;
}

export function AppointmentCard({
  appointment,
  variant = "default",
  className,
  actions,
}: AppointmentCardProps) {
  const dateFormatted = formatAppDate(appointment.date);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-brand-200 hover:shadow-soft",
          className
        )}
      >
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <span className="text-xs font-bold leading-none">
            {formatTime(appointment.time)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">
            {appointment.patientName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {appointment.sessionType}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "surface-card p-5 transition-all hover:border-brand-200 hover:shadow-elevated",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-sm">
            {getInitials(appointment.patientName)}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">
              {appointment.patientName}
            </h4>
            <p className="text-xs text-slate-500">{appointment.sessionType}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>
            {formatTime(appointment.time)} · {appointment.duration} min
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="capitalize">{dateFormatted}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="h-4 w-4 text-slate-400" />
          <span>{appointment.professionalName}</span>
        </div>
        {appointment.notes && (
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{appointment.notes}</span>
          </div>
        )}
        {actions && (
          <div className="border-t border-slate-100 pt-4">{actions}</div>
        )}
      </div>
    </div>
  );
}
