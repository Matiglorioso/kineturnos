"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
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
import { ChevronDown, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";

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

/** Un solo botón "Filtros" con estado, paciente y profesional; los activos se ven como etiquetas. */
export function AgendaFilters({
  value,
  onChange,
  patients,
  professionals,
  showProfessional,
}: AgendaFiltersProps) {
  const [open, setOpen] = useState(false);
  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [patients]
  );

  const chips: { key: keyof AgendaFilterValues; label: string }[] = [];
  if (value.status !== "todos") {
    const label = APPOINTMENT_STATUS_FILTERS.find((item) => item.value === value.status)?.label;
    chips.push({ key: "status", label: `Estado: ${label ?? value.status}` });
  }
  if (value.patientId !== "todos") {
    const name = patients.find((item) => item.id === value.patientId)?.name;
    chips.push({ key: "patientId", label: `Paciente: ${name ?? "—"}` });
  }
  if (showProfessional && value.professionalId !== "todos") {
    const name = professionals.find((item) => item.id === value.professionalId)?.name;
    chips.push({ key: "professionalId", label: `Profesional: ${name ?? "—"}` });
  }

  const set = (key: keyof AgendaFilterValues, next: string) =>
    onChange({ ...value, [key]: next } as AgendaFilterValues);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls="agenda-filtros"
          onClick={() => setOpen((current) => !current)}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {chips.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-4 text-primary-foreground">
              {chips.length}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </Button>

        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-800"
          >
            {chip.label}
            <button
              type="button"
              aria-label={`Quitar filtro ${chip.label}`}
              onClick={() => set(chip.key, "todos")}
              className="rounded p-0.5 hover:bg-brand-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {chips.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...EMPTY_AGENDA_FILTERS,
                professionalId: showProfessional ? "todos" : value.professionalId,
              })
            }
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {open && (
        <div
          id="agenda-filtros"
          className={cn(
            "grid gap-3 rounded-xl border border-slate-200 bg-muted/30 p-3",
            showProfessional ? "sm:grid-cols-3" : "sm:grid-cols-2"
          )}
        >
          <FormField id="filtro-estado" label="Estado">
            <Select value={value.status} onValueChange={(next) => set("status", next)}>
              <SelectTrigger id="filtro-estado">
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
          </FormField>

          <FormField id="filtro-paciente" label="Paciente">
            <Select value={value.patientId} onValueChange={(next) => set("patientId", next)}>
              <SelectTrigger id="filtro-paciente">
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
          </FormField>

          {showProfessional && (
            <FormField id="filtro-profesional" label="Profesional">
              <Select
                value={value.professionalId}
                onValueChange={(next) => set("professionalId", next)}
              >
                <SelectTrigger id="filtro-profesional">
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
            </FormField>
          )}
        </div>
      )}
    </div>
  );
}
