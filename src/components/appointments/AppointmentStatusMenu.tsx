"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAppointmentStatusLabel, getStatusMenuOptions } from "@/lib/appointment-status";
import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
import { getTodayAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { Ban, Check, CheckCircle2, ChevronDown, UserX } from "lucide-react";
import { useState } from "react";

const OPTIONS: Record<
  Exclude<AppointmentStatus, "pendiente">,
  { label: string; icon: typeof Check; className: string }
> = {
  confirmado: { label: "Confirmado", icon: Check, className: "text-brand-700" },
  atendido: { label: "Atendido", icon: CheckCircle2, className: "text-emerald-600" },
  ausente: { label: "Ausente", icon: UserX, className: "text-slate-500" },
  cancelado: { label: "Cancelado", icon: Ban, className: "text-red-600" },
};

/**
 * La etiqueta de estado es también el control para cambiarlo: un solo lugar con
 * el estado del turno. Sin cambios posibles (estado final), queda como etiqueta.
 */
export function AppointmentStatusMenu({
  appointment,
  onStatusChange,
  className,
}: {
  appointment: Appointment;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState<"ausente" | "cancelado" | null>(null);
  const options = getStatusMenuOptions(appointment, getTodayAppDate());

  if (options.length === 0) {
    return <StatusBadge status={appointment.status} className={className} />;
  }

  const slot = formatAppointmentSlotLabel(appointment.date, appointment.time);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Estado: ${getAppointmentStatusLabel(appointment.status)}. Cambiar estado del turno de ${appointment.patientName}`}
          className={cn("rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
        >
          <StatusBadge
            status={appointment.status}
            className="cursor-pointer pr-1.5 hover:brightness-95"
            trailing={<ChevronDown className="h-3 w-3 opacity-70" />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {options.map((status) => {
            const option = OPTIONS[status as keyof typeof OPTIONS];
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={status}
                className={status === "cancelado" ? "text-red-600 focus:text-red-600" : undefined}
                onSelect={() => {
                  // Ausente y cancelado se confirman; el resto se aplica directo.
                  if (status === "ausente" || status === "cancelado") setConfirming(status);
                  else onStatusChange(appointment, status);
                }}
              >
                <Icon className={option.className} />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmAlertDialog
        open={confirming === "cancelado"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Cancelar turno"
        description={`Se cancelará el turno de ${appointment.patientName} el ${slot}. Esta acción no elimina el registro, solo cambia su estado.`}
        confirmLabel="Sí, cancelar turno"
        destructive
        onConfirm={() => onStatusChange(appointment, "cancelado")}
      />
      <ConfirmAlertDialog
        open={confirming === "ausente"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Marcar turno como ausente"
        description={`Se marcará como ausente el turno de ${appointment.patientName} el ${slot}.`}
        confirmLabel="Sí, marcar ausente"
        onConfirm={() => onStatusChange(appointment, "ausente")}
      />
    </>
  );
}
