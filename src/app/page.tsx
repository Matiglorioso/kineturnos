"use client";

import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { PeriodIndicators } from "@/components/dashboard/PeriodIndicators";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { DataLoadBanner } from "@/components/shared/DataLoadBanner";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import {
  getDaySchedule,
  getNextWorkday,
  getPendingAttendance,
  getUnconfirmed,
  greetingFor,
  summarizeDay,
} from "@/lib/dashboard-today";
import { formatAppDate, getNowAppMinutes, getTodayAppDate } from "@/lib/date-utils";
import type { Appointment, AppointmentStatus, Patient } from "@/types";
import { Plus, UserPlus } from "lucide-react";
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
  const { can, canSchedule, canManagePatients, isScopedProfessional } = usePermissions();
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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

      <section aria-labelledby="hoy-titulo">
        <h2 id="hoy-titulo" className="sr-only">
          Hoy
        </h2>
        {/* Primero lo que hay que hacer; min-w-0 evita que una fila larga ensanche la grilla en celular. */}
        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
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
          <TodayScheduleCard
            schedule={schedule}
            summary={daySummary}
            nowMinutes={nowMinutes}
            showProfessional={!isScopedProfessional}
          />
        </div>
      </section>

      <PeriodIndicators appointments={appointments} patients={patients} showProfessionals={!isScopedProfessional} />
    </div>
  );
}
