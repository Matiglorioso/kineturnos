"use client";

import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { DashboardShortcuts } from "@/components/dashboard/DashboardShortcuts";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { PeriodIndicators } from "@/components/dashboard/PeriodIndicators";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { DataLoadBanner } from "@/components/shared/DataLoadBanner";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import { computeIndicators, getPeriodRange } from "@/lib/dashboard-indicators";
import {
  getDaySchedule,
  getNextWorkday,
  getPendingAttendance,
  getUnconfirmed,
  greetingFor,
  summarizeDay,
} from "@/lib/dashboard-today";
import { formatAppDate, getNowAppMinutes, getTodayAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import type { Appointment, AppointmentStatus, Patient } from "@/types";
import {
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  Plus,
  ShieldAlert,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/** Minutos del día en el consultorio, actualizados cada minuto (turno en curso, asistencia por registrar). */
function useNowMinutes() {
  const [now, setNow] = useState(() => getNowAppMinutes());
  useEffect(() => {
    const id = window.setInterval(() => setNow(getNowAppMinutes()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function coverageIssuesOf(patients: Patient[]): Patient[] {
  const rank = { alert: 0, warning: 1 } as const;
  return patients
    .filter(
      (patient) =>
        patient.status === "activo" &&
        (patient.coverage?.tone === "alert" || patient.coverage?.tone === "warning")
    )
    .sort(
      (a, b) =>
        rank[a.coverage!.tone as "alert" | "warning"] - rank[b.coverage!.tone as "alert" | "warning"] ||
        a.name.localeCompare(b.name, "es")
    );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { patients, isLoading: patientsLoading, error: patientsError, refresh: refreshPatients } = usePatients();
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
    updateAppointmentStatus,
  } = useAppointments();
  const { role, can, canSchedule, canManagePatients, isScopedProfessional } = usePermissions();
  const [today] = useState(() => getTodayAppDate());
  const nowMinutes = useNowMinutes();

  const schedule = useMemo(() => getDaySchedule(appointments, today), [appointments, today]);
  const daySummary = useMemo(() => summarizeDay(schedule, nowMinutes), [schedule, nowMinutes]);
  const pendingAttendance = useMemo(
    () => getPendingAttendance(appointments, today, nowMinutes),
    [appointments, today, nowMinutes]
  );
  const nextWorkday = useMemo(() => getNextWorkday(today), [today]);
  const unconfirmed = useMemo(() => getUnconfirmed(appointments, nextWorkday), [appointments, nextWorkday]);
  const coverageIssues = useMemo(() => coverageIssuesOf(patients), [patients]);
  const patientsById = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);
  const monthAttended = useMemo(
    () => computeIndicators(appointments, getPeriodRange("mes", today)).attended,
    [appointments, today]
  );

  const showCoverage = can("insurances:write");
  const firstName = session?.user?.name?.split(" ")[0];
  const handleStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
    await updateAppointmentStatus(appointment, status);
  };

  if (patientsLoading || appointmentsLoading) {
    return <PageLoadingState title="Panel" description="Cargando el día..." />;
  }

  const loadError = patientsError ?? appointmentsError;
  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Panel</h1>
        <DataLoadBanner
          message={loadError}
          onRetry={() => {
            void refreshPatients();
            void refreshAppointments();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700">{siteConfig.clinicName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greetingFor(nowMinutes)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-slate-500 first-letter:uppercase">
            {formatAppDate(today, "EEEE d 'de' MMMM 'de' yyyy")}
          </p>
        </div>
        {(canSchedule || canManagePatients) && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {canManagePatients && (
              <Button asChild variant="outline">
                <Link href="/pacientes?nuevo=1">
                  <UserPlus className="h-4 w-4" />
                  Nuevo paciente
                </Link>
              </Button>
            )}
            {canSchedule && (
              <Button asChild>
                <Link href="/agenda?nuevo=1">
                  <Plus className="h-4 w-4" />
                  Agendar turno
                </Link>
              </Button>
            )}
          </div>
        )}
      </header>

      <DashboardShortcuts role={role} />

      <section aria-labelledby="hoy-titulo" className="space-y-4">
        <h2 id="hoy-titulo" className="sr-only">
          Hoy
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricTile
            label="Turnos de hoy"
            value={daySummary.total}
            icon={CalendarCheck}
            tone="brand"
            hint={`${daySummary.attended} atendidos · ${daySummary.upcoming} por venir`}
            href="/agenda"
          />
          <MetricTile
            label="Por registrar"
            value={pendingAttendance.length}
            icon={ClipboardCheck}
            tone={pendingAttendance.length ? "amber" : "slate"}
            hint="asistencia de turnos ya terminados"
          />
          <MetricTile
            label="Por confirmar"
            value={unconfirmed.length}
            icon={CalendarClock}
            tone={unconfirmed.length ? "sky" : "slate"}
            hint={`para el ${formatAppDate(nextWorkday, "EEEE d/MM")}`}
          />
          {showCoverage ? (
            <MetricTile
              label="Autorizaciones"
              value={coverageIssues.length}
              icon={ShieldAlert}
              tone={coverageIssues.length ? "red" : "slate"}
              hint="vencidas, agotadas o por renovar"
              href="/obras-sociales"
            />
          ) : (
            <MetricTile
              label="Atendidos este mes"
              value={monthAttended}
              icon={UserCheck}
              tone="emerald"
              hint="sesiones"
            />
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TodayScheduleCard schedule={schedule} nowMinutes={nowMinutes} showProfessional={!isScopedProfessional} />
          <ActionCenterCard
            pendingAttendance={pendingAttendance}
            unconfirmed={unconfirmed}
            unconfirmedDate={nextWorkday}
            coverageIssues={coverageIssues}
            patientsById={patientsById}
            canConfirm={can("appointments:status")}
            showCoverage={showCoverage}
            onStatusChange={handleStatusChange}
          />
        </div>
      </section>

      <PeriodIndicators appointments={appointments} patients={patients} showProfessionals={!isScopedProfessional} />
    </div>
  );
}
