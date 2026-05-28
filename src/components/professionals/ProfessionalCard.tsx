import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfessionalScheduleLabel } from "@/lib/professional-utils";
import { cn, getInitials } from "@/lib/utils";
import { Professional } from "@/types";
import { Calendar, Clock, Eye, Pencil, Stethoscope, UserX } from "lucide-react";

interface ProfessionalCardProps {
  professional: Professional;
  todayAppointments: number;
  onViewDetail: (professional: Professional) => void;
  onEdit: (professional: Professional) => void;
  onToggleActive: (professional: Professional) => void;
  className?: string;
}

export function ProfessionalCard({
  professional,
  todayAppointments,
  onViewDetail,
  onEdit,
  onToggleActive,
  className,
}: ProfessionalCardProps) {
  const scheduleLabel = getProfessionalScheduleLabel(professional);

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-elevated",
        !professional.active && "opacity-80",
        className
      )}
    >
      <div className="relative flex-1 p-6">
        <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-50 opacity-60 transition-transform group-hover:scale-110" />

        <div className="relative flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm",
              professional.avatarColor
            )}
          >
            {getInitials(professional.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {professional.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {professional.specialty}
                </p>
              </div>
              <Badge variant={professional.active ? "success" : "neutral"}>
                {professional.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="relative mt-6 space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-start gap-2.5 text-sm">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dias de atencion
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {professional.days.map((day) => (
                  <span
                    key={day}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {day.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Horario
              </p>
              <p className="mt-0.5 font-medium text-slate-700">{scheduleLabel}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-4 py-3">
            <span className="text-sm text-brand-700">Turnos hoy</span>
            <span className="text-xl font-bold text-brand-800">
              {todayAppointments}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-muted/20 p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewDetail(professional)}
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="truncate">Ver detalle</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onEdit(professional)}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 w-full text-muted-foreground"
          onClick={() => onToggleActive(professional)}
        >
          <UserX className="h-4 w-4" />
          {professional.active ? "Desactivar" : "Activar"}
        </Button>
      </div>
    </Card>
  );
}
