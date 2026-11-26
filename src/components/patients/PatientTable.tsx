"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableCell,
  DataTableRow,
} from "@/components/ui/DataTable";
import { Patient } from "@/types";
import { formatAppDate } from "@/lib/date-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { usePermissions } from "@/hooks/use-permissions";
import { FileHeart } from "lucide-react";
import Link from "next/link";

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
  const { can } = usePermissions();
  const showClinical = can("clinical:read");

  if (patients.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <DataTable
        headers={[
          "Paciente",
          "DNI",
          "Teléfono",
          "Obra social",
          "Último turno",
          "Estado",
          "Acciones",
        ]}
        className={className}
      >
        {patients.map((patient) => (
          <DataTableRow key={patient.id} onClick={() => onViewDetail(patient)}>
            <DataTableCell>
              <div className="flex items-center gap-3">
                {/* Toda la fila abre la ficha; el nombre es el botón para el teclado y los lectores. */}
                <button
                  type="button"
                  className="rounded font-medium text-slate-900 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Ver detalle de ${patient.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewDetail(patient);
                  }}
                >
                  {patient.name}
                </button>
              </div>
            </DataTableCell>
            <DataTableCell className="font-mono text-xs text-slate-600">
              {patient.dni}
            </DataTableCell>
            <DataTableCell className="text-slate-600">
              {patient.phone}
            </DataTableCell>
            <DataTableCell>
              <div className="flex flex-col items-start gap-1">
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {patient.insurance}
                </span>
                <CoverageBadge coverage={patient.coverage} size="xs" short onlyIssues />
              </div>
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
              {/* Solo íconos; el nombre de cada acción aparece al pasar el mouse (y lo leen los lectores de pantalla). */}
              <div className="flex items-center gap-1">
                {showClinical && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-600 hover:text-brand-800"
                      >
                        <Link
                          href={`/pacientes/${encodeURIComponent(patient.id)}/historia`}
                          aria-label="Historia clínica"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <FileHeart className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Historia clínica</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>
    </TooltipProvider>
  );
}
