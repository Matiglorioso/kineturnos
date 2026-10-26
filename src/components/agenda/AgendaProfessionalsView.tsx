"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status";
import type { ProfessionalDayCell, ProfessionalDayColumn, ProfessionalDayGrid } from "@/lib/agenda-professionals";
import { pluralize } from "@/lib/pluralize";
import { cn, getInitials } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { Plus, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<AppointmentStatus, { card: string; dot: string }> = {
  pendiente: { card: "border-l-amber-400 bg-amber-50/90 hover:bg-amber-50", dot: "bg-amber-500" },
  confirmado: { card: "border-l-emerald-400 bg-emerald-50/90 hover:bg-emerald-50", dot: "bg-emerald-500" },
  atendido: { card: "border-l-sky-400 bg-sky-50/90 hover:bg-sky-50", dot: "bg-sky-500" },
  cancelado: { card: "border-l-red-400 bg-red-50/80 opacity-80 hover:bg-red-50", dot: "bg-red-500" },
  ausente: { card: "border-l-slate-400 bg-slate-100/90 opacity-80 hover:bg-slate-100", dot: "bg-slate-400" },
};

interface AgendaProfessionalsViewProps {
  grid: ProfessionalDayGrid;
  dateLabel: string;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Hueco libre: abre "Agendar turno" con el profesional y la hora. Sin permiso, no se ofrece. */
  onFreeSlotClick?: (professionalId: string, time: string) => void;
}

function AppointmentChip({
  appointment,
  onClick,
  compact,
}: {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  compact: boolean;
}) {
  const styles = STATUS_STYLES[appointment.status];
  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      aria-label={`${appointment.time} · ${appointment.patientName} · ${APPOINTMENT_STATUS_LABELS[appointment.status]}`}
      className={cn(
        "flex w-full min-w-0 flex-col justify-center rounded-lg border border-l-4 border-slate-200/80 px-2.5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        styles.card,
        compact ? "py-1" : "h-full py-1.5"
      )}
    >
      <span className="truncate text-sm font-semibold text-slate-900">{appointment.patientName}</span>
      <span className="flex items-center gap-1.5 truncate text-xs text-slate-600">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
        {APPOINTMENT_STATUS_LABELS[appointment.status]}
        {appointment.time.slice(3, 5) !== "00" && ` · ${appointment.time.slice(0, 5)}`}
      </span>
    </button>
  );
}

function Cell({
  cell,
  column,
  onAppointmentClick,
  onFreeSlotClick,
}: {
  cell: ProfessionalDayCell;
  column: ProfessionalDayColumn;
  onAppointmentClick: (appointment: Appointment) => void;
  onFreeSlotClick?: (professionalId: string, time: string) => void;
}) {
  if (cell.kind === "turnos") {
    return (
      <div className="flex h-full flex-col gap-1">
        {cell.appointments.map((appointment) => (
          <AppointmentChip
            key={appointment.id}
            appointment={appointment}
            onClick={onAppointmentClick}
            compact={cell.appointments.length > 1}
          />
        ))}
      </div>
    );
  }

  if (cell.kind === "libre") {
    return onFreeSlotClick ? (
      <button
        type="button"
        onClick={() => onFreeSlotClick(column.professional.id, cell.time)}
        aria-label={`Agendar con ${column.professional.name} a las ${cell.time}`}
        className="flex h-full w-full items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 text-sm text-slate-400 transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Plus className="h-3.5 w-3.5" />
        Libre
      </button>
    ) : (
      <div className="flex h-full items-center rounded-lg border border-dashed border-slate-200 px-2.5 text-sm text-slate-400">
        Libre
      </div>
    );
  }

  return (
    <div
      className="flex h-full items-center rounded-lg bg-slate-50 px-2.5 text-xs text-slate-400"
      aria-label={cell.kind === "ocupado" ? "Ocupado" : "No disponible"}
    >
      {cell.kind === "ocupado" ? "Ocupado" : "—"}
    </div>
  );
}

function ColumnHeader({ column, className }: { column: ProfessionalDayColumn; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white",
          column.professional.avatarColor
        )}
      >
        {getInitials(column.professional.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{column.professional.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {column.worksThatDay
            ? `${pluralize(column.appointmentCount, "turno")} · ${pluralize(column.freeCount, "libre")}`
            : `${pluralize(column.appointmentCount, "turno")} · no atiende este día`}
        </span>
      </span>
    </div>
  );
}

/**
 * Agenda del día por profesional (RF03): en escritorio, una columna por
 * profesional; en celular, un profesional a la vez, elegido arriba.
 */
export function AgendaProfessionalsView({
  grid,
  dateLabel,
  onAppointmentClick,
  onFreeSlotClick,
}: AgendaProfessionalsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(grid.columns[0]?.professional.id ?? null);

  // Si el elegido no atiende el día nuevo (o se filtró), pasa al primero.
  useEffect(() => {
    if (!grid.columns.some((column) => column.professional.id === selectedId)) {
      setSelectedId(grid.columns[0]?.professional.id ?? null);
    }
  }, [grid.columns, selectedId]);

  if (grid.columns.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Ningún profesional atiende este día"
        description={`No hay profesionales con atención ni turnos el ${dateLabel}. Elegí otro día.`}
        className="rounded-2xl border bg-card shadow-card"
      />
    );
  }

  const selected = grid.columns.find((column) => column.professional.id === selectedId) ?? grid.columns[0];

  return (
    <section aria-label={`Agenda por profesional del ${dateLabel}`}>
      {/* Escritorio: grilla horas × profesionales. */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <div
            role="table"
            aria-label="Turnos por profesional"
            className="grid min-w-full"
            style={{ gridTemplateColumns: `4.5rem repeat(${grid.columns.length}, minmax(12rem, 1fr))` }}
          >
            <div role="row" className="contents">
              <div role="columnheader" className="sticky left-0 z-10 border-b bg-muted/60 px-3 py-3 text-xs font-medium text-muted-foreground">
                Hora
              </div>
              {grid.columns.map((column) => (
                <div role="columnheader" key={column.professional.id} className="border-b border-l bg-muted/60 px-3 py-2.5">
                  <ColumnHeader column={column} />
                </div>
              ))}
            </div>
            {grid.slots.map((time, row) => (
              <div role="row" key={time} className="contents">
                <div
                  role="rowheader"
                  className={cn(
                    "sticky left-0 z-10 bg-card px-3 pt-2.5 text-xs font-semibold text-slate-500",
                    row < grid.slots.length - 1 && "border-b"
                  )}
                >
                  {time}
                </div>
                {grid.columns.map((column) => (
                  <div
                    role="cell"
                    key={column.professional.id}
                    className={cn("h-[4.25rem] border-l p-1.5", row < grid.slots.length - 1 && "border-b")}
                  >
                    <Cell
                      cell={column.cells[row]}
                      column={column}
                      onAppointmentClick={onAppointmentClick}
                      onFreeSlotClick={onFreeSlotClick}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Celular: un profesional a la vez. */}
      <div className="space-y-3 md:hidden">
        <div
          role="tablist"
          aria-label="Profesionales del día"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        >
          {grid.columns.map((column) => {
            const active = column.professional.id === selected.professional.id;
            return (
              <button
                key={column.professional.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(column.professional.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                )}
              >
                {column.professional.name}
                <span
                  className={cn(
                    "rounded-md px-1.5 text-xs",
                    active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {column.appointmentCount}
                </span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-label={selected.professional.name} className="rounded-2xl border bg-card p-3 shadow-card">
          <ColumnHeader column={selected} className="border-b border-slate-100 px-1 pb-3" />
          <ul className="mt-2 divide-y divide-slate-100">
            {grid.slots.map((time, row) => (
              <li key={time} className="flex gap-3 py-1.5">
                <span className="w-12 shrink-0 pt-2 text-xs font-semibold text-slate-500">{time}</span>
                <div className="min-h-[3rem] min-w-0 flex-1">
                  <Cell
                    cell={selected.cells[row]}
                    column={selected}
                    onAppointmentClick={onAppointmentClick}
                    onFreeSlotClick={onFreeSlotClick}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
