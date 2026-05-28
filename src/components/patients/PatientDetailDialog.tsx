"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { AppointmentListSection } from "@/components/shared/AppointmentListSection";
import { InfoRow } from "@/components/shared/InfoRow";
import { emptyStates } from "@/lib/empty-states";
import { useDisplayEntity } from "@/hooks/use-display-entity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { countPatientAppointments } from "@/lib/patient-appointments";
import { splitPatientAppointments } from "@/lib/patient-appointments";
import { cn, getInitials } from "@/lib/utils";
import { Appointment, Patient } from "@/types";
import { formatAppDate } from "@/lib/date-utils";
import {
  Calendar,
  CalendarClock,
  History,
  Mail,
  Phone,
  Shield,
  Trash2,
  Pencil,
  User,
  UserX,
} from "lucide-react";
import { useMemo } from "react";

interface PatientDetailDialogProps {
  patient: Patient | null;
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteRequest?: (patient: Patient) => void;
  onToggleStatus?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
}

export function PatientDetailDialog({
  patient,
  appointments,
  open,
  onOpenChange,
  onDeleteRequest,
  onToggleStatus,
  onEdit,
}: PatientDetailDialogProps) {
  const { activeEntity: activePatient } = useDisplayEntity(patient, open);

  const { upcoming, past, totalAppointments } = useMemo(() => {
    if (!activePatient) {
      return { upcoming: [], past: [], totalAppointments: 0 };
    }

    const split = splitPatientAppointments(appointments, activePatient.id);

    return {
      ...split,
      totalAppointments: countPatientAppointments(
        appointments,
        activePatient.id
      ),
    };
  }, [appointments, activePatient]);

  if (!activePatient) return null;

  const createdAtLabel = activePatient.createdAt
    ? formatAppDate(activePatient.createdAt)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-sm">
              {getInitials(activePatient.name)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle className="text-xl">{activePatient.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Ficha del paciente y historial de turnos
              </DialogDescription>
              <div className="mt-3">
                <PatientStatusBadge
                  active={activePatient.status === "activo"}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={User} label="DNI" value={activePatient.dni} />
            <InfoRow icon={Phone} label="Teléfono" value={activePatient.phone} />
            <InfoRow
              icon={Mail}
              label="Email"
              value={activePatient.email || "No registrado"}
            />
            <InfoRow
              icon={Shield}
              label="Obra social"
              value={activePatient.insurance}
            />
            {createdAtLabel && (
              <InfoRow
                icon={Calendar}
                label="Fecha de alta"
                value={createdAtLabel}
              />
            )}
          </div>

          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observaciones
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {activePatient.notes?.trim() || "Sin observaciones registradas."}
            </p>
          </div>

          <div className={cn("space-y-6 border-t border-slate-100 pt-6")}>
            <AppointmentListSection
              title="Próximos turnos"
              icon={CalendarClock}
              appointments={upcoming}
              emptyPreset={emptyStates.patientDetail.noUpcoming}
            />

            <AppointmentListSection
              title="Historial de turnos"
              icon={History}
              appointments={past}
              emptyPreset={emptyStates.patientDetail.noHistory}
            />
          </div>
        </div>

        {(onEdit || onToggleStatus || onDeleteRequest) && (
          <DialogFooter className="flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="w-full text-xs text-muted-foreground sm:max-w-[45%]">
              {totalAppointments > 0
                ? `Este paciente tiene ${totalAppointments} turno${totalAppointments !== 1 ? "s" : ""} registrado${totalAppointments !== 1 ? "s" : ""}.`
                : "Este paciente no tiene turnos registrados."}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => onEdit(activePatient)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar paciente
                </Button>
              )}
              {onToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => onToggleStatus(activePatient)}
                >
                  <UserX className="h-4 w-4" />
                  {activePatient.status === "activo"
                    ? "Desactivar paciente"
                    : "Activar paciente"}
                </Button>
              )}
              {onDeleteRequest && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                  onClick={() => onDeleteRequest(activePatient)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar paciente
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
