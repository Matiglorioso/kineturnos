"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_INSURANCES,
  ALL_STATUSES,
  PATIENT_SORT_OPTIONS,
  PATIENT_STATUS_OPTIONS,
  type PatientSort,
  type PatientStatusFilter,
} from "@/lib/patient-list";
import { cn } from "@/lib/utils";
import { ArrowUpDown, X } from "lucide-react";

interface PatientListControlsProps {
  sort: PatientSort;
  onSortChange: (sort: PatientSort) => void;
  insurance: string;
  onInsuranceChange: (insurance: string) => void;
  insuranceOptions: string[];
  status: PatientStatusFilter;
  onStatusChange: (status: PatientStatusFilter) => void;
}

/** Orden y filtros por obra social y estado, con el mismo estilo de segmentos que los filtros de la agenda. */
export function PatientListControls({
  sort,
  onSortChange,
  insurance,
  onInsuranceChange,
  insuranceOptions,
  status,
  onStatusChange,
}: PatientListControlsProps) {
  const segment = (active: boolean) =>
    cn(
      "h-9 min-w-[9rem] flex-1 gap-1.5 rounded-lg border-0 px-3 text-sm font-medium shadow-none focus:ring-2 sm:min-w-0 sm:flex-none",
      active
        ? "bg-background text-foreground shadow-sm"
        : "bg-transparent text-muted-foreground hover:text-foreground"
    );
  const insuranceActive = insurance !== ALL_INSURANCES;
  const statusActive = status !== ALL_STATUSES;

  return (
    <div
      role="group"
      aria-label="Orden y filtros de pacientes"
      className="flex w-full flex-wrap items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto sm:flex-nowrap"
    >
      <Select value={sort} onValueChange={(next) => onSortChange(next as PatientSort)}>
        <SelectTrigger aria-label="Ordenar por" className={cn(segment(true), "sm:w-48")}>
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PATIENT_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(next) => onStatusChange(next as PatientStatusFilter)}>
        <SelectTrigger aria-label="Estado" className={cn(segment(statusActive), "sm:w-44")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PATIENT_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={insurance} onValueChange={onInsuranceChange}>
        <SelectTrigger aria-label="Obra social" className={cn(segment(insuranceActive), "sm:w-52")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_INSURANCES}>Todas las obras sociales</SelectItem>
          {insuranceOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(insuranceActive || statusActive) && (
        <button
          type="button"
          aria-label="Quitar filtros"
          title="Quitar filtros"
          onClick={() => {
            onInsuranceChange(ALL_INSURANCES);
            onStatusChange(ALL_STATUSES);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
