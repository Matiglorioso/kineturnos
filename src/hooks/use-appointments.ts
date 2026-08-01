"use client";

import {
  createAppointmentRequest,
  deleteAppointmentRequest,
  fetchAppointments,
  updateAppointmentRequest,
  updateAppointmentStatusRequest,
} from "@/lib/api/appointments-client";
import { ApiError } from "@/lib/api/fetch-json";
import { formatAppDate, formatTimeShort } from "@/lib/datetime-format";
import { getLoadErrorMessage } from "@/lib/api-error-message";
import { appToasts, showSuccessToast } from "@/lib/toast";
import { getAppointmentStatusLabel } from "@/lib/appointment-status";
import type { Appointment, AppointmentStatus } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (loadError) {
      setError(
        getLoadErrorMessage(loadError, "No se pudieron cargar los turnos.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sortAppointments = (items: Appointment[]) =>
    [...items].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  const createAppointment = useCallback(async (appointment: Appointment) => {
    try {
      const created = await createAppointmentRequest(appointment);
      setAppointments((prev) => sortAppointments([...prev, created]));
      appToasts.appointment.created(
        created.patientName,
        formatAppDate(created.date),
        formatTimeShort(created.time)
      );
      return created;
    } catch (saveError) {
      appToasts.appointment.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const updateAppointment = useCallback(async (appointment: Appointment) => {
    try {
      const updated = await updateAppointmentRequest(appointment);
      setAppointments((prev) =>
        sortAppointments(
          prev.map((item) => (item.id === updated.id ? updated : item))
        )
      );
      appToasts.appointment.updated(updated.patientName);
      return updated;
    } catch (saveError) {
      appToasts.appointment.saveError(
        saveError instanceof ApiError ? saveError.message : undefined
      );
      throw saveError;
    }
  }, []);

  const updateAppointmentStatus = useCallback(
    async (appointment: Appointment, status: AppointmentStatus) => {
      try {
        const updated = await updateAppointmentStatusRequest(
          appointment.id,
          status
        );
        setAppointments((prev) =>
          sortAppointments(
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        );

        switch (status) {
          case "cancelado":
            appToasts.appointment.cancelled(updated.patientName);
            break;
          case "atendido":
            appToasts.appointment.attended(updated.patientName);
            break;
          case "ausente":
            appToasts.appointment.absent(updated.patientName);
            break;
          default:
            showSuccessToast(
              "Estado actualizado",
              `Turno de ${updated.patientName} marcado como ${getAppointmentStatusLabel(status)}.`
            );
        }

        return updated;
      } catch (saveError) {
        appToasts.appointment.saveError(
          saveError instanceof ApiError ? saveError.message : undefined
        );
        throw saveError;
      }
    },
    []
  );

  const deleteAppointment = useCallback(async (appointment: Appointment) => {
    try {
      await deleteAppointmentRequest(appointment.id);
      setAppointments((prev) =>
        prev.filter((item) => item.id !== appointment.id)
      );
      appToasts.appointment.deleted(appointment.patientName);
    } catch (deleteError) {
      appToasts.appointment.deleteError(
        deleteError instanceof ApiError ? deleteError.message : undefined
      );
      throw deleteError;
    }
  }, []);

  return {
    appointments,
    isLoading,
    error,
    refresh,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  };
}

/** @deprecated Usar useAppointments */
export { useAppointments as useAppointmentsQuery };
