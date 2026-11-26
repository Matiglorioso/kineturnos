"use client";

import { StatusBadge } from "@/components/appointments/StatusBadge";
import { MobileRow } from "@/components/patients/PatientCoverageSection";
import { Badge } from "@/components/ui/badge";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { formatAppDate } from "@/lib/date-utils";
import { readableAvatarColor } from "@/lib/professional-utils";
import { cn, getInitials } from "@/lib/utils";
import type { Appointment, Professional } from "@/types";
import { ChevronLeft, MoreHorizontal, Pencil, Trash2, UserCog, UserX } from "lucide-react";
import Link from "next/link";

interface ProfessionalDetailMobileProps {
  professional: Professional;
  upcoming: Appointment[];
  onDeleteRequest?: (professional: Professional) => void;
  onEdit?: (professional: Professional) => void;
  onToggleActive?: (professional: Professional) => void;
}

/** Ficha del profesional en el celular: mismo esquema que la del paciente (pantalla completa, "⋯"). */
export function ProfessionalDetailMobile({
  professional,
  upcoming,
  onDeleteRequest,
  onEdit,
  onToggleActive,
}: ProfessionalDetailMobileProps) {
  const { can } = usePermissions();
  const canManageAccess = can("users:manage");
  const hasMenu = Boolean(onEdit || onToggleActive || onDeleteRequest || canManageAccess);

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <DialogClose className="-ml-1 flex h-10 items-center gap-0.5 rounded-lg px-1 text-[15px] font-semibold text-brand-800">
          <ChevronLeft className="h-5 w-5" />
          Profesionales
        </DialogClose>
        {hasMenu && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              aria-label="Más acciones"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(professional)}>
                  <Pencil className="h-4 w-4" />
                  Editar profesional
                </DropdownMenuItem>
              )}
              {onToggleActive && (
                <DropdownMenuItem onSelect={() => onToggleActive(professional)}>
                  <UserX className="h-4 w-4" />
                  {professional.active ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              )}
              {canManageAccess && (
                <DropdownMenuItem asChild>
                  {/* Abre su usuario si ya tiene, o el alta con este profesional elegido. */}
                  <Link href={`/usuarios?profesional=${encodeURIComponent(professional.id)}`}>
                    <UserCog className="h-4 w-4" />
                    Acceso al sistema
                  </Link>
                </DropdownMenuItem>
              )}
              {onDeleteRequest && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => onDeleteRequest(professional)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar profesional
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pb-3 pt-2">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
            readableAvatarColor(professional.avatarColor)
          )}
        >
          {getInitials(professional.name)}
        </div>
        <div className="min-w-0">
          <DialogTitle className="truncate text-left text-[19px] font-bold leading-tight">{professional.name}</DialogTitle>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant={professional.active ? "success" : "neutral"} className="py-0.5 text-[11px]">
              {professional.active ? "Activo" : "Inactivo"}
            </Badge>
            <DialogDescription className="truncate text-xs">{professional.specialty}</DialogDescription>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <dl className="rounded-2xl border border-slate-200/80 bg-white">
          {professional.license && <MobileRow label="Matrícula">{professional.license}</MobileRow>}
          {professional.phone && (
            <MobileRow label="Teléfono">
              <a href={`tel:${professional.phone.replace(/[^\d+]/g, "")}`} className="text-brand-800">
                {professional.phone}
              </a>
            </MobileRow>
          )}
          {professional.email && <MobileRow label="Email">{professional.email}</MobileRow>}
          <MobileRow label="Días">{professional.days.map((day) => day.slice(0, 3)).join(" · ")}</MobileRow>
          {professional.notes?.trim() && <MobileRow label="Observaciones">{professional.notes.trim()}</MobileRow>}
        </dl>

        <p className="mx-1 mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-wide text-brand-800">Próximos turnos</p>
        {upcoming.length === 0 ? (
          <p className="mx-1 text-xs text-muted-foreground">No tiene turnos próximos.</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="flex min-h-[52px] items-center gap-2.5 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-slate-900">
                    {formatAppDate(appointment.date, "EEE dd-MM").replace(".", "")} · {appointment.time}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {appointment.patientName} · {appointment.sessionType}
                  </p>
                </div>
                <StatusBadge status={appointment.status} showIcon={false} className="shrink-0 py-0.5 text-[11px]" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
