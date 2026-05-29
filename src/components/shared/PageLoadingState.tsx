import { PageHeader } from "@/components/ui/PageHeader";

interface PageLoadingStateProps {
  title: string;
  description?: string;
}

export function PageLoadingState({
  title,
  description = "Conectando con la base de datos...",
}: PageLoadingStateProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        Cargando...
      </div>
    </div>
  );
}
