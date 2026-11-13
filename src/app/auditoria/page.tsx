"use client";

import { AuditLogList } from "@/components/audit/AuditLogList";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePagination } from "@/hooks/use-pagination";
import { fetchAuditLog } from "@/lib/api/audit-client";
import { ApiError } from "@/lib/api/fetch-json";
import {
  AUDIT_ENTITY_LABELS,
  AUDIT_MAX_ROWS,
  AUDIT_PERIODS,
  auditUserKey,
  DEFAULT_AUDIT_FILTERS,
  DEFAULT_AUDIT_PERIOD_DAYS,
  filterAuditEntries,
  type AuditEntity,
  type AuditEntryFilters,
} from "@/lib/audit";
import { cn } from "@/lib/utils";
import type { AuditLogItem } from "@/types";
import { History, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_TITLE = "Auditoría";
const PAGE_DESCRIPTION = "Quién cambió qué, cuándo y desde dónde.";

export default function AuditoriaPage() {
  const [days, setDays] = useState<number>(DEFAULT_AUDIT_PERIOD_DAYS);
  const [filters, setFilters] = useState<AuditEntryFilters>(DEFAULT_AUDIT_FILTERS);
  const [data, setData] = useState<{ items: AuditLogItem[]; truncated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (period: number) => {
    setError(null);
    try {
      setData(await fetchAuditLog(period));
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "No se pudo cargar la auditoría.");
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const items = useMemo(() => data?.items ?? [], [data]);

  // Usuarios y tipos de registro que aparecen en el período, para los filtros.
  const userOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const item of items) byKey.set(auditUserKey(item), item.userName);
    return [...byKey.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [items]);
  const entityOptions = useMemo(
    () => (Object.keys(AUDIT_ENTITY_LABELS) as AuditEntity[]).filter((entity) => items.some((i) => i.entity === entity)),
    [items]
  );

  const filtered = useMemo(() => filterAuditEntries(items, filters), [items, filters]);
  const pagination = usePagination(filtered, {
    storageKey: "auditoria",
    resetKey: `${days}|${filters.userKey}|${filters.entity}`,
  });
  const isFiltering = filters.userKey !== "todos" || filters.entity !== "todas";

  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={PAGE_TITLE} description="Error al cargar" />
        <DataLoadError message={error} onRetry={() => void load(days)} />
      </div>
    );
  }

  if (!data) {
    return <PageLoadingState title={PAGE_TITLE} description="Cargando la auditoría..." />;
  }

  const segment = (active: boolean) =>
    cn(
      "h-9 min-w-0 flex-1 gap-1.5 rounded-lg border-0 px-3 text-sm font-medium shadow-none focus:ring-2 sm:w-44 sm:flex-none",
      active ? "bg-background text-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger aria-label="Período" className="h-10 w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_PERIODS.map((period) => (
              <SelectItem key={period.days} value={String(period.days)}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div role="group" aria-label="Filtros de auditoría" className="flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto">
          <Select value={filters.userKey} onValueChange={(userKey) => setFilters((current) => ({ ...current, userKey }))}>
            <SelectTrigger aria-label="Usuario" className={segment(filters.userKey !== "todos")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los usuarios</SelectItem>
              {userOptions.map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.entity}
            onValueChange={(entity) =>
              setFilters((current) => ({ ...current, entity: entity as AuditEntryFilters["entity"] }))
            }
          >
            <SelectTrigger aria-label="Tipo de registro" className={segment(filters.entity !== "todas")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los registros</SelectItem>
              {entityOptions.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {AUDIT_ENTITY_LABELS[entity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFiltering && (
            <button
              type="button"
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
              onClick={() => setFilters(DEFAULT_AUDIT_FILTERS)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={isFiltering ? "Sin resultados" : "Sin movimientos en el período"}
          description={
            isFiltering ? "Probá con otro usuario o tipo de registro." : "Elegí un período más largo para ver más."
          }
          secondaryActionLabel={isFiltering ? "Limpiar filtros" : undefined}
          onSecondaryAction={isFiltering ? () => setFilters(DEFAULT_AUDIT_FILTERS) : undefined}
        />
      ) : (
        <div className="space-y-4">
          <AuditLogList items={pagination.items} />
          <ListPagination pagination={pagination} itemLabel="movimientos" itemLabelSingular="movimiento" />
          {data.truncated && (
            <p className="text-sm text-muted-foreground">
              Se muestran los {AUDIT_MAX_ROWS.toLocaleString("es-AR")} más recientes: elegí un período más corto para
              ver el resto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
