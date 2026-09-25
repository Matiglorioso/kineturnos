import { randomUUID } from "node:crypto";
import { mapAppointment } from "@/lib/db/mappers";
import {
  getAppointmentNotificationEvents,
  getReminderKey,
  getReminderWindow,
  type AppointmentNotificationType,
} from "@/lib/notifications/events";
import { sendEmail, type MailerConfig, getMailerConfig } from "@/lib/notifications/mailer";
import {
  buildAppointmentEmail,
  type AppointmentNotificationData,
} from "@/lib/notifications/templates";
import { prisma, type DbClient } from "@/lib/prisma";
import type { Appointment } from "@/types";
import { Prisma } from "@prisma/client";

/** Reintentos máximos de un correo que falló. */
export const MAX_NOTIFICATION_ATTEMPTS = 3;
/** Un envío que quedó "enviando" más que esto se considera colgado y se reintenta. */
const STUCK_SENDING_MS = 10 * 60 * 1000;

export const PATIENT_WITHOUT_EMAIL_ERROR = "El paciente no tiene email cargado.";

export type NotifiedAppointment = { appointment: Appointment; patientEmail: string | null };

function toNotificationData(
  appointment: Appointment,
  previous?: Appointment
): AppointmentNotificationData {
  return {
    patientName: appointment.patientName,
    professionalName: appointment.professionalName,
    date: appointment.date,
    time: appointment.time,
    sessionType: appointment.sessionType,
    status: appointment.status,
    ...(previous
      ? {
          previous: {
            date: previous.date,
            time: previous.time,
            professionalName: previous.professionalName,
          },
        }
      : {}),
  };
}

function newNotificationRow(
  type: AppointmentNotificationType,
  target: NotifiedAppointment,
  data: AppointmentNotificationData,
  clave?: string
): Prisma.NotificacionCreateManyInput {
  const email = target.patientEmail?.trim() || null;
  return {
    id: `ntf_${randomUUID()}`,
    turnoId: target.appointment.id,
    tipo: type,
    estado: email ? "pendiente" : "omitida",
    destinatario: email,
    datos: data as unknown as Prisma.InputJsonValue,
    clave: clave ?? null,
    error: email ? null : PATIENT_WITHOUT_EMAIL_ERROR,
  };
}

/**
 * Encola los correos que corresponden a una escritura de turno, dentro de la
 * misma transacción: si la escritura se revierte, no queda ningún aviso.
 * Devuelve los ids pendientes de envío.
 */
export async function enqueueAppointmentNotifications(
  db: DbClient,
  previous: NotifiedAppointment | null,
  next: NotifiedAppointment
): Promise<string[]> {
  const events = getAppointmentNotificationEvents(
    previous?.appointment ?? null,
    next.appointment
  );
  if (events.length === 0) return [];

  const rows = events.map(({ type, target }) => {
    if (target === "previous" && previous) {
      return newNotificationRow(type, previous, toNotificationData(previous.appointment));
    }
    const data =
      type === "reprogramacion" && previous
        ? toNotificationData(next.appointment, previous.appointment)
        : toNotificationData(next.appointment);
    return newNotificationRow(type, next, data);
  });

  await db.notificacion.createMany({ data: rows });
  return rows.filter((row) => row.estado === "pendiente").map((row) => row.id as string);
}

/**
 * Encola un recordatorio para cada turno activo que empieza dentro de la
 * ventana (entre 2 y 24 h desde `now`). La clave única evita repetirlo.
 * La fecha y hora del turno son del consultorio (hora argentina).
 */
export async function enqueueDueReminders(now: Date = new Date()): Promise<number> {
  const { from, to } = getReminderWindow(now);
  const due = await prisma.$queryRaw<{ id: string }[]>`
    SELECT t.id
    FROM turnos t
    WHERE t.estado IN ('pendiente', 'confirmado')
      AND ((t.fecha + t.hora) AT TIME ZONE 'America/Argentina/Buenos_Aires') > ${from.toISOString()}::timestamptz
      AND ((t.fecha + t.hora) AT TIME ZONE 'America/Argentina/Buenos_Aires') <= ${to.toISOString()}::timestamptz
  `;
  if (due.length === 0) return 0;

  const records = await prisma.turno.findMany({
    where: { id: { in: due.map((row) => row.id) } },
    include: { paciente: { select: { email: true } } },
  });

  const rows = records.map((record) => {
    const appointment = mapAppointment(record);
    return newNotificationRow(
      "recordatorio",
      { appointment, patientEmail: record.paciente.email },
      toNotificationData(appointment),
      getReminderKey(appointment.id, appointment.date, appointment.time)
    );
  });

  const created = await prisma.notificacion.createMany({ data: rows, skipDuplicates: true });
  return created.count;
}

export type DispatchSummary = { enviadas: number; fallidas: number; omitidas: number };

function retryableWhere(now: Date): Prisma.NotificacionWhereInput {
  return {
    OR: [
      { estado: "pendiente" },
      { estado: "fallida", intentos: { lt: MAX_NOTIFICATION_ATTEMPTS } },
      {
        estado: "enviando",
        intentos: { lt: MAX_NOTIFICATION_ATTEMPTS },
        actualizadaEn: { lt: new Date(now.getTime() - STUCK_SENDING_MS) },
      },
    ],
  };
}

/**
 * Envía las notificaciones indicadas (o todas las pendientes/reintentables).
 * Cada una se "reclama" con un update condicional antes de mandarla, así el
 * envío inmediato y el cron no mandan dos veces el mismo correo.
 */
export async function dispatchNotifications(
  options: {
    ids?: string[];
    now?: Date;
    limit?: number;
    config?: MailerConfig | null;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<DispatchSummary> {
  const now = options.now ?? new Date();
  const config = options.config === undefined ? getMailerConfig() : options.config;
  const summary: DispatchSummary = { enviadas: 0, fallidas: 0, omitidas: 0 };

  const candidates = await prisma.notificacion.findMany({
    where: {
      ...(options.ids ? { id: { in: options.ids } } : {}),
      ...retryableWhere(now),
    },
    orderBy: { creadaEn: "asc" },
    take: options.limit ?? 50,
  });

  for (const candidate of candidates) {
    const claimed = await prisma.notificacion.updateMany({
      where: { id: candidate.id, ...retryableWhere(now) },
      data: { estado: "enviando", intentos: { increment: 1 } },
    });
    if (claimed.count === 0) continue;

    const data = candidate.datos as unknown as AppointmentNotificationData;
    const result = candidate.destinatario
      ? await sendEmail(
          {
            ...buildAppointmentEmail(candidate.tipo, data),
            to: candidate.destinatario,
            toName: data.patientName,
          },
          config,
          options.fetchImpl
        )
      : ({ status: "omitida", error: PATIENT_WITHOUT_EMAIL_ERROR } as const);

    await prisma.notificacion.update({
      where: { id: candidate.id },
      data: {
        estado: result.status,
        error: result.status === "enviada" ? null : result.error,
        enviadaEn: result.status === "enviada" ? new Date() : null,
      },
    });

    if (result.status === "enviada") summary.enviadas += 1;
    else if (result.status === "fallida") summary.fallidas += 1;
    else summary.omitidas += 1;

    if (result.status === "fallida") {
      console.error(`Notificación ${candidate.id} (${candidate.tipo}) falló:`, result.error);
    }
  }

  return summary;
}
