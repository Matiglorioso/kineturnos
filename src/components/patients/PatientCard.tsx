import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types";
import { cn, getInitials } from "@/lib/utils";
import { formatAppDate } from "@/lib/date-utils";
import { Eye, UserX } from "lucide-react";

interface PatientCardProps {
  patient: Patient;
  onViewDetail: (patient: Patient) => void;
  onToggleStatus?: (patient: Patient) => void;
  className?: string;
}

export function PatientCard({
  patient,
  onViewDetail,
  onToggleStatus,
  className,
}: PatientCardProps) {
  return (
    <div
      className={cn(
        "surface-card p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700">
            {getInitials(patient.name)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{patient.name}</h3>
            <p className="text-xs text-muted-foreground">{patient.dni}</p>
          </div>
        </div>
        <PatientStatusBadge active={patient.status === "activo"} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:block sm:space-y-2">
        <p className="truncate">{patient.phone}</p>
        <p className="truncate">{patient.insurance}</p>
        <p className="col-span-2 text-xs text-muted-foreground">
          Ultimo turno:{" "}
          {patient.lastAppointment
            ? formatAppDate(patient.lastAppointment)
            : "Sin turnos"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewDetail(patient)}
        >
          <Eye className="h-4 w-4" />
          Ver detalle
        </Button>
        {onToggleStatus && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onToggleStatus(patient)}
          >
            <UserX className="h-4 w-4" />
            {patient.status === "activo" ? "Desactivar" : "Activar"}
          </Button>
        )}
      </div>
    </div>
  );
}
