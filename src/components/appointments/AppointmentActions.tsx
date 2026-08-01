"use client";

import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
import {
  isActiveAppointmentStatus,
  isFinalAppointmentStatus,
} from "@/lib/appointment-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
} from "lucide-react";
import { useState } from "react";

interface AppointmentActionsProps {
  appointment: Appointment;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onDelete?: (appointment: Appointment) => void;
  variant?: "table" | "card";
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

  const isActive = isActiveAppointmentStatus(appointment.status);
  const isFinal = isFinalAppointmentStatus(appointment.status);
  const showCancel = isActive;
  const showDelete = canDelete && Boolean(onDelete) && isFinal;

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant === "table" ? "ghost" : "outline"}
            size={variant === "table" ? "icon" : "sm"}
            className={cn(variant === "card" && "w-full")}
          >
            {variant === "table" ? (
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
          <DropdownMenuItem
            disabled={appointment.status === "atendido"}
            onSelect={(event) => {
              event.preventDefault();
              closeMenuThen(() => onStatusChange(appointment, "atendido"));
            }}
          >
            <CheckCircle2 className="text-emerald-600" />
            Marcar como atendido
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={appointment.status === "ausente"}
            onSelect={(event) => {
              event.preventDefault();
              closeMenuThen(() => setAbsentOpen(true));
            }}
          >
            <UserX className="text-slate-500" />
            Marcar como ausente
          </DropdownMenuItem>
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
        description={`Se cancelara el turno de ${appointment.patientName} el ${appointmentSlotLabel}. Esta accion no elimina el registro, solo cambia su estado.`}
        confirmLabel="Sí, cancelar turno"
        destructive
        onConfirm={() => onStatusChange(appointment, "cancelado")}
      />

      <ConfirmAlertDialog
        open={absentOpen}
        onOpenChange={setAbsentOpen}
        title="Marcar turno como ausente"
        description={`Se marcara como ausente el turno de ${appointment.patientName} el ${appointmentSlotLabel}.`}
        confirmLabel="Sí, marcar ausente"
        onConfirm={() => onStatusChange(appointment, "ausente")}
      />

      <ConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar turno permanentemente"
        description={`Se eliminara de forma permanente el turno de ${appointment.patientName} el ${appointmentSlotLabel}. Esta accion no se puede deshacer.`}
        confirmLabel="Sí, eliminar turno"
        destructive
        onConfirm={() => onDelete?.(appointment)}
      />
    </>
  );
}
