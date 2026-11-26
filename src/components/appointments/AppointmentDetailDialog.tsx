"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatAppDateLong,
  formatAppointmentScheduleDetail,
} from "@/lib/datetime-format";
import { Appointment } from "@/types";
import {
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  User,
} from "lucide-react";

interface AppointmentDetailDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (appointment: Appointment) => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-brand-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  onEdit,
}: AppointmentDetailDialogProps) {
  if (!appointment) return null;

  const dateLabel = formatAppDateLong(appointment.date);
  const scheduleDetail = formatAppointmentScheduleDetail(appointment.time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto focus:outline-none sm:max-w-lg"
        // Abre con el foco en el diálogo y no en "Cerrar" (si no, el botón aparece resaltado).
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader>
          {/* pr-10: deja lugar para la cruz de cierre, que va arriba a la derecha. */}
          <div className="pr-10 text-left">
            <DialogTitle>Detalle del turno</DialogTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <DialogDescription>{appointment.patientName}</DialogDescription>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <DetailRow icon={User} label="Paciente" value={appointment.patientName} />
          <DetailRow
            icon={Stethoscope}
            label="Profesional"
            value={appointment.professionalName}
          />
          <DetailRow icon={Calendar} label="Fecha" value={dateLabel} />
          <DetailRow
            icon={Clock}
            label="Horario"
            value={scheduleDetail}
          />
          <DetailRow
            icon={FileText}
            label="Tipo de sesión"
            value={appointment.sessionType}
          />
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observaciones
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {appointment.notes?.trim() || "Sin observaciones registradas."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(appointment);
              }}
            >
              Editar turno
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
