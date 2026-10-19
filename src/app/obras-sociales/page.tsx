"use client";

import { AttendanceReportView } from "@/components/insurances/AttendanceReportView";
import { AuthorizationsList } from "@/components/insurances/AuthorizationsList";
import { InsuranceCatalog } from "@/components/insurances/InsuranceCatalog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useInsurances } from "@/hooks/use-insurances";
import { pageMetadata } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ClipboardList, FileCheck2, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Tab = "autorizaciones" | "catalogo" | "planilla";

const TABS: { value: Tab; label: string; shortLabel: string; icon: typeof ShieldCheck }[] = [
  { value: "autorizaciones", label: "Autorizaciones", shortLabel: "Autorizaciones", icon: FileCheck2 },
  { value: "catalogo", label: "Catálogo", shortLabel: "Catálogo", icon: ShieldCheck },
  { value: "planilla", label: "Planilla mensual", shortLabel: "Planilla", icon: ClipboardList },
];

export default function ObrasSocialesPage() {
  const { insurances, isLoading, error, refresh } = useInsurances();
  const [tab, setTab] = useState<Tab>("autorizaciones");

  if (isLoading && insurances.length === 0) {
    return <PageLoadingState title="Obras sociales" />;
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader title="Obras sociales" description={pageMetadata.obrasSociales.description} />
      </div>

      <div
        role="tablist"
        aria-label="Secciones de obras sociales"
        className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-auto print:hidden"
      >
        {TABS.map(({ value, label, shortLabel, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "inline-flex min-w-0 flex-auto items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all sm:flex-none sm:gap-2 sm:px-4",
              tab === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
            <span className="truncate sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {error ? (
        <DataLoadError message={error} onRetry={() => void refresh()} />
      ) : tab === "autorizaciones" ? (
        <AuthorizationsList insurances={insurances} />
      ) : tab === "catalogo" ? (
        <InsuranceCatalog insurances={insurances} onChange={refresh} />
      ) : (
        <AttendanceReportView insurances={insurances} />
      )}
    </div>
  );
}
