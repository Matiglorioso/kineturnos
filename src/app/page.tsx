"use client";

import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusSummary } from "@/components/dashboard/StatusSummary";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { DataLoadBanner } from "@/components/shared/DataLoadBanner";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { getRecentActivityItems } from "@/lib/dashboard-activity";
import {
  getActivePatientsCount,
  getTodayAppDate,
  getTodayDashboardMetrics,
  getUpcomingAppointments,
} from "@/lib/dashboard-stats";
import { formatTodayLongLabel } from "@/lib/date-utils";
import {
  Ban,
  CalendarCheck,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const {
    patients,
    isLoading: patientsLoading,
    error: patientsError,
    refresh: refreshPatients,
  } = usePatients();
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
  } = useAppointments();
  const [today] = useState(() => getTodayAppDate());

  const isLoading = patientsLoading || appointmentsLoading;
  const loadError = patientsError ?? appointmentsError;

  const handleRetry = () => {
    void refreshPatients();
    void refreshAppointments();
  };

  const todayMetrics = useMemo(
    () => getTodayDashboardMetrics(appointments, today),
    [appointments, today]
  );

  const activePatients = useMemo(
    () => getActivePatientsCount(patients),
    [patients]
  );

  const upcoming = useMemo(
    () => getUpcomingAppointments(appointments, 5),
    [appointments]
  );

  const activityItems = useMemo(
    () => getRecentActivityItems(patients, appointments, 6),
    [patients, appointments]
  );

  const dateLabel = formatTodayLongLabel();

  const confirmedPercent =
    todayMetrics.todayTotal > 0
      ? Math.round(
          (todayMetrics.todayConfirmed / todayMetrics.todayTotal) * 100
        )
      : 0;

  if (isLoading) {
    return <PageLoadingState title="Resumen del día" description="Cargando panel..." />;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="animate-slide-up">
          <p className="text-sm font-medium text-brand-600">Panel del consultorio</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Resumen del día
          </h1>
        </div>
        <DataLoadBanner message={loadError} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <p className="text-sm font-medium text-brand-600">Panel del consultorio</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Resumen del día
        </h1>
        <p className="mt-1.5 capitalize text-slate-500">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Turnos de hoy"
          value={todayMetrics.todayTotal}
          icon={CalendarCheck}
          accent="brand"
        />
        <StatCard
          title="Confirmados hoy"
          value={todayMetrics.todayConfirmed}
          icon={UserCheck}
          change={
            todayMetrics.todayTotal > 0
              ? `${confirmedPercent}% del día`
              : undefined
          }
          trend={confirmedPercent >= 50 ? "up" : "neutral"}
          accent="emerald"
        />
        <StatCard
          title="Pendientes hoy"
          value={todayMetrics.todayPending}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Cancelados hoy"
          value={todayMetrics.todayCancelled}
          icon={Ban}
          accent="red"
        />
        <StatCard
          title="Pacientes activos"
          value={activePatients}
          icon={Users}
          accent="violet"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                Próximos turnos
              </CardTitle>
              <Link
                href="/agenda"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Ver agenda
              </Link>
            </CardHeader>
            <CardContent>
              <UpcomingAppointments appointments={upcoming} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <RecentActivity items={activityItems} />
        </div>
      </div>

      <StatusSummary appointments={appointments} />
    </div>
  );
}
