import { cn } from "@/lib/utils";
import type { PatientCoverage } from "@/types";

const SHORT_LABELS: Record<PatientCoverage["kind"], string> = {
  particular: "Particular",
  "sin-autorizacion": "Sin autorización",
  pendiente: "En trámite",
  vigente: "Vigente",
  agotada: "Agotada",
  vencida: "Vencida",
};

const TONE_STYLES: Record<Exclude<PatientCoverage["tone"], "none">, string> = {
  ok: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  alert: "bg-red-50 text-red-700",
};

/** Estado de la autorización de la obra social (no se muestra para particulares). */
export function CoverageBadge({
  coverage,
  className,
  size = "sm",
  short = false,
  onlyIssues = false,
}: {
  coverage?: PatientCoverage;
  className?: string;
  size?: "xs" | "sm";
  /** Texto corto ("Agotada"); el detalle queda como tooltip. */
  short?: boolean;
  /** Solo se muestra si hay algo para avisar (ámbar o rojo). */
  onlyIssues?: boolean;
}) {
  if (!coverage || coverage.tone === "none") return null;
  if (onlyIssues && coverage.tone === "ok") return null;
  return (
    <span
      title={short ? coverage.label : undefined}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full font-semibold lg:rounded",
        size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        TONE_STYLES[coverage.tone],
        className
      )}
    >
      <span className="truncate">
        {!short
          ? coverage.label
          : coverage.kind === "vigente" && coverage.tone === "warning"
            ? "Por renovar"
            : SHORT_LABELS[coverage.kind]}
      </span>
      {short && <span className="sr-only">: {coverage.label}</span>}
    </span>
  );
}
