"use client";

import { AttendanceReportView } from "@/components/insurances/AttendanceReportView";
import { InsuranceCatalog } from "@/components/insurances/InsuranceCatalog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useInsurances } from "@/hooks/use-insurances";
import { pageMetadata } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Tab = "catalogo" | "planilla";

const TABS: { value: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { value: "catalogo", label: "Catálogo", icon: ShieldCheck },
  { value: "planilla", label: "Planilla mensual", icon: ClipboardList },
];

export default function ObrasSocialesPage() {
  const { insurances, isLoading, error, refresh } = useInsurances();
  const [tab, setTab] = useState<Tab>("catalogo");

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
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all sm:flex-none",
              tab === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <DataLoadError message={error} onRetry={() => void refresh()} />
      ) : tab === "catalogo" ? (
        <InsuranceCatalog insurances={insurances} onChange={refresh} />
      ) : (
        <AttendanceReportView insurances={insurances} />
      )}
    </div>
  );
}
