"use client";

import { AppointmentListSection } from "@/components/shared/AppointmentListSection";
import { InfoRow } from "@/components/shared/InfoRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { emptyStates } from "@/lib/empty-states";
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
  countProfessionalAppointments,
  getProfessionalScheduleLabel,
  getProfessionalUpcomingAppointments,
} from "@/lib/professional-utils";
import { cn, getInitials } from "@/lib/utils";
import { Appointment, Professional } from "@/types";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Stethoscope,
  Timer,
  Trash2,
  User,
} from "lucide-react";
import { useMemo } from "react";

interface ProfessionalDetailDialogProps {
  professional: Professional | null;
  appointments: Appointment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteRequest?: (professional: Professional) => void;
}

export function ProfessionalDetailDialog({
  professional,
  appointments,
  open,
  onOpenChange,
  onDeleteRequest,
}: ProfessionalDetailDialogProps) {
  const { activeEntity: activeProfessional } = useDisplayEntity(professional, open);

  const stats = useMemo(() => {
    if (!activeProfessional) {
      return { total: 0, upcoming: [] as Appointment[] };
    }

    return {
      total: countProfessionalAppointments(appointments, activeProfessional.id),
      upcoming: getProfessionalUpcomingAppointments(
        appointments,
        activeProfessional.id,
        5
      ),
    };
  }, [activeProfessional, appointments]);

  if (!activeProfessional) return null;

  const scheduleLabel = getProfessionalScheduleLabel(activeProfessional);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm",
                activeProfessional.avatarColor
              )}
            >
              {getInitials(activeProfessional.name)}
            </div>
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

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {activeProfessional.license && (
              <InfoRow
                icon={User}
                label="Matricula"
                value={activeProfessional.license}
              />
            )}
            {activeProfessional.phone && (
              <InfoRow
                icon={Phone}
                label="Teléfono"
                value={activeProfessional.phone}
              />
            )}
            {activeProfessional.email && (
              <InfoRow
                icon={Mail}
                label="Email"
                value={activeProfessional.email}
              />
            )}
            <InfoRow
              icon={Timer}
              label="Duracion estandar"
              value={`${activeProfessional.defaultDuration} minutos`}
            />
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Dias y horarios de atencion
            </h3>
            <div className="rounded-xl border border-slate-200/80 bg-muted/20 p-4">
              <div className="flex flex-wrap gap-1.5">
                {activeProfessional.days.map((day) => (
                  <span
                    key={day}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {scheduleLabel}
              </p>
            </div>
          </section>

          {activeProfessional.notes && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Observaciones</h3>
              <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-slate-700">
                {activeProfessional.notes}
              </p>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                Turnos asignados
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-800">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Próximos turnos
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.upcoming.length}
              </p>
            </div>
          </div>

          <AppointmentListSection
            title="Próximos turnos"
            icon={Calendar}
            appointments={stats.upcoming}
            emptyPreset={emptyStates.professionalDetail.noUpcoming}
          />
        </div>

        {onDeleteRequest && (
          <DialogFooter className="flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
            <p className="w-full text-xs text-muted-foreground sm:max-w-[50%]">
              {stats.total > 0
                ? `Este profesional tiene ${stats.total} turno${stats.total !== 1 ? "s" : ""} asignado${stats.total !== 1 ? "s" : ""}.`
                : "Este profesional no tiene turnos asignados."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
              onClick={() => onDeleteRequest(activeProfessional)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar profesional
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
