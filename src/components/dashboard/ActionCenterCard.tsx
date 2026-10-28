"use client";

import { DashboardCard, DashboardEmpty } from "@/components/dashboard/DashboardCard";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date-utils";
import { phoneHref } from "@/lib/dashboard-today";
import { normalizeTime } from "@/lib/time-utils";
import type { Appointment, AppointmentStatus, Patient } from "@/types";
import { CheckCircle2, ListChecks, Phone, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MAX_ITEMS = 5;

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
  count,
  more,
  children,
}: {
  title: string;
  count: number;
  more?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title} <span className="text-slate-900">{count}</span>
        </h3>
        {more && count > MAX_ITEMS && (
          <Link href={more.href} className="-my-1 inline-flex min-h-6 items-center rounded-md px-1 text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {more.label}
          </Link>
        )}
      </div>
      <ul className="space-y-2">{children}</ul>
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
  const run = async (appointment: Appointment, status: AppointmentStatus) => {
    setBusyId(appointment.id);
    try {
      await onStatusChange(appointment, status);
    } finally {
      setBusyId(null);
    }
  };

  const showUnconfirmed = canConfirm;
  const total =
    pendingAttendance.length + (showUnconfirmed ? unconfirmed.length : 0) + (showCoverage ? coverageIssues.length : 0);

  return (
    <DashboardCard title="Para hacer" icon={ListChecks} meta={total ? String(total) : undefined} fixedHeight>
      {total === 0 ? (
        <DashboardEmpty icon={CheckCircle2} text="Todo al día: no hay nada pendiente." />
      ) : (
        <div className="space-y-5">
          {pendingAttendance.length > 0 && (
            <Group
              title="Registrar asistencia"
              count={pendingAttendance.length}
              more={{ label: "Ver en la agenda", href: "/agenda" }}
            >
              {pendingAttendance.slice(0, MAX_ITEMS).map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {appointment.patientName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatAppDate(appointment.date, "EEE d/MM")} · {normalizeTime(appointment.time)} ·{" "}
                      {appointment.professionalName}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === appointment.id}
                      onClick={() => void run(appointment, "atendido")}
                      aria-label={`Marcar atendido: ${appointment.patientName}`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Atendido
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === appointment.id}
                      onClick={() => void run(appointment, "ausente")}
                      aria-label={`Marcar ausente: ${appointment.patientName}`}
                    >
                      <UserX className="h-4 w-4 text-slate-500" />
                      Ausente
                    </Button>
                  </span>
                </li>
              ))}
            </Group>
          )}

          {showUnconfirmed && unconfirmed.length > 0 && (
            <Group
              title={`Confirmar turnos del ${formatAppDate(unconfirmedDate, "EEEE d/MM")}`}
              count={unconfirmed.length}
              more={{ label: "Ver en la agenda", href: `/agenda?fecha=${unconfirmedDate}` }}
            >
              {unconfirmed.slice(0, MAX_ITEMS).map((appointment) => {
                const phone = patientsById.get(appointment.patientId)?.phone;
                return (
                  <li
                    key={appointment.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {appointment.patientName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {normalizeTime(appointment.time)} · {appointment.professionalName}
                        {phone ? ` · ${phone}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {phone && (
                        <Button asChild size="sm" variant="outline">
                          <a href={phoneHref(phone)} aria-label={`Llamar a ${appointment.patientName}`}>
                            <Phone className="h-4 w-4" />
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
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Confirmar
                      </Button>
                    </span>
                  </li>
                );
              })}
            </Group>
          )}

          {showCoverage && coverageIssues.length > 0 && (
            <Group
              title="Autorizaciones"
              count={coverageIssues.length}
              more={{ label: "Ver todas", href: "/obras-sociales" }}
            >
              {coverageIssues.slice(0, MAX_ITEMS).map((patient) => (
                <li
                  key={patient.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                >
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
  );
}
