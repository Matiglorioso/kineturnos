"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { formatAppointmentTimeRange } from "@/lib/datetime-format";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types";
import { Stethoscope, User } from "lucide-react";
import { ReactNode } from "react";

const statusBlockStyles: Record<AppointmentStatus, string> = {
  pendiente: "border-l-amber-400 bg-amber-50/90 hover:bg-amber-50",
  confirmado: "border-l-emerald-400 bg-emerald-50/90 hover:bg-emerald-50",
  atendido: "border-l-sky-400 bg-sky-50/90 hover:bg-sky-50",
  cancelado: "border-l-red-400 bg-red-50/80 hover:bg-red-50 opacity-80",
  ausente: "border-l-slate-400 bg-slate-100/90 hover:bg-slate-100 opacity-80",
};

interface WeekAppointmentBlockProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function WeekAppointmentBlock({
  appointment,
  onClick,
  actions,
  compact = false,
  className,
  style,
}: WeekAppointmentBlockProps) {
  const timeRangeLabel = formatAppointmentTimeRange(
    appointment.time,
    appointment.duration
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-slate-200/80 border-l-4 text-left shadow-sm transition-all",
        statusBlockStyles[appointment.status],
        compact ? "p-2" : "p-2.5",
        className
      )}
      style={style}
    >
      <button
        type="button"
        onClick={() => onClick(appointment)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-bold text-slate-800">
            {timeRangeLabel}
          </span>
          {!compact && (
            <StatusBadge
              status={appointment.status}
              showIcon={false}
              className="scale-90"
            />
          )}
        </div>
        <p
          className={cn(
            "mt-1 font-semibold text-slate-900",
            compact ? "truncate text-xs" : "text-sm"
          )}
        >
          {appointment.patientName}
        </p>
        {!compact && (
          <>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-600">
              <User className="h-3 w-3 shrink-0" />
              {appointment.professionalName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <Stethoscope className="h-3 w-3 shrink-0" />
              {appointment.sessionType}
            </p>
          </>
        )}
        {compact && (
          <p className="mt-0.5 truncate text-[10px] text-slate-500">
            {appointment.sessionType}
          </p>
        )}
      </button>

      {compact && (
        <div className="mt-1 flex items-center justify-between gap-1">
          <StatusBadge status={appointment.status} showIcon={false} className="scale-[0.85]" />
        </div>
      )}

      {actions && compact && (
        <div
          className="absolute right-1 top-1 z-20 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}

      {!compact && actions && (
        <div
          className="mt-3 border-t border-slate-200/60 pt-2.5"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
