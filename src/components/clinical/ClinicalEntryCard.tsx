"use client";

import { ClinicalEntryForm } from "@/components/clinical/ClinicalEntryForm";
import { Button } from "@/components/ui/button";
import type { ClinicalEntryRequest } from "@/lib/api/clinical-history-client";
import { formatAppDate } from "@/lib/date-utils";
import type { ClinicalEntry } from "@/types";
import { CalendarCheck, Pencil } from "lucide-react";
import { useState } from "react";

interface ClinicalEntryCardProps {
  entry: ClinicalEntry;
  onUpdate: (entry: ClinicalEntry, body: ClinicalEntryRequest) => Promise<void>;
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{text}</p>
    </div>
  );
}

export function ClinicalEntryCard({ entry, onUpdate }: ClinicalEntryCardProps) {
  const [editing, setEditing] = useState(false);
  // creado_en lo pone la base y actualizado_en Prisma: difieren unos milisegundos al crear.
  const edited =
    new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000;

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label={`Registro del ${entry.date}`}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold capitalize text-slate-900">
            {formatAppDate(entry.date, "EEEE d 'de' MMMM 'de' yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {entry.professionalName ?? "Sin profesional asignado"}
            {entry.appointmentId && (
              <span className="ml-2 inline-flex items-center gap-1 text-brand-700">
                <CalendarCheck className="h-3.5 w-3.5" />
                Sesión de un turno
              </span>
            )}
          </p>
        </div>
        {entry.editable && !editing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
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
        Registrado por {entry.authorName} el {formatTimestamp(entry.createdAt)}
        {edited && ` · corregido el ${formatTimestamp(entry.updatedAt)}`}
      </footer>
    </article>
  );
}
