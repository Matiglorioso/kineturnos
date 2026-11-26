"use client";

import { PatientStatusBadge, StatusBadge } from "@/components/appointments/StatusBadge";
import { MobileRow, PatientCoverageSection } from "@/components/patients/PatientCoverageSection";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { formatAge } from "@/lib/birth-date";
import { formatAppDate } from "@/lib/date-utils";
import { formatCuil } from "@/lib/document-validation";
import { cn, getInitials } from "@/lib/utils";
import type { Appointment, Patient } from "@/types";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Tab = "datos" | "obra" | "turnos";
const TABS: { id: Tab; label: string }[] = [
  { id: "datos", label: "Datos" },
  { id: "obra", label: "Obra social" },
  { id: "turnos", label: "Turnos" },
];

interface PatientDetailMobileProps {
  patient: Patient;
  upcoming: Appointment[];
  past: Appointment[];
  onToggleStatus?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onCoverageChange?: () => void;
}

/**
 * Ficha del paciente en el celular (boceto, pantallas 5 a 7): pantalla completa con
 * "‹ Pacientes", pestañas Datos · Obra social · Turnos y la acción principal abajo.
 */
export function PatientDetailMobile({
  patient,
  upcoming,
  past,
  onToggleStatus,
  onEdit,
  onCoverageChange,
}: PatientDetailMobileProps) {
  const { can, canSchedule } = usePermissions();
  const [tab, setTab] = useState<Tab>("datos");
  // Cada ficha abre en "Datos".
  useEffect(() => setTab("datos"), [patient.id]);

  const canBook = canSchedule && patient.status === "activo";
  const bookHref = `/agenda?nuevo=1&paciente=${encodeURIComponent(patient.id)}`;
  const hasMenu = Boolean(onEdit || onToggleStatus);

  return (
    <>
      {/* Volver y "⋯" (editar, desactivar, eliminar). */}
      <div className="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <DialogClose className="-ml-1 flex h-10 items-center gap-0.5 rounded-lg px-1 text-[15px] font-semibold text-brand-800">
          <ChevronLeft className="h-5 w-5" />
          Pacientes
        </DialogClose>
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Más acciones"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(patient)}>
                  <Pencil className="h-4 w-4" />
                  Editar paciente
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onSelect={() => onToggleStatus(patient)}>
                  <UserX className="h-4 w-4" />
                  {patient.status === "activo" ? "Dar de baja" : "Reactivar"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Quién es. */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
          {getInitials(patient.name)}
        </div>
        <div className="min-w-0">
          <DialogTitle className="truncate text-left text-[19px] font-bold leading-tight">{patient.name}</DialogTitle>
          <div className="mt-0.5 flex items-center gap-2">
            <PatientStatusBadge active={patient.status === "activo"} className="py-0.5 text-[11px]" />
            {patient.birthDate && <span className="text-xs text-muted-foreground">{formatAge(patient.birthDate)}</span>}
          </div>
          <DialogDescription className="sr-only">Ficha del paciente</DialogDescription>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de la ficha"
        className="mx-3 mb-2.5 flex gap-1 rounded-xl bg-[#ecebe6] p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "h-9 flex-1 rounded-[9px] text-[13px] font-semibold transition-colors",
              tab === item.id ? "bg-white text-brand-800 shadow-sm" : "text-muted-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "obra" ? (
        <PatientCoverageSection
          key={patient.id}
          patient={patient}
          canManage={can("insurances:write")}
          onChanged={onCoverageChange}
          variant="mobile"
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {tab === "datos" ? (
              <>
                {/* Los datos opcionales que no están cargados no se muestran. */}
                <dl className="rounded-2xl border border-slate-200/80 bg-white">
                  <MobileRow label="DNI">{patient.dni}</MobileRow>
                  <MobileRow label="Teléfono">
                    <a href={`tel:${patient.phone.replace(/[^\d+]/g, "")}`} className="text-brand-800">
                      {patient.phone}
                    </a>
                  </MobileRow>
                  {patient.birthDate && <MobileRow label="Nacimiento">{formatAppDate(patient.birthDate)}</MobileRow>}
                  {patient.email && <MobileRow label="Email">{patient.email}</MobileRow>}
                  {patient.cuil && <MobileRow label="CUIL">{formatCuil(patient.cuil)}</MobileRow>}
                  {patient.notes?.trim() && <MobileRow label="Observaciones">{patient.notes.trim()}</MobileRow>}
                </dl>
                {can("clinical:read") && (
                  <Link
                    href={`/pacientes/${encodeURIComponent(patient.id)}/historia`}
                    className="flex items-center justify-between px-1 pt-3.5 text-sm font-semibold text-brand-800"
                  >
                    Historia clínica
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </>
            ) : (
              <>
                <MobileAppointments title="Próximos" appointments={upcoming} emptyText="No tiene turnos próximos." first />
                <MobileAppointments title="Historial" appointments={past} emptyText="Todavía no tiene turnos pasados." />
              </>
            )}
          </div>

          {canBook && (
            <div className="border-t border-slate-200/80 bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button asChild className="h-12 w-full text-[15px]">
                <Link href={bookHref}>Agendar turno</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Turnos del paciente en dos renglones: cuándo arriba, con quién abajo y el estado a la derecha. */
function MobileAppointments({
  title,
  appointments,
  emptyText,
  first = false,
}: {
  title: string;
  appointments: Appointment[];
  emptyText: string;
  first?: boolean;
}) {
  return (
    <section aria-label={title}>
      <p
        className={cn(
          "mx-1 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-800",
          first ? "mt-0.5" : "mt-3"
        )}
      >
        {title}
      </p>
      {appointments.length === 0 ? (
        <p className="mx-1 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex min-h-[52px] items-center gap-2.5 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-slate-900">
                  {formatAppDate(appointment.date, "EEE dd-MM").replace(".", "")} · {appointment.time}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {appointment.professionalName} · {appointment.sessionType}
                </p>
              </div>
              <StatusBadge status={appointment.status} showIcon={false} className="shrink-0 py-0.5 text-[11px]" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
