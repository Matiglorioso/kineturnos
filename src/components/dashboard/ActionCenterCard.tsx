"use client";

import { DashboardCard, DashboardEmpty } from "@/components/dashboard/DashboardCard";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { APP_DATE_FORMAT, formatAppDate, getTodayAppDate, parseAppDate } from "@/lib/date-utils";
import { addDays, format } from "date-fns";
import { phoneHref } from "@/lib/dashboard-today";
import { statusChangeConfirmation } from "@/lib/status-confirm";
import { normalizeTime } from "@/lib/time-utils";
import type { Appointment, AppointmentStatus, Patient } from "@/types";
import { Check, CheckCircle2, ListChecks, Phone, UserX, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MAX_ITEMS = 5;

function getTomorrowAppDate(): string {
  const today = parseAppDate(getTodayAppDate());
  return today ? format(addDays(today, 1), APP_DATE_FORMAT) : "";
}

interface ActionCenterCardProps {
  pendingAttendance: Appointment[];
  unconfirmed: Appointment[];
  /** Día de los turnos sin confirmar (dd-MM-yyyy). */
  unconfirmedDate: string;
  coverageIssues: Patient[];
  patientsById: Map<string, Patient>;
  canConfirm: boolean;
  showCoverage: boolean;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => Promise<void>;
}

function Group({
  title,
  mobileTitle,
  count,
  more,
  children,
}: {
  title: string;
  /** Título en el celular (como el boceto), donde no está el de la tarjeta. */
  mobileTitle?: string;
  count: number;
  more?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-brand-800 lg:font-semibold lg:text-muted-foreground">
          <span className="lg:hidden">{mobileTitle ?? title}</span>
          <span className="max-lg:hidden">{title}</span>
        </h3>
        {more && count > MAX_ITEMS && (
          <Link href={more.href} className="-my-1 inline-flex min-h-6 shrink-0 items-center whitespace-nowrap rounded-md px-1 text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {more.label}
          </Link>
        )}
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white lg:border-slate-100">{children}</ul>
    </div>
  );
}

/** Lo que hay que resolver hoy, con la acción a mano: asistencia, confirmaciones y autorizaciones. */
export function ActionCenterCard({
  pendingAttendance,
  unconfirmed,
  unconfirmedDate,
  coverageIssues,
  patientsById,
  canConfirm,
  showCoverage,
  onStatusChange,
}: ActionCenterCardProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  // Atendido y ausente son finales: se confirman antes de aplicarlos, como en la Agenda.
  const [confirming, setConfirming] = useState<{ appointment: Appointment; status: AppointmentStatus } | null>(null);
  const confirmation = confirming ? statusChangeConfirmation(confirming.appointment, confirming.status) : null;
  const run = async (appointment: Appointment, status: AppointmentStatus) => {
    setBusyId(appointment.id);
    try {
      await onStatusChange(appointment, status);
    } finally {
      setBusyId(null);
    }
  };

  const showUnconfirmed = canConfirm;
  const tomorrow = getTomorrowAppDate();
  const total =
    pendingAttendance.length + (showUnconfirmed ? unconfirmed.length : 0) + (showCoverage ? coverageIssues.length : 0);

  return (
    <>
    <DashboardCard title="Para hacer" icon={ListChecks} fixedHeight hideMobileHeader={total > 0}>
      {total === 0 ? (
        <DashboardEmpty icon={CheckCircle2} text="Todo al día: no hay nada pendiente." />
      ) : (
        <div className="space-y-5">
          {pendingAttendance.length > 0 && (
            <Group
              title="Registrar asistencia"
              mobileTitle="Para hacer · registrar asistencia"
              count={pendingAttendance.length}
              more={{ label: "Ver en la agenda", href: "/agenda" }}
            >
              {pendingAttendance.slice(0, MAX_ITEMS).map((appointment) => (
                <li key={appointment.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-11 shrink-0 text-sm font-bold tabular-nums text-brand-800">
                    {normalizeTime(appointment.time)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {appointment.patientName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatAppDate(appointment.date, "EEE dd-MM")} · {appointment.professionalName}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === appointment.id}
                      onClick={() => setConfirming({ appointment, status: "atendido" })}
                      aria-label={`Marcar atendido: ${appointment.patientName}`}
                      className="h-8 w-9 px-0 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Check className="h-4 w-4 lg:hidden" />
                      <CheckCircle2 className="h-4 w-4 text-brand-600 max-lg:hidden" />
                      <span className="max-lg:hidden">Atendido</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === appointment.id}
                      onClick={() => setConfirming({ appointment, status: "ausente" })}
                      aria-label={`Marcar ausente: ${appointment.patientName}`}
                      className="h-8 w-9 px-0 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <X className="h-4 w-4 lg:hidden" />
                      <UserX className="h-4 w-4 text-slate-500 max-lg:hidden" />
                      <span className="max-lg:hidden">Ausente</span>
                    </Button>
                  </span>
                </li>
              ))}
            </Group>
          )}

          {showUnconfirmed && unconfirmed.length > 0 && (
            <Group
              title={`Confirmar turnos del ${formatAppDate(unconfirmedDate, "EEEE d/MM")}`}
              mobileTitle={
                unconfirmedDate === tomorrow
                  ? "Confirmar los de mañana"
                  : `Confirmar los del ${formatAppDate(unconfirmedDate, "EEEE")}`
              }
              count={unconfirmed.length}
              more={{ label: "Ver en la agenda", href: `/agenda?fecha=${unconfirmedDate}` }}
            >
              {unconfirmed.slice(0, MAX_ITEMS).map((appointment) => {
                const phone = patientsById.get(appointment.patientId)?.phone;
                return (
                  <li key={appointment.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-11 shrink-0 text-sm font-bold tabular-nums text-brand-800">
                      {normalizeTime(appointment.time)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {appointment.patientName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {appointment.professionalName}
                        {phone ? <span className="hidden sm:inline"> · {phone}</span> : null}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {phone && (
                        <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs lg:h-9 lg:px-3 lg:text-sm">
                          <a href={phoneHref(phone)} aria-label={`Llamar a ${appointment.patientName}`}>
                            <Phone className="h-4 w-4 max-lg:hidden" />
                            Llamar
                          </a>
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === appointment.id}
                        onClick={() => void run(appointment, "confirmado")}
                        aria-label={`Confirmar turno: ${appointment.patientName}`}
                        className="h-8 px-2.5 text-xs max-lg:border-primary max-lg:bg-primary max-lg:text-primary-foreground lg:h-9 lg:px-3 lg:text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-brand-600 max-lg:hidden" />
                        <span className="lg:hidden">OK</span>
                        <span className="max-lg:hidden">Confirmar</span>
                      </Button>
                    </span>
                  </li>
                );
              })}
            </Group>
          )}

          {showCoverage && coverageIssues.length > 0 && (
            <Group
              title="Coberturas por revisar"
              count={coverageIssues.length}
              more={{ label: "Ver todas", href: "/obras-sociales" }}
            >
              {coverageIssues.slice(0, MAX_ITEMS).map((patient) => (
                <li key={patient.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <Link
                    href={`/pacientes?q=${encodeURIComponent(patient.dni)}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-brand-800"
                  >
                    {patient.name}
                    <span className="block truncate text-xs font-normal text-muted-foreground">{patient.insurance}</span>
                  </Link>
                  <CoverageBadge coverage={patient.coverage} size="xs" short />
                </li>
              ))}
            </Group>
          )}
        </div>
      )}
    </DashboardCard>
    <ConfirmAlertDialog
      open={Boolean(confirmation)}
      onOpenChange={(open) => !open && setConfirming(null)}
      title={confirmation?.title ?? ""}
      description={confirmation?.description ?? ""}
      confirmLabel={confirmation?.confirmLabel ?? ""}
      cancelLabel="Volver"
      destructive={confirmation?.destructive}
      onConfirm={() => {
        if (confirming) void run(confirming.appointment, confirming.status);
      }}
    />
    </>
  );
}
