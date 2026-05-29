"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { emptyStates } from "@/lib/empty-states";

interface DataLoadErrorProps {
  message?: string | null;
  onRetry: () => void;
}

export function DataLoadError({ message, onRetry }: DataLoadErrorProps) {
  const preset = emptyStates.global.loadError;

  return (
    <EmptyState
      icon={preset.icon}
      title={preset.title}
      description={message ?? preset.description}
      actionLabel="Reintentar"
      onAction={onRetry}
    />
  );
}
