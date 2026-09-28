"use client";

import { Button } from "@/components/ui/button";
import { fetchClinicalAccessLog } from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import type { ClinicalAccessLogItem } from "@/types";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

const ACTION_LABELS: Record<ClinicalAccessLogItem["action"], string> = {
  lectura: "Consultó la historia",
  alta: "Registró una sesión",
  edicion: "Corrigió un registro",
};

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

/** Trazabilidad (RNF07): quién y cuándo consultó o modificó la historia clínica. */
export function ClinicalAccessLog({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<ClinicalAccessLogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchClinicalAccessLog(patientId));
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-dashed border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Registro de accesos</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Cargando..." : items ? "Actualizar" : "Ver accesos"}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Quién consultó o modificó esta historia clínica, y cuándo.
      </p>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {items && (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {items.length === 0 && <li className="py-2 text-muted-foreground">Sin accesos registrados.</li>}
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between">
              <span>
                <span className="font-medium text-slate-800">{item.userName}</span>{" "}
                <span className="text-muted-foreground">({item.userRole})</span> ·{" "}
                {ACTION_LABELS[item.action]}
              </span>
              <span className="text-muted-foreground">{formatTimestamp(item.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
