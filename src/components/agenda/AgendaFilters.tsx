"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUS_FILTERS } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, Patient, Professional } from "@/types";
import { X } from "lucide-react";
import { useMemo } from "react";

export type AgendaFilterValues = {
  status: AppointmentStatus | "todos";
  patientId: string;
  professionalId: string;
};

export const EMPTY_AGENDA_FILTERS: AgendaFilterValues = {
  status: "todos",
  patientId: "todos",
  professionalId: "todos",
};

interface AgendaFiltersProps {
  value: AgendaFilterValues;
  onChange: (value: AgendaFilterValues) => void;
  patients: Patient[];
  professionals: Professional[];
  /** El profesional solo ve su agenda: no se ofrece el filtro por profesional. */
  showProfessional: boolean;
}

/**
 * Filtros de la agenda con el mismo estilo que el selector Lista/Semana: un
 * bloque gris con un segmento por filtro; el filtro activo se marca en blanco.
 */
export function AgendaFilters({
  value,
  onChange,
  patients,
  professionals,
  showProfessional,
}: AgendaFiltersProps) {
  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [patients]
  );

  const set = (key: keyof AgendaFilterValues, next: string) =>
    onChange({ ...value, [key]: next } as AgendaFilterValues);

  const activeCount =
    (value.status !== "todos" ? 1 : 0) +
    (value.patientId !== "todos" ? 1 : 0) +
    (showProfessional && value.professionalId !== "todos" ? 1 : 0);

  const segment = (active: boolean) =>
    cn(
      "h-9 min-w-0 flex-1 gap-1.5 rounded-lg border-0 px-3 text-sm font-medium shadow-none focus:ring-2 sm:flex-none",
      active
        ? "bg-background text-foreground shadow-sm"
        : "bg-transparent text-muted-foreground hover:text-foreground"
    );

  return (
    <div
      role="group"
      aria-label="Filtros de la agenda"
      className="flex w-full flex-wrap items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto sm:flex-nowrap"
    >
      <Select value={value.status} onValueChange={(next) => set("status", next)}>
        <SelectTrigger aria-label="Estado" className={cn(segment(value.status !== "todos"), "sm:w-44")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPOINTMENT_STATUS_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.value === "todos" ? "Todos los estados" : filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.patientId} onValueChange={(next) => set("patientId", next)}>
        <SelectTrigger aria-label="Paciente" className={cn(segment(value.patientId !== "todos"), "sm:w-48")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los pacientes</SelectItem>
          {sortedPatients.map((patient) => (
            <SelectItem key={patient.id} value={patient.id}>
              {patient.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showProfessional && (
        <Select
          value={value.professionalId}
          onValueChange={(next) => set("professionalId", next)}
        >
          <SelectTrigger
            aria-label="Profesional"
            className={cn(segment(value.professionalId !== "todos"), "sm:w-52")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los profesionales</SelectItem>
            {professionals.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.name}
                {!professional.active ? " (inactivo)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          aria-label="Limpiar filtros"
          title="Limpiar filtros"
          onClick={() =>
            onChange({
              ...EMPTY_AGENDA_FILTERS,
              professionalId: showProfessional ? "todos" : value.professionalId,
            })
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
