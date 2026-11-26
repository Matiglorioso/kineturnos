import type { AppointmentActionsVariant } from "@/components/appointments/AppointmentActions";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import { usePagination } from "@/hooks/use-pagination";
import { emptyStateActions, type EmptyStatePreset } from "@/lib/empty-states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimeShort } from "@/lib/datetime-format";
import { Appointment } from "@/types";

interface AgendaListViewProps {
  appointments: Appointment[];
  dateLabel: string;
  /** El día mostrado es hoy. */
  isToday?: boolean;
  renderActions: (appointment: Appointment, variant: AppointmentActionsVariant) => React.ReactNode;
  /** Etiqueta de estado; por defecto, solo lectura. */
  renderStatus?: (appointment: Appointment) => React.ReactNode;
  onCreateAppointment?: () => void;
  emptyPreset: EmptyStatePreset;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  /** Celular: tocar un turno abre sus acciones (panel desde abajo). */
  onSelectAppointment?: (appointment: Appointment) => void;
}

export function AgendaListView({
  appointments,
  dateLabel,
  isToday = false,
  renderActions,
  renderStatus = (appointment) => <StatusBadge status={appointment.status} />,
  onCreateAppointment,
  emptyPreset,
  showClearFilters,
  onClearFilters,
  onSelectAppointment,
}: AgendaListViewProps) {
  // Al cambiar de día vuelve a la primera página (los filtros ya cambian la lista).
  const pagination = usePagination(appointments, { storageKey: "agenda-dia", resetKey: dateLabel });

  if (appointments.length === 0) {
    return (
      <EmptyStateFromPreset
        preset={emptyPreset}
        actionLabel={
          onCreateAppointment
            ? emptyStateActions.scheduleAppointment
            : undefined
        }
        onAction={onCreateAppointment}
        secondaryActionLabel={
          showClearFilters ? emptyStateActions.clearFilters : undefined
        }
        onSecondaryAction={showClearFilters ? onClearFilters : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* El día ya se ve en la tira de días: acá queda solo para lectores de pantalla. */}
      <p className="sr-only">
        {isToday && "Hoy, "}
        {dateLabel}
      </p>

      <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Horario</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Sesión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                    {formatTimeShort(appointment.time)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {appointment.patientName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {appointment.professionalName}
                </TableCell>
                <TableCell>
                  <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {appointment.sessionType}
                  </span>
                </TableCell>
                <TableCell>
                  {renderStatus(appointment)}
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(appointment, "table")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Celular: un turno por fila (hora · paciente, con profesional y sesión · estado). */}
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:hidden">
        {pagination.items.map((appointment) => (
          <li key={appointment.id}>
            <button
              type="button"
              aria-label={`${formatTimeShort(appointment.time)} · ${appointment.patientName}`}
              className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left active:bg-muted/60"
              onClick={() => onSelectAppointment?.(appointment)}
            >
              <span className="w-11 shrink-0 text-sm font-bold tabular-nums text-brand-800">
                {formatTimeShort(appointment.time)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-slate-900">
                  {appointment.patientName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {appointment.professionalName} · {appointment.sessionType}
                </span>
              </span>
              <StatusBadge status={appointment.status} className="shrink-0" />
            </button>
          </li>
        ))}
      </ul>

      <ListPagination pagination={pagination} itemLabel="turnos" itemLabelSingular="turno" />
    </div>
  );
}
