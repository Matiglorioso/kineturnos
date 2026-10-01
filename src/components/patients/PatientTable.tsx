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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/use-permissions";
import { Eye, FileHeart } from "lucide-react";
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
          <DataTableRow key={patient.id}>
            <DataTableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                  {getInitials(patient.name)}
                </div>
                <span className="font-medium text-slate-900">
                  {patient.name}
                </span>
              </div>
            </DataTableCell>
            <DataTableCell className="font-mono text-xs text-slate-600">
              {patient.dni}
            </DataTableCell>
            <DataTableCell className="text-slate-600">
              {patient.phone}
            </DataTableCell>
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
              {/* Solo íconos; el nombre de cada acción aparece al pasar el mouse (y lo leen los lectores de pantalla). */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-600 hover:text-brand-700"
                      aria-label="Ver detalle"
                      onClick={() => onViewDetail(patient)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalle</TooltipContent>
                </Tooltip>
                {showClinical && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-600 hover:text-brand-700"
                      >
                        <Link
                          href={`/pacientes/${encodeURIComponent(patient.id)}/historia`}
                          aria-label="Historia clínica"
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
