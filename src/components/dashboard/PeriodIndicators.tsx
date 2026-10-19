"use client";

import { DashboardCard, DashboardEmpty } from "@/components/dashboard/DashboardCard";
import { MetricTile } from "@/components/dashboard/MetricTile";
import {
  computeIndicators,
  formatRangeLabel,
  formatRate,
  getPeriodRange,
  getPreviousRange,
  getTimeline,
  indicatorsByProfessional,
  percentChange,
  sessionsByInsurance,
  type PeriodPreset,
} from "@/lib/dashboard-indicators";
import { getTodayAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Appointment, Patient } from "@/types";
import { Ban, BarChart3, ShieldCheck, Stethoscope, UserCheck, Users, UserX } from "lucide-react";
import { useMemo, useState } from "react";

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "mes-anterior", label: "Mes anterior" },
];

const SEGMENTS = [
  { key: "attended", label: "Atendidos", className: "bg-brand-500" },
  { key: "absent", label: "Ausentes", className: "bg-slate-400" },
  { key: "cancelled", label: "Cancelados", className: "bg-red-400" },
] as const;

function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", item.className)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Variación de un conteo: más es mejor. */
function countChange(current: number, previous: number) {
  const change = percentChange(current, previous);
  if (change === null) return undefined;
  return { text: `${change > 0 ? "+" : ""}${change}%`, good: change === 0 ? null : change > 0 };
}

/** Variación de una tasa en puntos porcentuales: subir es malo. */
function rateChange(current: number | null, previous: number | null) {
  if (current === null || previous === null) return undefined;
  const points = Math.round((current - previous) * 100);
  return { text: `${points > 0 ? "+" : ""}${points} pp`, good: points === 0 ? null : points < 0 };
}

interface PeriodIndicatorsProps {
  appointments: Appointment[];
  patients: Patient[];
  /** El rol Profesional ve solo su agenda: en lugar de "por profesional" ve sus sesiones por obra social. */
  showProfessionals: boolean;
}

/** Indicadores de gestión por período (RF16), comparados con el período anterior. */
export function PeriodIndicators({ appointments, patients, showProfessionals }: PeriodIndicatorsProps) {
  const [preset, setPreset] = useState<PeriodPreset>("mes");
  const [today] = useState(() => getTodayAppDate());

  const range = useMemo(() => getPeriodRange(preset, today), [preset, today]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const current = useMemo(() => computeIndicators(appointments, range), [appointments, range]);
  const previous = useMemo(() => computeIndicators(appointments, previousRange), [appointments, previousRange]);
  const timeline = useMemo(() => getTimeline(appointments, range), [appointments, range]);
  const byProfessional = useMemo(() => indicatorsByProfessional(appointments, range), [appointments, range]);
  const byInsurance = useMemo(
    () =>
      sessionsByInsurance(
        appointments,
        range,
        new Map(patients.map((patient) => [patient.id, patient.insurance]))
      ),
    [appointments, range, patients]
  );

  const timelineMax = Math.max(1, ...timeline.map((b) => b.attended + b.absent + b.cancelled));
  const professionalMax = Math.max(1, ...byProfessional.map((row) => row.total));
  const insuranceMax = Math.max(1, ...byInsurance.map((row) => row.sessions));
  const timelineEmpty = timeline.every((b) => b.attended + b.absent + b.cancelled === 0);

  return (
    <section aria-labelledby="indicadores-titulo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="indicadores-titulo" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            Indicadores
          </h2>
          <p className="text-sm text-muted-foreground">{formatRangeLabel(range)} · contra el período anterior</p>
        </div>
        <div role="tablist" aria-label="Período de los indicadores" className="inline-flex rounded-xl bg-muted p-1">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={preset === option.value}
              onClick={() => setPreset(option.value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:flex-none",
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricTile
          label="Sesiones atendidas"
          value={current.attended}
          icon={UserCheck}
          tone="emerald"
          hint={`de ${current.total} turnos`}
          change={countChange(current.attended, previous.attended)}
        />
        <MetricTile
          label="Pacientes atendidos"
          value={current.patientsAttended}
          icon={Users}
          tone="violet"
          hint="distintos"
          change={countChange(current.patientsAttended, previous.patientsAttended)}
        />
        <MetricTile
          label="Cancelación"
          value={formatRate(current.cancellationRate)}
          icon={Ban}
          tone="red"
          hint={`${current.cancelled} cancelados`}
          change={rateChange(current.cancellationRate, previous.cancellationRate)}
        />
        <MetricTile
          label="Ausentismo"
          value={formatRate(current.absenceRate)}
          icon={UserX}
          tone="amber"
          hint={`${current.absent} ausentes`}
          change={rateChange(current.absenceRate, previous.absenceRate)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard title="Evolución" icon={BarChart3} className="lg:h-[22rem]">
          {timelineEmpty ? (
            <DashboardEmpty icon={BarChart3} text="Sin sesiones registradas en el período." />
          ) : (
            <>
              <div className="flex h-48 items-end gap-2" role="list" aria-label="Sesiones por tramo">
                {timeline.map((bucket) => {
                  const total = bucket.attended + bucket.absent + bucket.cancelled;
                  const description = `${bucket.title}: ${bucket.attended} atendidos, ${bucket.absent} ausentes, ${bucket.cancelled} cancelados`;
                  return (
                    <div
                      key={bucket.title}
                      role="listitem"
                      aria-label={description}
                      title={description}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <span className="text-[11px] font-medium text-slate-600">{total || ""}</span>
                      <div
                        className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-t-md"
                        style={{ height: `${(total / timelineMax) * 100}%` }}
                      >
                        {SEGMENTS.map((segment) => (
                          <div
                            key={segment.key}
                            className={segment.className}
                            style={{ height: total ? `${(bucket[segment.key] / total) * 100}%` : 0 }}
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
              <Legend items={[...SEGMENTS]} />
            </>
          )}
        </DashboardCard>

        {showProfessionals ? (
          <DashboardCard title="Turnos por profesional" icon={Stethoscope} className="lg:h-[22rem]">
            {byProfessional.length === 0 ? (
              <DashboardEmpty icon={Stethoscope} text="Sin turnos en el período." />
            ) : (
              <>
                <ul className="space-y-4">
                  {byProfessional.slice(0, 5).map((row) => {
                    const realized = row.attended + row.absent;
                    return (
                      <li key={row.professionalId} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-slate-900">{row.professionalName}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {row.total} turnos · ausentismo {formatRate(realized ? row.absent / realized : null)}
                          </span>
                        </div>
                        <div
                          className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
                          style={{ width: `${Math.max(6, (row.total / professionalMax) * 100)}%` }}
                          aria-label={`${row.attended} atendidos, ${row.absent} ausentes, ${row.cancelled} cancelados, ${row.active} pendientes`}
                          role="img"
                        >
                          <div className="bg-brand-500" style={{ flexGrow: row.attended }} />
                          <div className="bg-slate-400" style={{ flexGrow: row.absent }} />
                          <div className="bg-red-400" style={{ flexGrow: row.cancelled }} />
                          <div className="bg-amber-300" style={{ flexGrow: row.active }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Legend items={[...SEGMENTS, { label: "Pendientes", className: "bg-amber-300" }]} />
              </>
            )}
          </DashboardCard>
        ) : (
          <DashboardCard title="Sesiones por obra social" icon={ShieldCheck} className="lg:h-[22rem]">
            {byInsurance.length === 0 ? (
              <DashboardEmpty icon={ShieldCheck} text="Sin sesiones atendidas en el período." />
            ) : (
              <ul className="space-y-3">
                {byInsurance.slice(0, 6).map((row) => (
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
          </DashboardCard>
        )}
      </div>
    </section>
  );
}
