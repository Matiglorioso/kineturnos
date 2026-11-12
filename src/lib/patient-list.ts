import type { Patient, PatientStatus } from "@/types";

export type PatientSort =
  | "apellido-asc"
  | "apellido-desc"
  | "nombre-asc"
  | "nombre-desc"
  | "dni-asc"
  | "dni-desc"
  | "estado";

export const PATIENT_SORT_OPTIONS: { value: PatientSort; label: string }[] = [
  { value: "apellido-asc", label: "Apellido (A-Z)" },
  { value: "apellido-desc", label: "Apellido (Z-A)" },
  { value: "nombre-asc", label: "Nombre (A-Z)" },
  { value: "nombre-desc", label: "Nombre (Z-A)" },
  { value: "dni-asc", label: "DNI (menor a mayor)" },
  { value: "dni-desc", label: "DNI (mayor a menor)" },
  { value: "estado", label: "Estado (activos primero)" },
];

export const ALL_INSURANCES = "todas";

export const ALL_STATUSES = "todos";

export type PatientStatusFilter = PatientStatus | typeof ALL_STATUSES;

export const PATIENT_STATUS_OPTIONS: { value: PatientStatusFilter; label: string }[] = [
  { value: ALL_STATUSES, label: "Todos los estados" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
];

export type PatientListOptions = {
  search: string;
  /** Obra social exacta, o ALL_INSURANCES. */
  insurance: string;
  /** Estado exacto, o ALL_STATUSES (por defecto). */
  status?: PatientStatusFilter;
  sort: PatientSort;
};

export const DEFAULT_PATIENT_LIST_OPTIONS: PatientListOptions = {
  search: "",
  insurance: ALL_INSURANCES,
  status: ALL_STATUSES,
  // En el consultorio se busca por apellido.
  sort: "apellido-asc",
};

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** DNI como número (sin puntos ni espacios), para ordenar 9.876.543 antes que 12.345.678. */
function dniValue(dni: string): number {
  const digits = dni.replace(/\D/g, "");
  return digits ? Number(digits) : Number.POSITIVE_INFINITY;
}

/** Obras sociales presentes en la lista, sin repetir y en orden alfabético. */
export function getInsuranceOptions(patients: Patient[]): string[] {
  return [...new Set(patients.map((patient) => patient.insurance).filter(Boolean))].sort(
    collator.compare
  );
}

/** Apellido para ordenar: el cargado o, en pacientes viejos sin apellido aparte, la última palabra del nombre. */
function surname(patient: Patient): string {
  return patient.lastName?.trim() || patient.name.trim().split(/\s+/).pop() || patient.name;
}

function matchesSearch(patient: Patient, query: string): boolean {
  if (!query) return true;
  const digits = query.replace(/\D/g, "");
  return (
    patient.name.toLowerCase().includes(query) ||
    patient.insurance.toLowerCase().includes(query) ||
    (patient.email?.toLowerCase().includes(query) ?? false) ||
    patient.dni.includes(query) ||
    patient.phone.includes(query) ||
    // "30123456" encuentra el DNI "30.123.456" y viceversa; el CUIL, con o sin guiones (RF08).
    (digits.length >= 3 &&
      (patient.dni.replace(/\D/g, "").includes(digits) ||
        (patient.cuil?.includes(digits) ?? false) ||
        // CUIL completo de un paciente que no lo tiene cargado: se busca por el DNI que contiene.
        (digits.length === 11 && patient.dni.replace(/\D/g, "").padStart(8, "0") === digits.slice(2, 10))))
  );
}

function compare(a: Patient, b: Patient, sort: PatientSort): number {
  const byName = collator.compare(a.name, b.name);
  const bySurname = collator.compare(surname(a), surname(b)) || byName;
  switch (sort) {
    case "apellido-asc":
      return bySurname;
    case "apellido-desc":
      return -bySurname;
    case "nombre-asc":
      return byName;
    case "nombre-desc":
      return -byName;
    case "dni-asc":
      return dniValue(a.dni) - dniValue(b.dni) || byName;
    case "dni-desc":
      return dniValue(b.dni) - dniValue(a.dni) || byName;
    case "estado":
      return (a.status === b.status ? 0 : a.status === "activo" ? -1 : 1) || byName;
  }
}

/** Busca, filtra por obra social y estado, y ordena la lista de pacientes. */
export function filterAndSortPatients(patients: Patient[], options: PatientListOptions): Patient[] {
  const query = options.search.toLowerCase().trim();
  return patients
    .filter(
      (patient) =>
        (options.insurance === ALL_INSURANCES || patient.insurance === options.insurance) &&
        (!options.status || options.status === ALL_STATUSES || patient.status === options.status) &&
        matchesSearch(patient, query)
    )
    .sort((a, b) => compare(a, b, options.sort));
}
