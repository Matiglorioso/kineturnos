import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
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
  renderActions: (appointment: Appointment, variant: "table" | "card") => React.ReactNode;
  onCreateAppointment: () => void;
  emptyPreset: EmptyStatePreset;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
}

export function AgendaListView({
  appointments,
  dateLabel,
  renderActions,
  onCreateAppointment,
  emptyPreset,
  showClearFilters,
  onClearFilters,
}: AgendaListViewProps) {
  if (appointments.length === 0) {
    return (
      <EmptyStateFromPreset
        preset={emptyPreset}
        actionLabel={emptyStateActions.scheduleAppointment}
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
      <p className="text-sm text-muted-foreground">
        Mostrando turnos de hoy — <span className="capitalize">{dateLabel}</span>
      </p>

      <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Horario</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Sesion</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                      {formatTimeShort(appointment.time)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {appointment.duration} min
                    </span>
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
                  <StatusBadge status={appointment.status} />
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(appointment, "table")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            actions={renderActions(appointment, "card")}
          />
        ))}
      </div>
    </div>
  );
}
