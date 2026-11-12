"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { APPOINTMENT_STATUS_FILTERS, getAppointmentStatusLabel } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, Professional } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type AgendaFilterValues = {
  status: AppointmentStatus | "todos";
  /** Texto a buscar en el nombre del paciente. */
  patientQuery: string;
  professionalId: string;
};

export const EMPTY_AGENDA_FILTERS: AgendaFilterValues = {
  status: "todos",
  patientQuery: "",
  professionalId: "todos",
};

interface AgendaFiltersProps {
  value: AgendaFilterValues;
  onChange: (value: AgendaFilterValues) => void;
  professionals: Professional[];
  /** El profesional solo ve su agenda: no se ofrece el filtro por profesional. */
  showProfessional: boolean;
  className?: string;
}

/**
 * Buscador de paciente y un botón "Filtros" (estado y profesional). Lo que se
 * filtra se ve debajo como etiquetas que se quitan con la ✕.
 */
export function AgendaFilters({
  value,
  onChange,
  professionals,
  showProfessional,
  className,
}: AgendaFiltersProps) {
  const set = <K extends keyof AgendaFilterValues>(key: K, next: AgendaFilterValues[K]) =>
    onChange({ ...value, [key]: next });

  const professionalName = professionals.find((item) => item.id === value.professionalId)?.name;
  const active = [
    value.status !== "todos" && {
      key: "status",
      label: getAppointmentStatusLabel(value.status as AppointmentStatus),
      clear: () => set("status", "todos"),
    },
    showProfessional &&
      value.professionalId !== "todos" && {
        key: "professional",
        label: professionalName ?? "Profesional",
        clear: () => set("professionalId", "todos"),
      },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <div className={cn("space-y-2", className)}>
      <div role="search" aria-label="Filtros de la agenda" className="flex gap-2">
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-10 pr-9"
            aria-label="Buscar paciente"
            placeholder="Buscar paciente…"
            value={value.patientQuery}
            onChange={(event) => set("patientQuery", event.target.value)}
          />
          {value.patientQuery && (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => set("patientQuery", "")}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-10 shrink-0 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {active.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              )}
              {active.length > 0 && <span className="sr-only"> (con filtros aplicados)</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[70vh] w-60 overflow-y-auto">
            <DropdownMenuLabel>Estado</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={value.status}
              onValueChange={(next) => set("status", next as AgendaFilterValues["status"])}
            >
              {APPOINTMENT_STATUS_FILTERS.map((filter) => (
                <DropdownMenuRadioItem key={filter.value} value={filter.value}>
                  {filter.value === "todos" ? "Todos los estados" : filter.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            {showProfessional && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Profesional</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={value.professionalId}
                  onValueChange={(next) => set("professionalId", next)}
                >
                  <DropdownMenuRadioItem value="todos">Todos los profesionales</DropdownMenuRadioItem>
                  {professionals.map((professional) => (
                    <DropdownMenuRadioItem key={professional.id} value={professional.id}>
                      {professional.name}
                      {!professional.active ? " (inactivo)" : ""}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {active.length > 0 && (
        <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-2">
          {active.map((filter) => (
            <li key={filter.key}>
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-0.5 pl-3 pr-1 text-sm text-brand-800">
                {filter.label}
                <button
                  type="button"
                  aria-label={`Quitar filtro: ${filter.label}`}
                  onClick={filter.clear}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-brand-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
