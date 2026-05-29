import { fetchJson } from "@/lib/api/fetch-json";
import { appointmentToWriteInput } from "@/lib/db/appointment-write";
import type { Appointment, AppointmentStatus } from "@/types";

function toRequestBody(appointment: Appointment) {
  const input = appointmentToWriteInput(appointment);

  return {
    id: input.id,
    patientId: input.patientId,
    professionalId: input.professionalId,
    date: input.date,
    time: input.time,
    duration: String(input.duration),
    sessionType: input.sessionType,
    status: input.status,
    notes: input.notes ?? "",
  };
}

export async function fetchAppointments(): Promise<Appointment[]> {
  return fetchJson<Appointment[]>("/api/appointments");
}

export async function createAppointmentRequest(
  appointment: Appointment
): Promise<Appointment> {
  return fetchJson<Appointment>("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(appointment)),
  });
}

export async function updateAppointmentRequest(
  appointment: Appointment
): Promise<Appointment> {
  return fetchJson<Appointment>(`/api/appointments/${appointment.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(appointment)),
  });
}

export async function updateAppointmentStatusRequest(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  return fetchJson<Appointment>(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
