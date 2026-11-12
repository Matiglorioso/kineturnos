"use client";

import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Button } from "@/components/ui/button";
import { formatAppointmentSlotLabel } from "@/lib/datetime-format";
import { isFinalAppointmentStatus } from "@/lib/appointment-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import {
  Eye,
  FileHeart,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** El estado se cambia desde su etiqueta (AppointmentStatusMenu); este menú, para lo demás. */
export type AppointmentActionsVariant = "table" | "card";

interface AppointmentActionsProps {
  appointment: Appointment;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
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
  onDelete,
  variant = "table",
  canEdit = true,
  canDelete = false,
}: AppointmentActionsProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const closeMenuThen = (action: () => void) => {
    setMenuOpen(false);
    runAfterDropdownClose(action);
  };

  const appointmentSlotLabel = formatAppointmentSlotLabel(
    appointment.date,
    appointment.time
  );

  const inline = variant !== "card";
  // Solo se eliminan turnos en estado final.
  const showDelete = canDelete && Boolean(onDelete) && isFinalAppointmentStatus(appointment.status);

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        inline ? "justify-end" : "[&>*]:flex-1"
      )}
    >
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
