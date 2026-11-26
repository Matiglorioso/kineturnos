"use client";

import { ClinicalEntryForm } from "@/components/clinical/ClinicalEntryForm";
import { Button } from "@/components/ui/button";
import type { ClinicalEntryRequest } from "@/lib/api/clinical-history-client";
import { formatAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { ClinicalEntry } from "@/types";
import { CalendarCheck, Lock, Pencil } from "lucide-react";
import { useState } from "react";

interface ClinicalEntryCardProps {
  entry: ClinicalEntry;
  sessionNumber: number;
  className?: string;
  onUpdate: (entry: ClinicalEntry, body: ClinicalEntryRequest) => Promise<void>;
}

const TIME_ZONE = "America/Argentina/Buenos_Aires";

export function formatClinicalTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(/\//g, "-");
}

/** "20-11 18:07" (con el año si no es el actual): cuándo se registró, en la computadora. */
function formatShortTimestamp(iso: string): string {
  const date = new Date(iso);
  const sameYear =
    new Intl.DateTimeFormat("es-AR", { timeZone: TIME_ZONE, year: "numeric" }).format(date) ===
    new Intl.DateTimeFormat("es-AR", { timeZone: TIME_ZONE, year: "numeric" }).format(new Date());
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(/\//g, "-")
    .replace(",", "");
}

/** "lun" (con el año si no es el actual), debajo de la fecha de la sesión. */
function sessionWeekday(date: string): string {
  const weekday = formatAppDate(date, "EEE").replace(".", "").toLowerCase();
  const year = date.slice(-4);
  return year === String(new Date().getFullYear()) ? weekday : `${weekday} ${year}`;
}

function editableLabel(editableUntil: string): string {
  const hours = Math.ceil((new Date(editableUntil).getTime() - Date.now()) / 3_600_000);
  if (hours <= 1) return "Editable por menos de 1 h";
  return `Editable ${hours} h más`;
}

function Section({ label, text, hideLabelOnDesktop = false }: { label: string; text: string; hideLabelOnDesktop?: boolean }) {
  return (
    <div>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide text-muted-foreground lg:text-[12px] lg:font-semibold lg:normal-case lg:tracking-normal lg:text-slate-600",
          hideLabelOnDesktop && "lg:sr-only"
        )}
      >
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 lg:mt-0.5 lg:leading-normal">{text}</p>
    </div>
  );
}

/**
 * Una sesión de la historia clínica. En el celular, una tarjeta; en la computadora, un
 * renglón compacto de la lista: fecha de la sesión a la izquierda, profesional y registro
 * arriba del texto.
 */
export function ClinicalEntryCard({
  entry,
  sessionNumber,
  className,
  onUpdate,
}: ClinicalEntryCardProps) {
  const [editing, setEditing] = useState(false);
  // creado_en lo pone la base y actualizado_en Prisma: difieren unos milisegundos al crear.
  const edited =
    new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000;
  const registeredBy =
    entry.authorName && entry.authorName !== entry.professionalName ? `Reg. por ${entry.authorName}` : "Reg.";

  return (
    <li className={cn("relative print:pl-0", className)}>
      <article
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none sm:p-5 lg:grid lg:grid-cols-[6.5rem_1fr] lg:rounded-none lg:border-0 lg:p-0 lg:shadow-none"
        aria-label={`Sesión ${sessionNumber}, ${entry.date}`}
      >
        {/* Computadora: la fecha de la sesión, a la izquierda. */}
        <div className="hidden border-r border-slate-100 px-4 py-3 lg:block">
          <p className="text-sm font-semibold text-slate-900">{formatAppDate(entry.date, "d MMM").replace(".", "")}</p>
          <p className="text-xs text-muted-foreground">{sessionWeekday(entry.date)}</p>
          <p className="text-xs text-muted-foreground">Sesión {sessionNumber}</p>
        </div>

        <div className="min-w-0 lg:px-4 lg:py-3">
          {/* Celular: encabezado de la tarjeta (como estaba). */}
          <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between lg:hidden">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900">
                Sesión {sessionNumber}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  <span className="capitalize">{formatAppDate(entry.date, "EEEE dd-MM-yyyy")}</span>
                </span>
              </h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{entry.professionalName ?? "Sin profesional asignado"}</span>
                {entry.appointmentId && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Turno de la agenda
                  </span>
                )}
                {entry.editable && entry.editableUntil ? (
                  <span className="inline-flex items-center gap-1 text-brand-700">
                    <Pencil className="h-3.5 w-3.5" />
                    {editableLabel(entry.editableUntil)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    Cerrado
                  </span>
                )}
              </p>
            </div>
            {entry.editable && !editing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Corregir
              </Button>
            )}
          </header>

          {/* Computadora: profesional a la izquierda; registro (y corregir) a la derecha. */}
          <div className="hidden items-center justify-between gap-3 text-xs text-muted-foreground lg:flex">
            <span className="min-w-0 truncate">
              <span className="font-semibold text-slate-700">{entry.professionalName ?? "Sin profesional asignado"}</span>
              {entry.editable && entry.editableUntil && (
                <span className="text-brand-700"> · {editableLabel(entry.editableUntil)}</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span title={`Registrado por ${entry.authorName} el ${formatClinicalTimestamp(entry.createdAt)}`}>
                {registeredBy} {formatShortTimestamp(entry.createdAt)}
                {edited && ` · corregido ${formatShortTimestamp(entry.updatedAt)}`}
              </span>
              {entry.editable && !editing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-brand-700 print:hidden"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Corregir
                </Button>
              )}
            </span>
          </div>

          <div className="mt-4 space-y-3 lg:mt-1 lg:space-y-1.5">
            {editing ? (
              <ClinicalEntryForm
                idPrefix={`edit-${entry.id}`}
                initialEvolution={entry.evolution}
                submitLabel="Guardar corrección"
                onCancel={() => setEditing(false)}
                onSubmit={async (body) => {
                  await onUpdate(entry, body);
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <Section label="Evolución" text={entry.evolution} hideLabelOnDesktop />
                {entry.diagnosis && <Section label="Diagnóstico" text={entry.diagnosis} />}
                {entry.treatment && <Section label="Plan de tratamiento" text={entry.treatment} />}
              </>
            )}
          </div>

          <footer className="mt-4 border-t border-slate-100 pt-3 text-xs text-muted-foreground lg:hidden">
            Registrado por {entry.authorName} el {formatClinicalTimestamp(entry.createdAt)}
            {edited && ` · corregido el ${formatClinicalTimestamp(entry.updatedAt)}`}
          </footer>
        </div>
      </article>
    </li>
  );
}
