"use client";

import { fetchInsurances } from "@/lib/api/insurances-client";
import { getLoadErrorMessage } from "@/lib/api-error-message";
import type { Insurance } from "@/types";
import { useCallback, useEffect, useState } from "react";

/** Catálogo de obras sociales (para el formulario del paciente y la pantalla de obras sociales). */
export function useInsurances(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setInsurances(await fetchInsurances());
    } catch (loadError) {
      setError(getLoadErrorMessage(loadError, "No se pudieron cargar las obras sociales."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { insurances, isLoading, error, refresh, setInsurances };
}
