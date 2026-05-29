"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface DataLoadBannerProps {
  message: string;
  onRetry: () => void;
}

export function DataLoadBanner({ message, onRetry }: DataLoadBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5 text-sm text-amber-950">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>{message}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
