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

/** Enlaces para que el paciente confirme o cancele desde el correo (alta y recordatorio). */
export type AppointmentEmailLinks = { confirmUrl?: string; cancelUrl: string };

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

/** `heading`: título del encabezado del correo. */
type Copy = { subject: string; heading: string; intro: string; showDetails: boolean; closing: string };

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
        heading: "Turno agendado",
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
        heading: "Turno confirmado",
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
        heading: "Turno reprogramado",
        intro: `Reprogramamos tu turno.${before}`,
        showDetails: true,
        closing: cancelHint,
      };
    }
    case "cancelacion":
      return {
        subject: `Turno cancelado: ${when}`,
        heading: "Turno cancelado",
        intro: `Tu turno del ${when} con ${data.professionalName} fue cancelado.`,
        showDetails: false,
        closing: "Si querés un nuevo turno, comunicate con el consultorio.",
      };
    case "recordatorio":
      return {
        subject: `Recordatorio de tu turno: ${when}`,
        heading: "Recordatorio de turno",
        intro: "Te recordamos tu próximo turno.",
        showDetails: true,
        closing: cancelHint,
      };
  }
}

/** Colores de KineTurnos (brand de Tailwind) para que el correo se vea como la app. */
const COLORS = {
  brand: "#0f766e",
  brandDark: "#115e59",
  brandSoft: "#f0fdfa",
  brandBorder: "#ccfbf1",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  page: "#f1f5f9",
  danger: "#b91c1c",
  dangerBorder: "#fecaca",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Botón compatible con los clientes de correo (tabla + enlace, sin CSS externo). */
function button(href: string, label: string, primary: boolean): string {
  const style = primary
    ? `background:${COLORS.brand};color:#ffffff;border:1px solid ${COLORS.brand}`
    : `background:#ffffff;color:${COLORS.danger};border:1px solid ${COLORS.dangerBorder}`;
  return (
    `<td style="padding:0 8px 8px 0"><a href="${escapeHtml(href)}" ` +
    `style="display:inline-block;white-space:nowrap;padding:12px 20px;border-radius:10px;font-family:${FONT};font-size:15px;` +
    `font-weight:600;text-decoration:none;${style}">${escapeHtml(label)}</a></td>`
  );
}

const STATUS_COLORS: Partial<Record<AppointmentStatus, { bg: string; fg: string }>> = {
  pendiente: { bg: "#fffbeb", fg: "#b45309" },
  confirmado: { bg: "#ecfdf5", fg: "#047857" },
};

/** Arma asunto, HTML y texto plano del correo al paciente. */
export function buildAppointmentEmail(
  type: AppointmentNotificationType,
  data: AppointmentNotificationData,
  links?: AppointmentEmailLinks
): EmailContent {
  const copy = getCopy(type, data);
  // Con enlaces, el paciente responde desde el correo: el cierre se lo indica.
  const closing = links
    ? links.confirmUrl
      ? "Confirmá tu asistencia o, si no podés venir, cancelá el turno desde acá (hasta 2 horas antes):"
      : "Si no podés venir, cancelá el turno desde acá (hasta 2 horas antes):"
    : copy.closing;
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
    closing,
    ...(links
      ? [
          ...(links.confirmUrl ? [`Confirmar turno: ${links.confirmUrl}`] : []),
          `Cancelar turno: ${links.cancelUrl}`,
        ]
      : []),
    "",
    signature,
  ].join("\n");

  const status = STATUS_COLORS[data.status] ?? { bg: COLORS.page, fg: COLORS.muted };
  const detailRows = details
    .filter(([label]) => label !== "Estado")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:${COLORS.muted};font-size:14px;white-space:nowrap">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;font-weight:600;font-size:15px;color:${COLORS.text}">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const statusRow =
    `<tr><td style="padding:6px 16px 6px 0;color:${COLORS.muted};font-size:14px">Estado</td>` +
    `<td style="padding:6px 0"><span style="display:inline-block;padding:3px 10px;border-radius:999px;` +
    `background:${status.bg};color:${status.fg};font-size:13px;font-weight:600">${escapeHtml(getAppointmentStatusLabel(data.status))}</span></td></tr>`;

  const detailsCard = copy.showDetails
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${COLORS.brandSoft};` +
      `border:1px solid ${COLORS.brandBorder};border-radius:12px"><tr><td style="padding:16px 20px">` +
      `<table role="presentation" cellpadding="0" cellspacing="0">${detailRows}${statusRow}</table></td></tr></table>`
    : "";

  const buttons = links
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 8px"><tr>` +
      `${links.confirmUrl ? button(links.confirmUrl, "Confirmar turno", true) : ""}` +
      `${button(links.cancelUrl, "Cancelar turno", false)}</tr></table>`
    : "";

  const html =
    `<!doctype html><html lang="es"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(copy.subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:${COLORS.page}">` +
    // Vista previa en la bandeja de entrada (no se ve dentro del correo).
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(copy.intro)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page}"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:${FONT};color:${COLORS.text}">` +
    // Encabezado con la marca.
    `<tr><td style="background:${COLORS.brand};border-radius:16px 16px 0 0;padding:22px 28px">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:${COLORS.brandBorder}">${escapeHtml(siteConfig.clinicName)}</div>` +
    `<div style="margin-top:6px;font-size:22px;font-weight:700;color:#ffffff">${escapeHtml(copy.heading)}</div></td></tr>` +
    // Cuerpo.
    `<tr><td style="background:#ffffff;border:1px solid ${COLORS.border};border-top:0;border-radius:0 0 16px 16px;padding:28px">` +
    `<p style="margin:0 0 12px;font-size:16px">${escapeHtml(greeting)}</p>` +
    `<p style="margin:0;font-size:15px;line-height:1.6">${escapeHtml(copy.intro)}</p>` +
    detailsCard +
    `<p style="margin:${copy.showDetails ? "0" : "16px 0 0"} 0 12px;font-size:15px;line-height:1.6;color:${COLORS.text}">${escapeHtml(closing)}</p>` +
    buttons +
    `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${COLORS.border};font-size:14px;color:${COLORS.muted}">` +
    `Saludos,<br><strong style="color:${COLORS.brandDark}">${escapeHtml(signature)}</strong></p>` +
    `</td></tr>` +
    // Pie.
    `<tr><td style="padding:16px 8px;text-align:center;font-size:12px;line-height:1.5;color:${COLORS.muted}">` +
    `Este correo lo envía ${escapeHtml(siteConfig.clinicName)} con ${escapeHtml(siteConfig.name)}. ` +
    `Si no esperabas este mensaje, podés ignorarlo.</td></tr>` +
    `</table></td></tr></table></body></html>`;

  return { subject: copy.subject, html, text };
}
