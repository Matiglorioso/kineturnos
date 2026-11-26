"use client";

import {
  createPatientRequest,
  fetchPatients,
  updatePatientRequest,
} from "@/lib/api/patients-client";
import { ApiError } from "@/lib/api/fetch-json";
import { getLoadErrorMessage } from "@/lib/api-error-message";
import { appToasts } from "@/lib/toast";
import type { Patient } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** `silent`: actualiza los datos sin mostrar la pantalla de carga (no cierra diálogos abiertos). */
  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPatients();
      setPatients(data);
    } catch (loadError) {
      setError(
        getLoadErrorMessage(loadError, "No se pudieron cargar los pacientes.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPatient = useCallback(async (patient: Patient) => {
    try {
      const created = await createPatientRequest(patient);
      setPatients((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      appToasts.patient.created(created.name);
      return created;
    } catch (saveError) {
      appToasts.patient.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const updatePatient = useCallback(async (patient: Patient, successToast = appToasts.patient.updated) => {
    try {
      const updated = await updatePatientRequest(patient);
      setPatients((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      successToast(updated.name);
      return updated;
    } catch (saveError) {
      appToasts.patient.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  return {
    patients,
    isLoading,
    error,
    refresh,
    createPatient,
    updatePatient,
  };
}
