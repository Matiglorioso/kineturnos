"use client";

import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
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
  UserX,
} from "lucide-react";
import { useState } from "react";

interface AppointmentActionsProps {
  appointment: Appointment;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  variant?: "table" | "card";
}

function runAfterDropdownClose(action: () => void) {
  window.setTimeout(action, 0);
}

export function AppointmentActions({
  appointment,
  onView,
  onEdit,
  onStatusChange,
  variant = "table",
}: AppointmentActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [absentOpen, setAbsentOpen] = useState(false);

  const closeMenuThen = (action: () => void) => {
    setMenuOpen(false);
    runAfterDropdownClose(action);
  };

  const appointmentSlotLabel = formatAppointmentSlotLabel(
    appointment.date,
    appointment.time
  );

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
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              closeMenuThen(() => onEdit(appointment));
            }}
          >
            <Pencil className="text-muted-foreground" />
            Editar
          </DropdownMenuItem>
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
          <DropdownMenuItem
            disabled={appointment.status === "cancelado"}
            onSelect={(event) => {
              event.preventDefault();
              closeMenuThen(() => setCancelOpen(true));
            }}
            className="text-red-600 focus:text-red-600"
          >
            <Ban className="text-red-600" />
            Cancelar turno
          </DropdownMenuItem>
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
    </>
  );
}
