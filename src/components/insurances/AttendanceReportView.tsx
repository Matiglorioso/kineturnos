"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTableCell, DataTableRow } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
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
import { useEffect, useState } from "react";

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
export function AttendanceReportView({ insurances }: { insurances: Insurance[] }) {
  const [insuranceId, setInsuranceId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          setError(loadError instanceof ApiError ? loadError.message : "No se pudo armar la planilla.");
          setReport(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [insuranceId, month]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
        <FormField id="planilla-obra-social" label="Obra social" className="sm:w-72">
          <Select value={insuranceId} onValueChange={setInsuranceId}>
            <SelectTrigger id="planilla-obra-social">
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
          <Input id="planilla-mes" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </FormField>
        <Button
          type="button"
          variant="outline"
          className="sm:ml-auto"
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
            <p className="hidden text-xs text-slate-500 print:block">{siteConfig.clinicName}</p>
            <h2 className="text-lg font-semibold text-slate-900">
              Planilla de asistencia · {report.insurance.name} · {monthLabel(report.month)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {report.rows.length} {report.rows.length === 1 ? "paciente" : "pacientes"} ·{" "}
              {report.totalSessions} {report.totalSessions === 1 ? "sesión atendida" : "sesiones atendidas"}
            </p>
          </div>
          <DataTable headers={["Paciente", "DNI", "Nº afiliado", "Plan", "Autorización", "Sesiones", "Total"]}>
            {report.rows.map((row) => (
              <DataTableRow key={row.patientId}>
                <DataTableCell className="font-medium text-slate-900">{row.patientName}</DataTableCell>
                <DataTableCell className="font-mono text-xs text-slate-600">{row.dni}</DataTableCell>
                <DataTableCell className="text-slate-600">{row.affiliateNumber ?? "—"}</DataTableCell>
                <DataTableCell className="text-slate-600">{row.plan ?? "—"}</DataTableCell>
                <DataTableCell className="text-slate-600">
                  {row.authorizationNumbers.length ? row.authorizationNumbers.join(", ") : "—"}
                  {row.withoutAuthorization > 0 && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {row.withoutAuthorization} sin autorización
                    </span>
                  )}
                </DataTableCell>
                <DataTableCell className="text-xs text-slate-600">
                  {row.dates.map((date) => formatAppDate(date, "dd/MM")).join(", ")}
                </DataTableCell>
                <DataTableCell className="font-semibold text-slate-900">{row.dates.length}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTable>
        </section>
      ) : null}
    </div>
  );
}
