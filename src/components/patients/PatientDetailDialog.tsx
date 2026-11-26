"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { CompactAppointmentList } from "@/components/shared/CompactAppointmentList";
import { DetailRow, DetailSection, detailRowsClassName } from "@/components/shared/DetailSection";
import { PatientCoverageSection } from "@/components/patients/PatientCoverageSection";
import { PatientDetailMobile } from "@/components/patients/PatientDetailMobile";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useDisplayEntity } from "@/hooks/use-display-entity";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { splitPatientAppointments } from "@/lib/patient-appointments";
import { cn } from "@/lib/utils";
import { Appointment, Patient } from "@/types";
import { formatAppDate } from "@/lib/date-utils";
import { formatAge } from "@/lib/birth-date";
import { formatCuil } from "@/lib/document-validation";
import { CalendarPlus, FileHeart, Pencil, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

/** Turnos que se muestran de cada lista (el resto, con "Ver todos"): así la ficha entra sin scroll. */
const UPCOMING_SHOWN = 3;

const HISTORY_SHOWN = 5;

interface PatientDetailDialogProps {
  patient: Patient | null;
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleStatus?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  /** Cambió una autorización: refrescar la cobertura en la lista. */
  onCoverageChange?: () => void;
}

export function PatientDetailDialog({
  patient,
  appointments,
  open,
  onOpenChange,
  onToggleStatus,
  onEdit,
  onCoverageChange,
}: PatientDetailDialogProps) {
  const { activeEntity: activePatient } = useDisplayEntity(patient, open);
  const isDesktop = useIsDesktop();
  const { can, canSchedule } = usePermissions();

  const { upcoming, past } = useMemo(
    () =>
      activePatient
        ? splitPatientAppointments(appointments, activePatient.id)
        : { upcoming: [], past: [] },
    [appointments, activePatient]
  );

  if (!activePatient) return null;

  const canBook = canSchedule && activePatient.status === "activo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={!isDesktop}
        className={cn(
          "max-h-[90vh] overflow-y-auto focus:outline-none sm:max-w-3xl lg:max-w-4xl",
          // Celular: pantalla completa (boceto, pantallas 5 a 7).
          "max-lg:!inset-0 max-lg:!flex max-lg:!h-[100dvh] max-lg:!max-h-[100dvh] max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!flex-col max-lg:!gap-0 max-lg:!overflow-hidden max-lg:!rounded-none max-lg:!border-0 max-lg:!p-0"
        )}
        // Abre con el foco en el cuadro, sin resaltar el primer botón.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        {!isDesktop ? (
          <PatientDetailMobile
            patient={activePatient}
            upcoming={upcoming}
            past={past}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onCoverageChange={onCoverageChange}
          />
        ) : (
          <>
        <DialogHeader>
          {/* Una sola línea: nombre y estado a la izquierda; las acciones a la derecha. */}
          <div className="flex items-center gap-3 pr-8 sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <DialogTitle className="truncate text-left text-lg">{activePatient.name}</DialogTitle>
                <PatientStatusBadge active={activePatient.status === "activo"} />
              </div>
              <DialogDescription className="sr-only">Ficha del paciente</DialogDescription>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canBook && (
                <Button asChild size="sm" className="h-8 px-3 text-xs">
                  <Link href={`/agenda?nuevo=1&paciente=${encodeURIComponent(activePatient.id)}`}>
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Agendar turno
                  </Link>
                </Button>
              )}
              {can("clinical:read") && (
                <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Link href={`/pacientes/${encodeURIComponent(activePatient.id)}/historia`}>
                    <FileHeart className="h-3.5 w-3.5" />
                    Historia clínica
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Dos columnas en la computadora: a la izquierda quién es (datos y obra social), a la derecha sus turnos. */}
        <div className="grid min-w-0 grid-cols-2 gap-4">
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <DetailSection title="Datos del paciente">
                {/* Los datos opcionales que no están cargados no se muestran. */}
                <dl className={detailRowsClassName}>
                  <DetailRow label="DNI">{activePatient.dni}</DetailRow>
                  <DetailRow label="Teléfono">
                    <a href={`tel:${activePatient.phone.replace(/[^\d+]/g, "")}`}>
                      {activePatient.phone}
                    </a>
                  </DetailRow>
                  {activePatient.cuil && <DetailRow label="CUIL">{formatCuil(activePatient.cuil)}</DetailRow>}
                  {activePatient.birthDate && (
                    <DetailRow label="Nacimiento">
                      {formatAppDate(activePatient.birthDate)} ({formatAge(activePatient.birthDate)})
                    </DetailRow>
                  )}
                  {activePatient.email && <DetailRow label="Email">{activePatient.email}</DetailRow>}
                  {activePatient.notes?.trim() && (
                    <DetailRow label="Observaciones">{activePatient.notes.trim()}</DetailRow>
                  )}
                </dl>
              </DetailSection>
            </div>

            <PatientCoverageSection
              key={activePatient.id}
              patient={activePatient}
              canManage={can("insurances:write")}
              onChanged={onCoverageChange}
              className="flex-1"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <CompactAppointmentList
              title="Próximos turnos"
              appointments={upcoming}
              show="professional"
              emptyText="No tiene turnos próximos."
              limit={UPCOMING_SHOWN}
              showSessionType={false}
            />
            <CompactAppointmentList
              title="Historial de turnos"
              appointments={past}
              show="professional"
              emptyText="Todavía no tiene turnos pasados."
              limit={HISTORY_SHOWN}
              showSessionType={false}
              className="flex-1"
            />
          </div>
        </div>

        {(onEdit || onToggleStatus) && (
          <DialogFooter className="flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-full px-3 text-xs sm:w-auto"
                  onClick={() => onEdit(activePatient)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar paciente
                </Button>
              )}
              {onToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-full px-3 text-xs sm:w-auto"
                  onClick={() => onToggleStatus(activePatient)}
                >
                  <UserX className="h-3.5 w-3.5" />
                  {activePatient.status === "activo"
                    ? "Dar de baja"
                    : "Reactivar"}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
