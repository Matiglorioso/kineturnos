"use client";

import {
  createPatientRequest,
  deletePatientRequest,
  fetchPatients,
  updatePatientRequest,
} from "@/lib/api/patients-client";
import { ApiError } from "@/lib/api/fetch-json";
import { appToasts } from "@/lib/toast";
import type { Patient } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPatients();
      setPatients(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los pacientes.";
      setError(message);
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

  const updatePatient = useCallback(async (patient: Patient) => {
    try {
      const updated = await updatePatientRequest(patient);
      setPatients((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      appToasts.patient.updated(updated.name);
      return updated;
    } catch (saveError) {
      appToasts.patient.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    try {
      await deletePatientRequest(id);
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
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
    deletePatient,
  };
}
