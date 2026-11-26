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
import { getTodayAppDate } from "@/lib/date-utils";
import { statusChangeConfirmation } from "@/lib/status-confirm";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { Ban, Check, CheckCircle2, ChevronDown, UserX } from "lucide-react";
import { useState } from "react";

const OPTIONS: Record<
  Exclude<AppointmentStatus, "pendiente">,
  { label: string; icon: typeof Check; className: string }
> = {
  confirmado: { label: "Confirmado", icon: Check, className: "text-sky-700" },
  atendido: { label: "Atendido", icon: CheckCircle2, className: "text-brand-700" },
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
  const [confirming, setConfirming] = useState<AppointmentStatus | null>(null);
  const options = getStatusMenuOptions(appointment, getTodayAppDate());

  if (options.length === 0) {
    return <StatusBadge status={appointment.status} className={className} />;
  }

  const confirmation = confirming ? statusChangeConfirmation(appointment, confirming) : null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Estado: ${getAppointmentStatusLabel(appointment.status)}. Cambiar estado del turno de ${appointment.patientName}`}
          className={cn("rounded-full lg:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
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
                  // Los estados finales (atendido, ausente, cancelado) se confirman; confirmar va directo.
                  if (statusChangeConfirmation(appointment, status)) setConfirming(status);
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
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirmation?.title ?? ""}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel ?? ""}
        cancelLabel="Volver"
        destructive={confirmation?.destructive}
        onConfirm={() => confirming && onStatusChange(appointment, confirming)}
      />
    </>
  );
}
