import { createHmac, timingSafeEqual } from "node:crypto";
import { isActiveAppointmentStatus } from "@/lib/appointment-status";
import { areSameAppDay, getNowAppMinutes, getTodayAppDate, parseAppDate } from "@/lib/date-utils";
import { normalizeTime, timeToMinutes } from "@/lib/time-utils";
import type { AppointmentStatus } from "@/types";

/**
 * Enlaces de los correos para que el paciente confirme o cancele su turno sin
 * iniciar sesión. El enlace lleva el turno con su fecha y hora, firmado con
 * HMAC: no se puede armar ni modificar sin el secreto, y si el turno se
 * reprograma deja de servir (el correo nuevo trae otro).
 */

/** Hasta cuántas horas antes del turno el paciente puede cancelarlo desde el correo. */
export const PATIENT_CANCEL_MIN_HOURS_BEFORE = 2;

export type PatientLinkAction = "confirmar" | "cancelar";

export type AppointmentLinkSlot = { appointmentId: string; date: string; time: string };

/** Secreto de firma: deriva del de la sesión (AUTH_SECRET), sin variable nueva. */
export function getAppointmentLinkSecret(env: Record<string, string | undefined> = process.env): string | null {
  const base = env.AUTH_SECRET?.trim();
  return base ? `${base}:enlaces-de-turno` : null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAppointmentLinkToken(slot: AppointmentLinkSlot, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ a: slot.appointmentId, d: slot.date, t: normalizeTime(slot.time) })
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** El turno del enlace, o null si el enlace está mal armado o la firma no coincide. */
export function verifyAppointmentLinkToken(token: string, secret: string): AppointmentLinkSlot | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof data.a !== "string" || typeof data.d !== "string" || typeof data.t !== "string") return null;
    return { appointmentId: data.a, date: data.d, time: data.t };
  } catch {
    return null;
  }
}

export function buildAppointmentLinkUrls(
  baseUrl: string,
  token: string,
  status: AppointmentStatus
): { confirmUrl?: string; cancelUrl: string } {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    // Un turno ya confirmado solo ofrece cancelar.
    ...(status === "pendiente" ? { confirmUrl: `${base}/turno/${token}/confirmar` } : {}),
    cancelUrl: `${base}/turno/${token}/cancelar`,
  };
}

/** Minutos que faltan para que empiece el turno, con la hora del consultorio. */
export function minutesUntilAppointment(date: string, time: string, now: Date): number {
  const day = parseAppDate(date);
  const today = parseAppDate(getTodayAppDate(now));
  if (!day || !today) return Number.NEGATIVE_INFINITY;
  const days = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  return days * 24 * 60 + timeToMinutes(normalizeTime(time)) - getNowAppMinutes(now);
}

export type PatientLinkOutcome =
  /** Se puede hacer la acción. */
  | "disponible"
  | "ya-confirmado"
  | "cancelado"
  /** El turno se reprogramó: el enlace es de un correo anterior. */
  | "turno-modificado"
  /** Ya pasó (atendido, ausente o la hora del turno). */
  | "finalizado"
  /** Faltan menos de 2 horas: para cancelar hay que comunicarse con el consultorio. */
  | "fuera-de-plazo";

/** Qué pasa si el paciente usa el enlace ahora. */
export function evaluatePatientLink(
  appointment: { date: string; time: string; status: AppointmentStatus },
  slot: AppointmentLinkSlot,
  action: PatientLinkAction,
  now: Date
): PatientLinkOutcome {
  if (appointment.status === "cancelado") return "cancelado";
  if (!isActiveAppointmentStatus(appointment.status)) return "finalizado";
  if (!areSameAppDay(appointment.date, slot.date) || normalizeTime(appointment.time) !== normalizeTime(slot.time)) {
    return "turno-modificado";
  }
  const minutesLeft = minutesUntilAppointment(appointment.date, appointment.time, now);
  if (minutesLeft <= 0) return "finalizado";
  if (action === "confirmar") {
    return appointment.status === "confirmado" ? "ya-confirmado" : "disponible";
  }
  return minutesLeft < PATIENT_CANCEL_MIN_HOURS_BEFORE * 60 ? "fuera-de-plazo" : "disponible";
}
