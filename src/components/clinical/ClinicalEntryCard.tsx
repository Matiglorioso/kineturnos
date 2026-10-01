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

export function formatClinicalTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function editableLabel(editableUntil: string): string {
  const hours = Math.ceil((new Date(editableUntil).getTime() - Date.now()) / 3_600_000);
  if (hours <= 1) return "Editable por menos de 1 h";
  return `Editable ${hours} h más`;
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{text}</p>
    </div>
  );
}

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

  return (
    <li className={cn("relative pl-6 print:pl-0", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-5 h-3 w-3 -translate-x-[7px] rounded-full border-2 border-white ring-2 print:hidden",
          entry.editable ? "bg-brand-500 ring-brand-200" : "bg-slate-300 ring-slate-200"
        )}
      />
      <article
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none sm:p-5"
        aria-label={`Sesión ${sessionNumber}, ${entry.date}`}
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              Sesión {sessionNumber}
              <span className="font-normal text-muted-foreground">
                {" · "}
                <span className="capitalize">{formatAppDate(entry.date, "EEEE d/MM/yyyy")}</span>
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

        <div className="mt-4 space-y-3">
          {editing ? (
            <ClinicalEntryForm
              idPrefix={`edit-${entry.id}`}
              initial={{
                diagnosis: entry.diagnosis ?? "",
                treatment: entry.treatment ?? "",
                evolution: entry.evolution,
              }}
              submitLabel="Guardar corrección"
              onCancel={() => setEditing(false)}
              onSubmit={async (body) => {
                await onUpdate(entry, body);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <Section label="Evolución" text={entry.evolution} />
              {entry.diagnosis && <Section label="Diagnóstico" text={entry.diagnosis} />}
              {entry.treatment && <Section label="Plan de tratamiento" text={entry.treatment} />}
            </>
          )}
        </div>

        <footer className="mt-4 border-t border-slate-100 pt-3 text-xs text-muted-foreground">
          Registrado por {entry.authorName} el {formatClinicalTimestamp(entry.createdAt)}
          {edited && ` · corregido el ${formatClinicalTimestamp(entry.updatedAt)}`}
        </footer>
      </article>
    </li>
  );
}
