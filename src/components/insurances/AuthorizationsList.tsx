"use client";

import { AuthorizationDialog } from "@/components/patients/AuthorizationDialog";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import { usePagination } from "@/hooks/use-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchAllAuthorizations,
  updateAuthorizationRequest,
  type AuthorizationRequest,
} from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { APP_DATE_FORMAT, formatAppDate } from "@/lib/date-utils";
import {
  AUTHORIZATION_STATUS_LABELS,
  AUTHORIZATION_STATUS_PRIORITY,
  filterAuthorizations,
  type AuthorizationListFilters,
} from "@/lib/insurance";
import { pluralize } from "@/lib/pluralize";
import { showSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type {
  AuthorizationListItem,
  AuthorizationStatus,
  Insurance,
} from "@/types";
import { FileCheck2, Pencil, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_STYLES: Record<
  AuthorizationStatus,
  { badge: string; dot: string }
> = {
  agotada: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  vencida: {
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-400",
  },
  "por-renovar": {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  pendiente: {
    badge: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  vigente: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  rechazada: {
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

const EMPTY_FILTERS: AuthorizationListFilters = {
  search: "",
  insuranceId: "todas",
  status: "todas",
};

function StatusBadge({ status }: { status: AuthorizationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status].badge,
      )}
    >
      {AUTHORIZATION_STATUS_LABELS[status]}
    </span>
  );
}

function SessionsBar({ used, sessions }: { used: number; sessions: number }) {
  const percent = Math.min(100, Math.round((used / sessions) * 100));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Sesiones usadas"
        aria-valuemin={0}
        aria-valuemax={sessions}
        aria-valuenow={used}
      >
        <div
          className={cn(
            "h-full rounded-full",
            used >= sessions ? "bg-red-400" : "bg-brand-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-700">
        {used}/{sessions}
      </span>
    </div>
  );
}

function period(item: AuthorizationListItem): string {
  const from = formatAppDate(item.validFrom, APP_DATE_FORMAT);
  return item.validUntil
    ? `${from} al ${formatAppDate(item.validUntil, APP_DATE_FORMAT)}`
    : `Desde ${from}`;
}

/** Todas las autorizaciones, con buscador, filtros y lo que hay que gestionar primero (RF15). */
export function AuthorizationsList({
  insurances,
}: {
  insurances: Insurance[];
}) {
  const [items, setItems] = useState<AuthorizationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<AuthorizationListFilters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<AuthorizationListItem | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchAllAuthorizations());
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "No se pudieron cargar las autorizaciones.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Los contadores respetan la búsqueda y la obra social: así cierran con los resultados.
  const { counts, countsTotal } = useMemo(() => {
    const scoped = filterAuthorizations(items ?? [], {
      ...filters,
      status: "todas",
    });
    const result = new Map<AuthorizationStatus, number>();
    for (const item of scoped)
      result.set(item.status, (result.get(item.status) ?? 0) + 1);
    return { counts: result, countsTotal: scoped.length };
  }, [items, filters]);

  const visible = useMemo(
    () => filterAuthorizations(items ?? [], filters),
    [items, filters],
  );
  const pagination = usePagination(visible, {
    storageKey: "autorizaciones",
    resetKey: JSON.stringify(filters),
  });
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.insuranceId !== "todas" ||
    filters.status !== "todas";

  const save = async (body: AuthorizationRequest) => {
    if (!editing) return;
    await updateAuthorizationRequest(editing.patientId, editing.id, body);
    showSuccessToast("Autorización actualizada");
    await load();
  };

  const segment = (active: boolean) =>
    cn(
      "h-9 min-w-0 basis-full gap-1.5 rounded-lg border-0 px-3 text-sm font-medium shadow-none focus:ring-2 sm:basis-auto sm:flex-none",
      active
        ? "bg-background text-foreground shadow-sm"
        : "bg-transparent text-muted-foreground hover:text-foreground",
    );

  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors",
      active
        ? "border-primary bg-primary/5 font-medium text-slate-900"
        : "border-slate-200 bg-white text-slate-700 hover:bg-muted",
    );

  const patientLink =(item: AuthorizationListItem) =>
    `/pacientes?q=${encodeURIComponent(item.patientDni)}`;

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }
  if (items === null) {
    return (
      <p className="text-sm text-muted-foreground">Cargando autorizaciones…</p>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileCheck2}
        title="Todavía no hay autorizaciones"
        description="Se cargan desde la ficha de cada paciente, en la sección Cobertura."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Único filtro por situación: cada chip muestra cuántas hay y filtra por ella. */}
      <div
        role="group"
        aria-label="Situación"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap"
      >
        <button
          type="button"
          aria-pressed={filters.status === "todas"}
          onClick={() =>
            setFilters((current) => ({ ...current, status: "todas" }))
          }
          className={chip(filters.status === "todas")}
        >
          Todas
          <span className="font-semibold">{countsTotal}</span>
        </button>
        {/* Las situaciones sin autorizaciones no se muestran, salvo la elegida (para poder salir). */}
        {AUTHORIZATION_STATUS_PRIORITY.filter(
          (status) => counts.get(status) || filters.status === status,
        ).map((status) => {
          const active = filters.status === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  status: active ? "todas" : status,
                }))
              }
              className={chip(active)}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  STATUS_STYLES[status].dot,
                )}
              />
              {AUTHORIZATION_STATUS_LABELS[status]}
              <span className="font-semibold">{counts.get(status) ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            aria-label="Buscar autorizaciones"
            placeholder="Paciente, DNI o Nº de autorización"
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div
            role="group"
            aria-label="Filtros de autorizaciones"
            className="flex w-full flex-wrap items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto sm:flex-nowrap"
          >
            <Select
              value={filters.insuranceId}
              onValueChange={(next) =>
                setFilters((current) => ({ ...current, insuranceId: next }))
              }
            >
              <SelectTrigger
                aria-label="Obra social"
                className={cn(
                  segment(filters.insuranceId !== "todas"),
                  "sm:w-52",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las obras sociales</SelectItem>
                {insurances.map((insurance) => (
                  <SelectItem key={insurance.id} value={insurance.id}>
                    {insurance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <button
                type="button"
                aria-label="Limpiar filtros"
                title="Limpiar filtros"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex h-9 basis-full items-center justify-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:w-9 sm:basis-auto sm:shrink-0"
              >
                <X className="h-4 w-4" />
                {/* En celular el botón ocupa su fila: se muestra el texto. */}
                <span className="sm:hidden">Limpiar filtros</span>
              </button>
            )}
          </div>
          <p
            className="shrink-0 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {pluralize(visible.length, "resultado")}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ninguna autorización coincide con la búsqueda o los filtros."
          actionLabel="Limpiar filtros"
          onAction={() => setFilters(EMPTY_FILTERS)}
        />
      ) : (
        <div className="space-y-4">
          {/* Escritorio: tabla. */}
          <div className="hidden lg:block">
            <TooltipProvider delayDuration={200}>
              <DataTable
                headers={[
                  "Paciente",
                  "Obra social",
                  "Autorización",
                  "Situación",
                  "Sesiones",
                  "Vigencia",
                  "Acciones",
                ]}
              >
                {pagination.items.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>
                      <p className="font-medium text-slate-900">
                        {item.patientName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.patientDni}
                      </p>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {item.insuranceName}
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {item.number ?? "—"}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge status={item.status} />
                    </DataTableCell>
                    <DataTableCell className="w-40">
                      <SessionsBar used={item.used} sessions={item.sessions} />
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-slate-600">
                      {period(item)}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-600 hover:text-brand-800"
                              aria-label={`Editar autorización de ${item.patientName}`}
                              onClick={() => setEditing(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-600 hover:text-brand-800"
                            >
                              <Link
                                href={patientLink(item)}
                                aria-label={`Ver paciente ${item.patientName}`}
                              >
                                <UserRound className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver paciente</TooltipContent>
                        </Tooltip>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTable>
            </TooltipProvider>
          </div>

          {/* Celular y tablet: tarjetas. */}
          <ul
            className="grid gap-3 sm:grid-cols-2 lg:hidden"
            aria-label="Autorizaciones"
          >
            {pagination.items.map((item) => (
              <li key={item.id} className="surface-card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {item.patientName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      DNI {item.patientDni} · {item.insuranceName}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                  <span>
                    {item.number ? `Nº ${item.number}` : "Sin número"}
                  </span>
                  <span>{period(item)}</span>
                </div>
                <SessionsBar used={item.used} sessions={item.sessions} />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={patientLink(item)}>
                      <UserRound className="h-4 w-4" />
                      Ver paciente
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <ListPagination pagination={pagination} itemLabel="autorizaciones" />
        </div>
      )}

      <AuthorizationDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        insuranceName={
          editing ? `${editing.patientName} · ${editing.insuranceName}` : ""
        }
        authorization={editing}
        onSubmit={save}
      />
    </div>
  );
}
