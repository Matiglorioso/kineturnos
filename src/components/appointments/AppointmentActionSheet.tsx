"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { BottomSheetContent, Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getStatusMenuOptions, isFinalAppointmentStatus } from "@/lib/appointment-status";
import { formatAppDate, getTodayAppDate } from "@/lib/date-utils";
import { statusChangeConfirmation } from "@/lib/status-confirm";
import { normalizeTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUS_ACTIONS: Record<Exclude<AppointmentStatus, "pendiente">, { label: string; className?: string; primary?: boolean }> = {
  confirmado: { label: "Confirmar", primary: true },
  atendido: { label: "Atendido", primary: true },
  ausente: { label: "Ausente" },
  cancelado: { label: "Cancelar turno", className: "text-red-600 hover:text-red-700" },
};

interface AppointmentActionSheetProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => Promise<void> | void;
  /** Reprogramar = editar el turno (fecha, hora, profesional). */
  onReschedule?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  canSeeClinical: boolean;
}

/**
 * Acciones de un turno en el celular: suben desde abajo, grandes y a mano del pulgar.
 * Mismas reglas que en la computadora (estados permitidos y confirmación de los finales).
 */
export function AppointmentActionSheet({
  appointment,
  onOpenChange,
  onStatusChange,
  onReschedule,
  onDelete,
  canSeeClinical,
}: AppointmentActionSheetProps) {
  const [confirming, setConfirming] = useState<AppointmentStatus | "eliminar" | null>(null);
  const open = Boolean(appointment);

  if (!appointment) {
    return <Sheet open={false} onOpenChange={onOpenChange} />;
  }

  const options = getStatusMenuOptions(appointment, getTodayAppDate()).filter(
    (status): status is Exclude<AppointmentStatus, "pendiente"> => status !== "pendiente"
  );
  const final = isFinalAppointmentStatus(appointment.status);
  const confirmation =
    confirming && confirming !== "eliminar" ? statusChangeConfirmation(appointment, confirming) : null;

  const apply = (status: Exclude<AppointmentStatus, "pendiente">) => {
    if (statusChangeConfirmation(appointment, status)) {
      setConfirming(status);
      return;
    }
    void onStatusChange(appointment, status);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent
          className="lg:hidden"
          // Abre sin resaltar el primer botón.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <div className="space-y-1 px-1">
            <SheetTitle className="pr-0 text-lg">
              {appointment.patientName} · {normalizeTime(appointment.time)}
            </SheetTitle>
            <SheetDescription asChild>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="first-letter:uppercase">{formatAppDate(appointment.date, "EEEE dd-MM-yyyy")}</span>
                <span>·</span>
                <span>{appointment.professionalName}</span>
                <span>·</span>
                <span>{appointment.sessionType}</span>
                <StatusBadge status={appointment.status} />
              </div>
            </SheetDescription>
          </div>

          {(options.length > 0 || (!final && onReschedule)) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {options.map((status) => {
                const action = STATUS_ACTIONS[status];
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={action.primary ? "default" : "outline"}
                    className={cn("h-12 text-sm", action.className)}
                    onClick={() => apply(status)}
                  >
                    {action.label}
                  </Button>
                );
              })}
              {!final && onReschedule && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 text-sm"
                  onClick={() => {
                    onOpenChange(false);
                    onReschedule(appointment);
                  }}
                >
                  Reprogramar
                </Button>
              )}
            </div>
          )}

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            <Link
              href={`/pacientes?paciente=${encodeURIComponent(appointment.patientId)}`}
              className="flex min-h-12 items-center justify-between px-1 text-sm font-semibold text-brand-800"
            >
              Ficha del paciente
              <ChevronRight className="h-4 w-4" />
            </Link>
            {canSeeClinical && (
              <Link
                href={`/pacientes/${encodeURIComponent(appointment.patientId)}/historia?turno=${encodeURIComponent(appointment.id)}`}
                className="flex min-h-12 items-center justify-between px-1 text-sm font-semibold text-brand-800"
              >
                Historia clínica
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            {final && onDelete && (
              <button
                type="button"
                className="flex min-h-12 w-full items-center px-1 text-left text-sm font-semibold text-red-600"
                onClick={() => setConfirming("eliminar")}
              >
                Eliminar turno
              </button>
            )}
          </div>
        </BottomSheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(value) => !value && setConfirming(null)}
        title={confirmation?.title ?? ""}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel ?? ""}
        cancelLabel="Volver"
        destructive={confirmation?.destructive}
        onConfirm={() => {
          if (confirming && confirming !== "eliminar") void onStatusChange(appointment, confirming);
          setConfirming(null);
          onOpenChange(false);
        }}
      />
      <ConfirmAlertDialog
        open={confirming === "eliminar"}
        onOpenChange={(value) => !value && setConfirming(null)}
        title="Eliminar turno permanentemente"
        description={`Se eliminará de forma permanente el turno de ${appointment.patientName}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar turno"
        cancelLabel="Volver"
        destructive
        onConfirm={() => {
          onDelete?.(appointment);
          setConfirming(null);
          onOpenChange(false);
        }}
      />
    </>
  );
}
