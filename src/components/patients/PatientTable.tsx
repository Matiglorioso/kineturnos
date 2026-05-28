"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/DataTable";
import { Patient } from "@/types";
import { getInitials } from "@/lib/utils";
import { formatAppDate } from "@/lib/date-utils";
import { Eye } from "lucide-react";

interface PatientTableProps {
  patients: Patient[];
  onViewDetail: (patient: Patient) => void;
  className?: string;
}

export function PatientTable({
  patients,
  onViewDetail,
  className,
}: PatientTableProps) {
  if (patients.length === 0) {
    return null;
  }

  return (
    <DataTable
      headers={[
        "Paciente",
        "DNI",
        "Telefono",
        "Obra social",
        "Ultimo turno",
        "Estado",
        "Acciones",
      ]}
      className={className}
    >
      {patients.map((patient) => (
        <DataTableRow key={patient.id}>
          <DataTableCell>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                {getInitials(patient.name)}
              </div>
              <span className="font-medium text-slate-900">{patient.name}</span>
            </div>
          </DataTableCell>
          <DataTableCell className="font-mono text-xs text-slate-600">
            {patient.dni}
          </DataTableCell>
          <DataTableCell className="text-slate-600">{patient.phone}</DataTableCell>
          <DataTableCell>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {patient.insurance}
            </span>
          </DataTableCell>
          <DataTableCell className="text-slate-600">
            {patient.lastAppointment
              ? formatAppDate(patient.lastAppointment)
              : "Sin turnos"}
          </DataTableCell>
          <DataTableCell>
            <PatientStatusBadge active={patient.status === "activo"} />
          </DataTableCell>
          <DataTableCell>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail(patient)}
            >
              <Eye className="h-4 w-4" />
              Ver detalle
            </Button>
          </DataTableCell>
        </DataTableRow>
      ))}
    </DataTable>
  );
}
