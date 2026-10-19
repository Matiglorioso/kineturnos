"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeIndicators,
  formatRangeLabel,
  formatRate,
  getPeriodRange,
  getPreviousRange,
  getTimeline,
  indicatorsByProfessional,
  percentChange,
  PERIOD_PRESETS,
  sessionsByInsurance,
  type PeriodPreset,
} from "@/lib/dashboard-indicators";
import { getTodayAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Appointment, Patient } from "@/types";
import {
  BarChart3,
  Ban,
  CalendarCheck,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const SEGMENTS = [
  { key: "attended", label: "Atendidos", className: "bg-brand-500" },
  { key: "absent", label: "Ausentes", className: "bg-slate-400" },
  { key: "cancelled", label: "Cancelados", className: "bg-red-400" },
] as const;

function Legend({ extra }: { extra?: { label: string; className: string } }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {[...SEGMENTS, ...(extra ? [extra] : [])].map((segment) => (
        <span key={segment.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", segment.className)} />
          {segment.label}
        </span>
      ))}
    </div>
  );
}

function changeLabel(current: number, previous: number): { text?: string; trend: "up" | "down" | "neutral" } {
  const change = percentChange(current, previous);
  if (change === null) return { trend: "neutral" };
  if (change === 0) return { text: "= anterior", trend: "neutral" };
  return { text: `${change > 0 ? "+" : ""}${change}%`, trend: change > 0 ? "up" : "down" };
}

/** Diferencia de una tasa en puntos porcentuales; subir es malo (cancelación, ausentismo). */
function rateChange(current: number | null, previous: number | null) {
  if (current === null || previous === null) return { trend: "neutral" as const };
  const points = Math.round((current - previous) * 100);
  if (points === 0) return { text: "= anterior", trend: "neutral" as const };
  return {
    text: `${points > 0 ? "+" : ""}${points} pp`,
    trend: points > 0 ? ("up" as const) : ("down" as const),
    changeTone: points > 0 ? ("bad" as const) : ("good" as const),
  };
}

interface PeriodIndicatorsProps {
  appointments: Appointment[];
  patients: Patient[];
  /** El rol Profesional ve solo su agenda: no hace falta el desglose por profesional. */
  showProfessionals: boolean;
  /** Autorizaciones para gestionar (Administración). */
  showAuthorizations: boolean;
}

/** Indicadores de gestión por período (RF16). */
export function PeriodIndicators({
  appointments,
  patients,
  showProfessionals,
  showAuthorizations,
}: PeriodIndicatorsProps) {
  const [preset, setPreset] = useState<PeriodPreset>("mes");
  const [today] = useState(() => getTodayAppDate());

  const range = useMemo(() => getPeriodRange(preset, today), [preset, today]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const current = useMemo(() => computeIndicators(appointments, range), [appointments, range]);
  const previous = useMemo(() => computeIndicators(appointments, previousRange), [appointments, previousRange]);
  const timeline = useMemo(() => getTimeline(appointments, range), [appointments, range]);
  const byProfessional = useMemo(() => indicatorsByProfessional(appointments, range), [appointments, range]);
  const insuranceByPatient = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient.insurance])),
    [patients]
  );
  const byInsurance = useMemo(
    () => sessionsByInsurance(appointments, range, insuranceByPatient),
    [appointments, range, insuranceByPatient]
  );
  const coverageIssues = useMemo(() => {
    const counts = { vencidas: 0, porRenovar: 0, enTramite: 0, sinAutorizacion: 0 };
    for (const patient of patients) {
      if (patient.status !== "activo" || !patient.coverage) continue;
      const { kind, tone } = patient.coverage;
      if (kind === "agotada" || kind === "vencida") counts.vencidas += 1;
      else if (kind === "vigente" && tone === "warning") counts.porRenovar += 1;
      else if (kind === "pendiente") counts.enTramite += 1;
      else if (kind === "sin-autorizacion") counts.sinAutorizacion += 1;
    }
    return counts;
  }, [patients]);

  const timelineMax = Math.max(1, ...timeline.map((b) => b.attended + b.absent + b.cancelled));
  const professionalMax = Math.max(1, ...byProfessional.map((row) => row.total));
  const insuranceMax = Math.max(1, ...byInsurance.map((row) => row.sessions));
  const totalChange = changeLabel(current.total, previous.total);
  const attendedChange = changeLabel(current.attended, previous.attended);
  const patientsChange = changeLabel(current.patientsAttended, previous.patientsAttended);
  const cancellationChange = rateChange(current.cancellationRate, previous.cancellationRate);
  const absenceChange = rateChange(current.absenceRate, previous.absenceRate);

  return (
    <section aria-labelledby="indicadores-titulo" className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="indicadores-titulo" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            Indicadores
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRangeLabel(range)} · comparado con el período anterior
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Período de los indicadores"
          className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] lg:mx-0"
        >
          {PERIOD_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={preset === option.value}
              onClick={() => setPreset(option.value)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                preset === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Turnos del período"
          value={current.total}
          icon={CalendarCheck}
          accent="brand"
          change={totalChange.text}
          trend={totalChange.trend}
        />
        <StatCard
          title="Sesiones atendidas"
          value={current.attended}
          icon={UserCheck}
          accent="emerald"
          change={attendedChange.text}
          trend={attendedChange.trend}
        />
        <StatCard
          title="Pacientes atendidos"
          value={current.patientsAttended}
          icon={Users}
          accent="violet"
          change={patientsChange.text}
          trend={patientsChange.trend}
        />
        <StatCard
          title="Cancelación"
          value={formatRate(current.cancellationRate)}
          icon={Ban}
          accent="red"
          change={cancellationChange.text}
          trend={cancellationChange.trend}
          changeTone={cancellationChange.changeTone}
        />
        <StatCard
          title="Ausentismo"
          value={formatRate(current.absenceRate)}
          icon={UserX}
          accent="amber"
          change={absenceChange.text}
          trend={absenceChange.trend}
          changeTone={absenceChange.changeTone}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Evolución</CardTitle>
            <Legend />
          </CardHeader>
          <CardContent>
            {timeline.every((bucket) => bucket.attended + bucket.absent + bucket.cancelled === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin sesiones registradas en el período.
              </p>
            ) : (
              <div className="flex h-48 items-end gap-1.5 sm:gap-2" role="list" aria-label="Sesiones por tramo">
                {timeline.map((bucket) => {
                  const total = bucket.attended + bucket.absent + bucket.cancelled;
                  return (
                    <div
                      key={bucket.title}
                      role="listitem"
                      aria-label={`${bucket.title}: ${bucket.attended} atendidos, ${bucket.absent} ausentes, ${bucket.cancelled} cancelados`}
                      title={`${bucket.title}: ${bucket.attended} atendidos, ${bucket.absent} ausentes, ${bucket.cancelled} cancelados`}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <span className="text-[11px] font-medium text-slate-600">{total > 0 ? total : ""}</span>
                      <div
                        className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md"
                        style={{ height: `${(total / timelineMax) * 100}%` }}
                      >
                        {SEGMENTS.map((segment) => (
                          <div
                            key={segment.key}
                            className={segment.className}
                            style={{ height: total > 0 ? `${(bucket[segment.key] / total) * 100}%` : 0 }}
                          />
                        ))}
                      </div>
                      <span className="w-full truncate text-center text-[11px] capitalize text-muted-foreground">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {showProfessionals && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-brand-600" />
                Turnos por profesional
              </CardTitle>
              <Legend extra={{ label: "Pendientes", className: "bg-amber-300" }} />
            </CardHeader>
            <CardContent>
              {byProfessional.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin turnos en el período.</p>
              ) : (
                <ul className="space-y-4">
                  {byProfessional.map((row) => {
                    const realized = row.attended + row.absent;
                    return (
                      <li key={row.professionalId} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-slate-900">{row.professionalName}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {row.total} {row.total === 1 ? "turno" : "turnos"}
                          </span>
                        </div>
                        <div
                          className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
                          style={{ width: `${Math.max(8, (row.total / professionalMax) * 100)}%` }}
                          aria-hidden="true"
                        >
                          <div className="bg-brand-500" style={{ flexGrow: row.attended }} />
                          <div className="bg-slate-400" style={{ flexGrow: row.absent }} />
                          <div className="bg-red-400" style={{ flexGrow: row.cancelled }} />
                          <div className="bg-amber-300" style={{ flexGrow: row.active }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.attended} atendidos · {row.absent} ausentes · {row.cancelled} cancelados ·{" "}
                          {row.active} pendientes · Ausentismo {formatRate(realized ? row.absent / realized : null)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Sesiones atendidas por obra social
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byInsurance.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin sesiones atendidas en el período.</p>
            ) : (
              <ul className="space-y-3">
                {byInsurance.map((row) => (
                  <li key={row.name} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate text-slate-800">{row.name}</span>
                      <span className="shrink-0 font-semibold text-slate-900">{row.sessions}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(row.sessions / insuranceMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {showAuthorizations && (
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Autorizaciones para gestionar
              </CardTitle>
              <Link href="/obras-sociales" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Ir a Obras sociales
              </Link>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Pacientes activos con obra social, hoy.</p>
              <ul className="grid grid-cols-2 gap-3">
                {[
                  { label: "Vencidas o agotadas", value: coverageIssues.vencidas, className: "bg-red-50 text-red-700" },
                  { label: "Por renovar", value: coverageIssues.porRenovar, className: "bg-amber-50 text-amber-800" },
                  { label: "En trámite", value: coverageIssues.enTramite, className: "bg-sky-50 text-sky-800" },
                  {
                    label: "Sin autorización",
                    value: coverageIssues.sinAutorizacion,
                    className: "bg-slate-100 text-slate-700",
                  },
                ].map((item) => (
                  <li key={item.label} className={cn("rounded-xl px-3 py-2.5", item.className)}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs font-medium">{item.label}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
