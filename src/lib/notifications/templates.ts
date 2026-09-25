import { getAppointmentStatusLabel } from "@/lib/appointment-status";
import { formatAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { normalizeTime } from "@/lib/time-utils";
import type { AppointmentStatus } from "@/types";
import type { AppointmentNotificationType } from "./events";

/** Datos del turno guardados con la notificación (columna `datos`). */
export type AppointmentNotificationData = {
  patientName: string;
  professionalName: string;
  date: string;
  time: string;
  sessionType: string;
  status: AppointmentStatus;
  /** Solo en reprogramaciones: dónde estaba el turno antes. */
  previous?: { date: string; time: string; professionalName: string };
};

export type EmailContent = { subject: string; html: string; text: string };

function formatLongDate(date: string): string {
  const label = formatAppDate(date, "EEEE d 'de' MMMM 'de' yyyy");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatWhen(date: string, time: string): string {
  return `${formatLongDate(date)} a las ${normalizeTime(time)} h`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greetingName(patientName: string): string {
  return patientName.trim().split(/\s+/)[0] || patientName;
}

type Copy = { subject: string; intro: string; showDetails: boolean; closing: string };

function getCopy(
  type: AppointmentNotificationType,
  data: AppointmentNotificationData
): Copy {
  const when = formatWhen(data.date, data.time);
  const cancelHint =
    "Si no podés asistir, avisanos con anticipación para liberar el horario.";

  switch (type) {
    case "creacion":
      return {
        subject: `Tu turno en ${siteConfig.clinicName}: ${when}`,
        intro:
          data.status === "confirmado"
            ? "Tu turno quedó agendado y confirmado."
            : "Tu turno quedó agendado.",
        showDetails: true,
        closing: cancelHint,
      };
    case "confirmacion":
      return {
        subject: `Turno confirmado: ${when}`,
        intro: "Tu turno está confirmado.",
        showDetails: true,
        closing: cancelHint,
      };
    case "reprogramacion": {
      const before = data.previous
        ? ` Antes era el ${formatWhen(data.previous.date, data.previous.time)}` +
          (data.previous.professionalName !== data.professionalName
            ? ` con ${data.previous.professionalName}.`
            : ".")
        : "";
      return {
        subject: `Tu turno cambió: ${when}`,
        intro: `Reprogramamos tu turno.${before}`,
        showDetails: true,
        closing: cancelHint,
      };
    }
    case "cancelacion":
      return {
        subject: `Turno cancelado: ${when}`,
        intro: `Tu turno del ${when} con ${data.professionalName} fue cancelado.`,
        showDetails: false,
        closing: "Si querés un nuevo turno, comunicate con el consultorio.",
      };
    case "recordatorio":
      return {
        subject: `Recordatorio de tu turno: ${when}`,
        intro: "Te recordamos tu próximo turno.",
        showDetails: true,
        closing: cancelHint,
      };
  }
}

/** Arma asunto, HTML y texto plano del correo al paciente. */
export function buildAppointmentEmail(
  type: AppointmentNotificationType,
  data: AppointmentNotificationData
): EmailContent {
  const copy = getCopy(type, data);
  const details: [string, string][] = [
    ["Fecha", formatLongDate(data.date)],
    ["Hora", `${normalizeTime(data.time)} h`],
    ["Profesional", data.professionalName],
    ["Sesión", data.sessionType],
    ["Estado", getAppointmentStatusLabel(data.status)],
  ];
  const greeting = `Hola ${greetingName(data.patientName)}:`;
  const signature = `${siteConfig.clinicName}`;

  const text = [
    greeting,
    "",
    copy.intro,
    ...(copy.showDetails
      ? ["", ...details.map(([label, value]) => `${label}: ${value}`)]
      : []),
    "",
    copy.closing,
    "",
    signature,
  ].join("\n");

  const detailRows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${escapeHtml(label)}</td>` +
        `<td style="padding:4px 0;font-weight:600">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;max-width:520px">` +
    `<p>${escapeHtml(greeting)}</p>` +
    `<p>${escapeHtml(copy.intro)}</p>` +
    (copy.showDetails ? `<table style="border-collapse:collapse;margin:12px 0">${detailRows}</table>` : "") +
    `<p>${escapeHtml(copy.closing)}</p>` +
    `<p style="margin-top:24px;color:#64748b">${escapeHtml(signature)}</p>` +
    `</div>`;

  return { subject: copy.subject, html, text };
}
