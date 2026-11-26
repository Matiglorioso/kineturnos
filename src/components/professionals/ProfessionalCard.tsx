import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Professional } from "@/types";
import { Calendar, Stethoscope } from "lucide-react";
import { readableAvatarColor } from "@/lib/professional-utils";

interface ProfessionalCardProps {
  professional: Professional;
  onViewDetail: (professional: Professional) => void;
  className?: string;
}

export function ProfessionalCard({
  professional,
  onViewDetail,
  className,
}: ProfessionalCardProps) {

  return (
    <Card
      // Toda la tarjeta abre la ficha; el nombre es el botón para el teclado y los lectores.
      onClick={() => onViewDetail(professional)}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:shadow-elevated",
        !professional.active && "opacity-80",
        className
      )}
    >
      <div className="relative flex-1 p-5">

        <div className="relative flex items-stretch gap-3">
          <span aria-hidden className={cn("w-1 shrink-0 self-stretch rounded-sm", readableAvatarColor(professional.avatarColor))} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900">
                  <button
                    type="button"
                    className="rounded text-left hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Ver detalle de ${professional.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewDetail(professional);
                    }}
                  >
                    {professional.name}
                  </button>
                </h2>
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

        <div className="relative mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-start gap-2.5 text-sm">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Días de atención
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

        </div>
      </div>

    </Card>
  );
}
