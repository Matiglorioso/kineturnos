"use client";

import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
import {
  canRegisterAttendance,
  getNextAppointmentStatuses,
  getQuickStatusAction,
  isActiveAppointmentStatus,
  isFinalAppointmentStatus,
} from "@/lib/appointment-status";
import { getNowAppMinutes, getTodayAppDate } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Ban,
  Check,
  CheckCircle2,
  Eye,
  FileHeart,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Tabla y tarjeta llevan la acción rápida; "compact" (bloques de la semana) solo el menú. */
export type AppointmentActionsVariant = "table" | "card" | "compact";

interface AppointmentActionsProps {
  appointment: Appointment;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onDelete?: (appointment: Appointment) => void;
  variant?: AppointmentActionsVariant;
  canEdit?: boolean;
  canDelete?: boolean;
}

function runAfterDropdownClose(action: () => void) {
  window.setTimeout(action, 0);
}

export function AppointmentActions({
  appointment,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  variant = "table",
  canEdit = true,
  canDelete = false,
}: AppointmentActionsProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [absentOpen, setAbsentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const closeMenuThen = (action: () => void) => {
    setMenuOpen(false);
    runAfterDropdownClose(action);
  };

  const appointmentSlotLabel = formatAppointmentSlotLabel(
    appointment.date,
    appointment.time
  );

  // Máquina de estados: solo se ofrecen las transiciones permitidas.
  const nextStatuses = getNextAppointmentStatuses(appointment.status);
  const isActive = isActiveAppointmentStatus(appointment.status);
  const isFinal = isFinalAppointmentStatus(appointment.status);
  const today = getTodayAppDate();
  const attendanceAllowed = canRegisterAttendance(appointment.date, today);
  const quickAction =
    variant === "compact" ? null : getQuickStatusAction(appointment, today, getNowAppMinutes());
  const inline = variant !== "card";
  const showCancel = isActive;
  const showDelete = canDelete && Boolean(onDelete) && isFinal;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        inline ? "justify-end" : "[&>*]:flex-1"
      )}
    >
      {/* La acción más probable a un toque, como en el panel; el resto queda en el menú. */}
      {quickAction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={
            quickAction === "confirmado"
              ? `Confirmar turno: ${appointment.patientName}`
              : `Marcar atendido: ${appointment.patientName}`
          }
          onClick={() => onStatusChange(appointment, quickAction)}
        >
          {quickAction === "confirmado" ? (
            <Check className="h-4 w-4 text-brand-700" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          {quickAction === "confirmado" ? "Confirmar" : "Atendido"}
        </Button>
      )}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={inline ? "ghost" : "outline"}
            size={inline ? "icon" : "sm"}
            className={cn(variant === "card" && "w-full")}
          >
            {inline ? (
              <MoreHorizontal className="h-4 w-4" />
            ) : (
              <>
                <MoreHorizontal className="h-4 w-4" />
                Acciones
              </>
            )}
            <span className="sr-only">Acciones del turno</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              closeMenuThen(() => onView(appointment));
            }}
          >
            <Eye className="text-muted-foreground" />
            Ver detalle
          </DropdownMenuItem>
          {can("clinical:read") && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                closeMenuThen(() =>
                  router.push(
                    `/pacientes/${encodeURIComponent(appointment.patientId)}/historia?turno=${encodeURIComponent(appointment.id)}`
                  )
                );
              }}
            >
              <FileHeart className="text-muted-foreground" />
              Historia clínica
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                closeMenuThen(() => onEdit(appointment));
              }}
            >
              <Pencil className="text-muted-foreground" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {appointment.status === "pendiente" && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                closeMenuThen(() => onStatusChange(appointment, "confirmado"));
              }}
            >
              <Check className="text-brand-700" />
              Confirmar turno
            </DropdownMenuItem>
          )}
          {/* La asistencia no se ofrece en turnos de días futuros (el servidor la rechazaría). */}
          {attendanceAllowed && (
            <>
              <DropdownMenuItem
                disabled={!nextStatuses.includes("atendido")}
                onSelect={(event) => {
                  event.preventDefault();
                  closeMenuThen(() => onStatusChange(appointment, "atendido"));
                }}
              >
                <CheckCircle2 className="text-emerald-600" />
                Marcar como atendido
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!nextStatuses.includes("ausente")}
                onSelect={(event) => {
                  event.preventDefault();
                  closeMenuThen(() => setAbsentOpen(true));
                }}
              >
                <UserX className="text-slate-500" />
                Marcar como ausente
              </DropdownMenuItem>
            </>
          )}
          {showCancel && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                closeMenuThen(() => setCancelOpen(true));
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="text-red-600" />
              Cancelar turno
            </DropdownMenuItem>
          )}
          {showDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  closeMenuThen(() => setDeleteOpen(true));
                }}
                className="text-red-700 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="text-red-700" />
                Eliminar turno
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmAlertDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar turno"
        description={`Se cancelará el turno de ${appointment.patientName} el ${appointmentSlotLabel}. Esta acción no elimina el registro, solo cambia su estado.`}
        confirmLabel="Sí, cancelar turno"
        destructive
        onConfirm={() => onStatusChange(appointment, "cancelado")}
      />

      <ConfirmAlertDialog
        open={absentOpen}
        onOpenChange={setAbsentOpen}
        title="Marcar turno como ausente"
        description={`Se marcará como ausente el turno de ${appointment.patientName} el ${appointmentSlotLabel}.`}
        confirmLabel="Sí, marcar ausente"
        onConfirm={() => onStatusChange(appointment, "ausente")}
      />

      <ConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar turno permanentemente"
        description={`Se eliminará de forma permanente el turno de ${appointment.patientName} el ${appointmentSlotLabel}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar turno"
        destructive
        onConfirm={() => onDelete?.(appointment)}
      />
    </div>
  );
}
