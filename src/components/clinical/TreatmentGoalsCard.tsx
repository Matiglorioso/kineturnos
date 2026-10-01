"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/fetch-json";
import { CLINICAL_GOAL_MAX_LENGTH } from "@/lib/clinical-history";
import { cn } from "@/lib/utils";
import type { TreatmentGoal } from "@/types";
import { Plus, Target, X } from "lucide-react";
import { useState } from "react";

interface TreatmentGoalsCardProps {
  goals: TreatmentGoal[];
  canEdit: boolean;
  onAdd: (description: string) => Promise<void>;
  onToggle: (goal: TreatmentGoal) => Promise<void>;
  onRemove: (goal: TreatmentGoal) => Promise<void>;
}

export function TreatmentGoalsCard({ goals, canEdit, onAdd, onToggle, onRemove }: TreatmentGoalsCardProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const achieved = goals.filter((goal) => goal.achieved).length;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) {
      setError("Escribí el objetivo.");
      return;
    }
    void run(async () => {
      await onAdd(draft);
      setDraft("");
    });
  };

  return (
    <section
      aria-labelledby="objetivos-titulo"
      className="rounded-2xl border border-slate-200 bg-white p-4 print:break-inside-avoid"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="objetivos-titulo" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Target className="h-4 w-4 text-slate-500" />
          Objetivos del tratamiento
        </h2>
        {goals.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {achieved} de {goals.length} cumplidos
          </span>
        )}
      </div>

      {goals.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay objetivos cargados.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {goals.map((goal) => (
            <li key={goal.id} className="group flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id={`goal-${goal.id}`}
                checked={goal.achieved}
                disabled={!canEdit || busy}
                onChange={() => void run(() => onToggle(goal))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
              />
              <label
                htmlFor={`goal-${goal.id}`}
                className={cn("flex-1", goal.achieved ? "text-muted-foreground line-through" : "text-slate-800")}
              >
                {goal.description}
              </label>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Quitar objetivo: ${goal.description}`}
                  disabled={busy}
                  onClick={() => void run(() => onRemove(goal))}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-destructive focus:opacity-100 group-hover:opacity-100 print:hidden"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form onSubmit={add} className="mt-3 flex gap-2 print:hidden">
          <Input
            aria-label="Nuevo objetivo"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            placeholder="Volver a correr sin dolor"
            maxLength={CLINICAL_GOAL_MAX_LENGTH}
            className="h-9"
          />
          <Button type="submit" size="sm" variant="outline" disabled={busy} className="h-9 shrink-0">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </form>
      )}
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
