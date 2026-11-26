"use client";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/ui/ListPagination";
import { usePagination } from "@/hooks/use-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAttendanceReport } from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { formatCalendarMonth } from "@/lib/agenda-calendar";
import { formatAppDate, getTodayAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import type { AttendanceReport, Insurance } from "@/types";
import { AlertTriangle, ClipboardList, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MobileList, MobileListRow, MobileStickyAction } from "@/components/mobile/MobileUi";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-is-desktop";

function currentMonth(): string {
  const [, month, year] = getTodayAppDate().split("-");
  return `${year}-${month}`;
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return formatCalendarMonth({ year, month: monthNumber - 1 });
}

/**
 * Planilla de asistencia mensual por obra social, para la facturación (como las
 * planillas de APROSS): pacientes, sesiones atendidas y autorización de cada uno.
 */
export function AttendanceReportView({
  insurances,
}: {
  insurances: Insurance[];
}) {
  const [insuranceId, setInsuranceId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Celular: el paciente que muestra sus fechas.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  // Celular: arranca con la primera obra social elegida (boceto 10), sin pantalla vacía.
  useEffect(() => {
    if (!isDesktop && !insuranceId && insurances.length > 0) {
      setInsuranceId((insurances.find((insurance) => insurance.active) ?? insurances[0]).id);
    }
  }, [isDesktop, insuranceId, insurances]);

  useEffect(() => {
    if (!insuranceId || !/^\d{4}-\d{2}$/.test(month)) {
      setReport(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAttendanceReport(insuranceId, month)
      .then((data) => !cancelled && setReport(data))
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "No se pudo armar la planilla.",
          );
          setReport(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [insuranceId, month]);

  const rows = useMemo(() => report?.rows ?? [], [report]);
  const pagination = usePagination(rows, {
    storageKey: "planilla-asistencia",
    resetKey: `${insuranceId}|${month}`,
  });
  // En pantalla se pagina; al imprimir sale la planilla completa.
  const shownRows = useMemo(() => new Set(pagination.items), [pagination.items]);

  return (
    <div className={cn("space-y-4", report && report.rows.length > 0 && "max-lg:pb-20")}>
      {/* Celular: obra social y mes uno al lado del otro, sin títulos (boceto 10). */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-end sm:gap-3 max-sm:[&_label]:sr-only print:hidden">
        <FormField
          id="planilla-obra-social"
          label="Obra social"
          className="sm:w-72"
        >
          <Select value={insuranceId} onValueChange={setInsuranceId}>
            <SelectTrigger id="planilla-obra-social" className="max-sm:h-11 max-sm:bg-white max-sm:font-semibold">
              <SelectValue placeholder="Elegí la obra social" />
            </SelectTrigger>
            <SelectContent>
              {insurances.map((insurance) => (
                <SelectItem key={insurance.id} value={insurance.id}>
                  {insurance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="planilla-mes" label="Mes" className="sm:w-48">
          <Input
            id="planilla-mes"
            type="month"
            className="max-sm:h-11 max-sm:bg-white max-sm:font-semibold"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </FormField>
        <Button
          type="button"
          variant="outline"
          className="sm:ml-auto max-lg:hidden"
          disabled={!report || report.rows.length === 0}
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Imprimir planilla
        </Button>
      </div>

      {!insuranceId ? (
        <EmptyState
          icon={ClipboardList}
          title="Elegí una obra social y un mes"
          description="Vas a ver los pacientes con las sesiones atendidas en ese mes y su autorización, listo para imprimir."
        />
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : loading && !report ? (
        <p className="text-sm text-muted-foreground">Armando la planilla…</p>
      ) : report && report.rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin sesiones atendidas"
          description={`No hay sesiones atendidas de ${report.insurance.name} en ${monthLabel(report.month)}.`}
        />
      ) : report ? (
        <section aria-label="Planilla de asistencia" className="space-y-3">
          <div>
            <p className="hidden text-xs text-slate-500 print:block">
              {siteConfig.clinicName}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 max-lg:hidden print:block">
              Planilla de asistencia · {report.insurance.name} ·{" "}
              {monthLabel(report.month)}
            </h2>
            <p className="text-sm text-muted-foreground max-lg:mx-1 max-lg:text-[13px] max-lg:[&>b]:font-semibold max-lg:[&>b]:text-slate-900 lg:[&>b]:font-normal">
              <b>
                {report.rows.length} {report.rows.length === 1 ? "paciente" : "pacientes"}
              </b>{" "}
              ·{" "}
              <b>
                {report.totalSessions} {report.totalSessions === 1 ? "sesión" : "sesiones"}
              </b>{" "}
              {report.totalSessions === 1 ? "atendida" : "atendidas"}
            </p>
          </div>
          <div className="hidden lg:block print:block">
            <DataTable
              headers={[
                "Paciente",
                "DNI",
                "Nº afiliado",
                "Plan",
                "Autorización",
                "Sesiones",
                "Total",
              ]}
            >
              {report.rows.map((row) => (
                <DataTableRow
                  key={row.patientId}
                  className={shownRows.has(row) ? undefined : "hidden print:table-row"}
                >
                  <DataTableCell className="font-medium text-slate-900">
                    {row.patientName}
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-slate-600">
                    {row.dni}
                  </DataTableCell>
                  <DataTableCell className="text-slate-600">
                    {row.affiliateNumber ?? "—"}
                  </DataTableCell>
                  <DataTableCell className="text-slate-600">
                    {row.plan ?? "—"}
                  </DataTableCell>
                  <DataTableCell className="text-slate-600">
                    {row.authorizationNumbers.length
                      ? row.authorizationNumbers.join(", ")
                      : "—"}
                    {row.withoutAuthorization > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {row.withoutAuthorization} sin autorización
                      </span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-xs text-slate-600">
                    {row.dates
                      .map((date) => formatAppDate(date, "dd/MM"))
                      .join(", ")}
                  </DataTableCell>
                  <DataTableCell className="font-semibold text-slate-900">
                    {row.dates.length}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
          </div>

          {/* Celular (boceto 10): una fila por paciente con sus sesiones a la derecha; tocarla muestra las fechas. */}
          <MobileList label="Pacientes de la planilla" className="lg:hidden print:hidden">
            {pagination.items.map((row) => {
              const expanded = expandedId === row.patientId;
              // Sin autorización lo dice el aviso de abajo: no se repite.
              const authorization = row.authorizationNumbers.length
                ? ` · Nº ${row.authorizationNumbers.join(", ")}`
                : "";
              return (
                <MobileListRow
                  key={row.patientId}
                  ariaLabel={`${row.patientName}: ${row.dates.length} sesiones`}
                  title={row.patientName}
                  detail={`${row.affiliateNumber ? `Afiliado ${row.affiliateNumber}` : `DNI ${row.dni}`}${authorization}`}
                  extra={
                    <>
                      {row.withoutAuthorization > 0 && (
                        <span className="mt-0.5 block text-[11.5px] font-semibold text-amber-700">
                          {row.withoutAuthorization} sin autorización
                        </span>
                      )}
                      {expanded && (
                        <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">
                          {row.dates.map((date) => formatAppDate(date, "dd/MM")).join(" · ")}
                        </span>
                      )}
                    </>
                  }
                  trailing={
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-[10px] bg-brand-50 px-2 text-[15px] font-bold tabular-nums text-brand-800">
                      {row.dates.length}
                    </span>
                  }
                  onClick={() => setExpandedId(expanded ? null : row.patientId)}
                />
              );
            })}
          </MobileList>
          <ListPagination pagination={pagination} itemLabel="pacientes" itemLabelSingular="paciente" />
          <MobileStickyAction>
            <Button type="button" className="h-12 w-full text-[15px]" onClick={() => window.print()}>
              Imprimir planilla
            </Button>
          </MobileStickyAction>
        </section>
      ) : null}
    </div>
  );
}
