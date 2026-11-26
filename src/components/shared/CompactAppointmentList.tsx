"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { DetailSection } from "@/components/shared/DetailSection";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date-utils";
import type { Appointment } from "@/types";
import { useState } from "react";

interface CompactAppointmentListProps {
  title: string;
  appointments: Appointment[];
  /** Quién se nombra en cada turno: el profesional (ficha del paciente) o el paciente (ficha del profesional). */
  show: "professional" | "patient";
  emptyText: string;
  /** Muestra los primeros N y "Ver todos" para el resto. */
  limit?: number;
  /** Muestra el tipo de sesión (se oculta cuando la lista va en una columna angosta). */
  showSessionType?: boolean;
  className?: string;
}

/**
 * Turnos de una ficha, uno por renglón: día, hora, paciente o profesional, (tipo de sesión)
 * y estado. Pensado para que la ficha entre en pantalla sin scrollear.
 */
export function CompactAppointmentList({
  title,
  appointments,
  show,
  emptyText,
  limit,
  showSessionType = true,
  className,
}: CompactAppointmentListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = limit === undefined || expanded ? appointments : appointments.slice(0, limit);
  const hasMore = limit !== undefined && appointments.length > limit;

  return (
    <DetailSection
      title={title}
      flush
      className={className}
      action={
        hasMore ? (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos" : "Ver todos"}
          </Button>
        ) : undefined
      }
    >
      {appointments.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 text-sm sm:flex-nowrap"
              title={showSessionType ? undefined : appointment.sessionType}
            >
              <span className="w-[7.25rem] shrink-0 font-medium text-brand-800">
                {formatAppDate(appointment.date, "EEE dd-MM-yyyy")}
              </span>
              <span className="w-10 shrink-0 tabular-nums text-slate-600">{appointment.time}</span>
              {/* En el celular, profesional/paciente y estado pasan al segundo renglón. */}
              <span className="h-0 basis-full sm:hidden" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-slate-900">
                {show === "patient" ? appointment.patientName : appointment.professionalName}
              </span>
              {showSessionType && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {appointment.sessionType}
                </span>
              )}
              <StatusBadge status={appointment.status} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
