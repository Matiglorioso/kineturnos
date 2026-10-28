"use client";

import { ALL_INSURANCES, filterAndSortPatients } from "@/lib/patient-list";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

interface PatientComboboxProps {
  id: string;
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * Elegir paciente escribiendo el nombre o el DNI (con cientos de pacientes, una
 * lista desplegable no alcanza). Los inactivos no se ofrecen para turnos nuevos.
 */
export function PatientCombobox({ id, patients, value, onChange, disabled, invalid }: PatientComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const selected = patients.find((patient) => patient.id === value);
  const options = useMemo(
    () =>
      filterAndSortPatients(
        patients.filter((patient) => patient.status === "activo" || patient.id === value),
        { search: query, insurance: ALL_INSURANCES, sort: "nombre-asc" }
      ),
    [patients, query, value]
  );

  useEffect(() => setHighlighted(0), [query]);

  // Mantiene a la vista la opción resaltada con el teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  const choose = (patient: Patient) => {
    onChange(patient.id);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const patient = options[highlighted];
      if (patient) choose(patient);
    } else if (event.key === "Escape" && open) {
      // Cierra la lista sin cerrar el diálogo.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-activedescendant={open && options[highlighted] ? `${listId}-${highlighted}` : undefined}
        autoComplete="off"
        disabled={disabled}
        // Al escribir, el paciente elegido queda como referencia en el placeholder.
        placeholder={selected?.name ?? "Buscar por nombre o DNI…"}
        value={open ? query : selected?.name ?? ""}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background py-2 pl-10 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          selected && "placeholder:text-slate-700"
        )}
      />
      {selected && !disabled ? (
        <button
          type="button"
          aria-label="Quitar paciente"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      )}

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Pacientes"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Ningún paciente activo coincide con “{query}”.
            </li>
          ) : (
            options.map((patient, index) => (
              <li
                key={patient.id}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={patient.id === value}
                // mousedown en lugar de click: si no, el blur del input cierra la lista antes.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(patient);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  "flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm",
                  index === highlighted && "bg-muted",
                  patient.id === value && "font-medium text-brand-800"
                )}
              >
                <span className="truncate">{patient.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">DNI {patient.dni}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
