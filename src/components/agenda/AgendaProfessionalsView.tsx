"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status";
import type { ProfessionalDayCell, ProfessionalDayColumn, ProfessionalDayGrid } from "@/lib/agenda-professionals";
import { pluralize } from "@/lib/pluralize";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { Plus, Stethoscope } from "lucide-react";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { useEffect, useState } from "react";
import { readableAvatarColor } from "@/lib/professional-utils";

const STATUS_STYLES: Record<AppointmentStatus, { card: string; dot: string }> = {
  pendiente: { card: "border-amber-200 bg-amber-50/90 hover:bg-amber-50", dot: "bg-amber-500" },
  confirmado: { card: "border-sky-200 bg-sky-50/90 hover:bg-sky-50", dot: "bg-sky-500" },
  atendido: { card: "border-brand-200 bg-brand-50/90 hover:bg-brand-50", dot: "bg-brand-500" },
  cancelado: { card: "border-red-200 bg-red-50/80 opacity-80 hover:bg-red-50", dot: "bg-red-500" },
  ausente: { card: "border-slate-300 bg-slate-100/90 opacity-80 hover:bg-slate-100", dot: "bg-slate-400" },
};

interface AgendaProfessionalsViewProps {
  grid: ProfessionalDayGrid;
  dateLabel: string;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Hueco libre: abre "Agendar turno" con el profesional y la hora. Sin permiso, no se ofrece. */
  onFreeSlotClick?: (professionalId: string, time: string) => void;
  /** Celular: tocar un turno abre sus acciones (panel desde abajo). */
  onMobileAppointmentClick?: (appointment: Appointment) => void;
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
        "flex w-full min-w-0 flex-col justify-center rounded-lg border px-2.5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
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
        className="flex h-full w-full items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 text-sm text-slate-500 transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Plus className="h-3.5 w-3.5" />
        Libre
      </button>
    ) : (
      <div className="flex h-full items-center rounded-lg border border-dashed border-slate-200 px-2.5 text-sm text-slate-500">
        Libre
      </div>
    );
  }

  return (
    <div
      className="flex h-full items-center rounded-lg bg-slate-50 px-2.5 text-xs text-slate-500"
      aria-label={cell.kind === "ocupado" ? "Ocupado" : "No disponible"}
    >
      {cell.kind === "ocupado" ? "Ocupado" : "—"}
    </div>
  );
}

function ColumnHeader({ column, className }: { column: ProfessionalDayColumn; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-stretch gap-2.5", className)}>
      <span aria-hidden className={cn("w-1 shrink-0 self-stretch rounded-sm", readableAvatarColor(column.professional.avatarColor))} />
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
  onMobileAppointmentClick,
}: AgendaProfessionalsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(grid.columns[0]?.professional.id ?? null);

  // Si el elegido no atiende el día nuevo (o se filtró), pasa al primero.
  useEffect(() => {
    if (!grid.columns.some((column) => column.professional.id === selectedId)) {
      setSelectedId(grid.columns[0]?.professional.id ?? null);
    }
  }, [grid.columns, selectedId]);

  const { ref: chipsRef, handlers: dragHandlers, wasDrag } = useDragScroll<HTMLDivElement>();

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

      {/* Celular: un profesional a la vez, elegido con flechas o con la lista del teléfono. */}
      <div className="space-y-3 md:hidden">
        {/* Profesionales en una fila que se desliza hacia el costado (con el dedo o arrastrando). */}
        <div className="relative -mx-4">
          <div
            ref={chipsRef}
            role="tablist"
            aria-label="Profesionales del día"
            {...dragHandlers}
            className="flex cursor-grab touch-pan-x select-none gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          >
            {grid.columns.map((column) => {
              const active = column.professional.id === selected.professional.id;
              return (
                <button
                  key={column.professional.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-active={active || undefined}
                  onClick={() => {
                    // Un arrastre no cuenta como toque.
                    if (!wasDrag()) setSelectedId(column.professional.id);
                  }}
                  className={cn(
                    "flex h-10 shrink-0 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-200 bg-brand-50 text-brand-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600"
                  )}
                >
                  {column.professional.name}
                </button>
              );
            })}
          </div>
          {/* Sombra en el borde: avisa que la fila sigue hacia el costado. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
        </div>
        {!selected.worksThatDay && (
          <p className="px-1 text-xs text-muted-foreground">No atiende este día.</p>
        )}

        {/* Un horario por renglón: hora y el turno, "+ Libre" para agendar, o "—". */}
        <ul
          aria-label={`Horarios de ${selected.professional.name}`}
          className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
        >
          {grid.slots.map((time, row) => {
            const cell = selected.cells[row];
            return (
              <li key={time} className="flex min-h-12 items-center gap-3 px-3 py-1.5">
                <span className="w-11 shrink-0 text-sm font-bold tabular-nums text-brand-800">{time}</span>
                <div className="min-w-0 flex-1">
                  {cell.kind === "turnos" ? (
                    <div className="divide-y divide-slate-100">
                      {cell.appointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => (onMobileAppointmentClick ?? onAppointmentClick)(appointment)}
                          aria-label={`${appointment.time} · ${appointment.patientName} · ${APPOINTMENT_STATUS_LABELS[appointment.status]}`}
                          className="flex w-full items-center gap-2 py-1 text-left"
                        >
                          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">
                            {appointment.patientName}
                          </span>
                          <StatusBadge status={appointment.status} className="shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : cell.kind === "libre" && onFreeSlotClick ? (
                    <button
                      type="button"
                      onClick={() => onFreeSlotClick(selected.professional.id, cell.time)}
                      aria-label={`Agendar con ${selected.professional.name} a las ${cell.time}`}
                      className="flex w-full items-center gap-1.5 py-1 text-sm font-medium text-brand-700"
                    >
                      <Plus className="h-4 w-4" />
                      Libre
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400">
                      {cell.kind === "libre" ? "Libre" : cell.kind === "ocupado" ? "Ocupado" : "—"}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
