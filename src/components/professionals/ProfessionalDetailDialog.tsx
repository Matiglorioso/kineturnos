"use client";

import { CompactAppointmentList } from "@/components/shared/CompactAppointmentList";
import { DetailRow, DetailSection, detailRowsClassName } from "@/components/shared/DetailSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDisplayEntity } from "@/hooks/use-display-entity";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProfessionalUpcomingAppointments,
} from "@/lib/professional-utils";
import { cn } from "@/lib/utils";
import { Appointment, Professional } from "@/types";
import { Pencil, Stethoscope, Trash2, UserCog, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ProfessionalDetailMobile } from "@/components/professionals/ProfessionalDetailMobile";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { usePermissions } from "@/hooks/use-permissions";
import { readableAvatarColor } from "@/lib/professional-utils";

interface ProfessionalDetailDialogProps {
  professional: Professional | null;
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteRequest?: (professional: Professional) => void;
  onEdit?: (professional: Professional) => void;
  onToggleActive?: (professional: Professional) => void;
}

export function ProfessionalDetailDialog({
  professional,
  appointments,
  open,
  onOpenChange,
  onDeleteRequest,
  onEdit,
  onToggleActive,
}: ProfessionalDetailDialogProps) {
  const { activeEntity: activeProfessional } = useDisplayEntity(professional, open);
  const { can } = usePermissions();
  const isDesktop = useIsDesktop();

  const upcoming = useMemo(
    () =>
      activeProfessional
        ? getProfessionalUpcomingAppointments(appointments, activeProfessional.id, 5)
        : [],
    [activeProfessional, appointments]
  );

  if (!activeProfessional) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={!isDesktop}
        className={cn(
          "max-h-[90vh] overflow-y-auto focus:outline-none sm:max-w-3xl",
          // Celular: pantalla completa, como la ficha del paciente.
          "max-lg:!inset-0 max-lg:!flex max-lg:!h-[100dvh] max-lg:!max-h-[100dvh] max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!flex-col max-lg:!gap-0 max-lg:!overflow-hidden max-lg:!rounded-none max-lg:!border-0 max-lg:!p-0"
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        {!isDesktop ? (
          <ProfessionalDetailMobile
            professional={activeProfessional}
            upcoming={upcoming}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDeleteRequest={onDeleteRequest}
          />
        ) : (
          <>
        <DialogHeader>
          <div className="flex items-stretch gap-3 pr-8">
            <span aria-hidden className={cn("w-1 shrink-0 self-stretch rounded-sm", readableAvatarColor(activeProfessional.avatarColor))} />
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle className="text-xl">
                {activeProfessional.name}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {activeProfessional.specialty}
                  </span>
                  <Badge variant={activeProfessional.active ? "success" : "neutral"}>
                    {activeProfessional.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <DetailSection title="Datos del profesional">
            <dl className={detailRowsClassName}>
              {activeProfessional.license && <DetailRow label="Matrícula">{activeProfessional.license}</DetailRow>}
              {activeProfessional.phone && <DetailRow label="Teléfono">{activeProfessional.phone}</DetailRow>}
              {activeProfessional.email && <DetailRow label="Email">{activeProfessional.email}</DetailRow>}
              <DetailRow label="Días">
                <span className="flex flex-wrap gap-1">
                  {activeProfessional.days.map((day) => (
                    <span key={day} className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-slate-700">
                      {day}
                    </span>
                  ))}
                </span>
              </DetailRow>
              {activeProfessional.notes && (
                <DetailRow label="Observaciones">{activeProfessional.notes}</DetailRow>
              )}
            </dl>
          </DetailSection>

          <CompactAppointmentList
            title="Próximos turnos"
            appointments={upcoming}
            show="patient"
            emptyText="No tiene turnos próximos."
          />
        </div>

        {(onEdit || onToggleActive || onDeleteRequest) && (
          <DialogFooter className="flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
            {/* Eliminar queda a la izquierda, separado de las acciones de todos los días. */}
            {onDeleteRequest && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto sm:w-auto"
                onClick={() => onDeleteRequest(activeProfessional)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onEdit(activeProfessional)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
            {onToggleActive && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onToggleActive(activeProfessional)}
              >
                <UserX className="h-4 w-4" />
                {activeProfessional.active ? "Desactivar" : "Activar"}
              </Button>
            )}
            {can("users:manage") && (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                {/* Abre su usuario si ya tiene, o el alta con este profesional elegido. */}
                <Link href={`/usuarios?profesional=${encodeURIComponent(activeProfessional.id)}`}>
                  <UserCog className="h-4 w-4" />
                  Acceso al sistema
                </Link>
              </Button>
            )}
          </DialogFooter>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
