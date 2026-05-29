"use client";

import {
  createProfessionalRequest,
  deleteProfessionalRequest,
  fetchProfessionals,
  updateProfessionalRequest,
} from "@/lib/api/professionals-client";
import { ApiError } from "@/lib/api/fetch-json";
import { appToasts } from "@/lib/toast";
import type { Professional } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProfessionals();
      setProfessionals(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los profesionales.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProfessional = useCallback(async (professional: Professional) => {
    try {
      const created = await createProfessionalRequest(professional);
      setProfessionals((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      appToasts.professional.created(created.name);
      return created;
    } catch (saveError) {
      appToasts.professional.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const updateProfessional = useCallback(async (professional: Professional) => {
    try {
      const updated = await updateProfessionalRequest(professional);
      setProfessionals((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      appToasts.professional.updated(updated.name);
      return updated;
    } catch (saveError) {
      appToasts.professional.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const deleteProfessional = useCallback(async (id: string) => {
    try {
      await deleteProfessionalRequest(id);
      setProfessionals((prev) => prev.filter((item) => item.id !== id));
    } catch (saveError) {
      appToasts.professional.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  return {
    professionals,
    isLoading,
    error,
    refresh,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  };
}
