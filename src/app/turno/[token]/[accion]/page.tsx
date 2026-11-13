import { Button } from "@/components/ui/button";
import {
  evaluatePatientLink,
  getAppointmentLinkSecret,
  PATIENT_CANCEL_MIN_HOURS_BEFORE,
  verifyAppointmentLinkToken,
  type PatientLinkAction,
  type PatientLinkOutcome,
} from "@/lib/appointment-links";
import { getAppointmentByIdFromDb, updateAppointmentStatusInDb } from "@/lib/db/appointments";
import { auditWrite, patientAuditContext, readAuditSnapshot } from "@/lib/db/audit";
import { formatAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { normalizeTime } from "@/lib/time-utils";
import type { Appointment } from "@/types";
import { CalendarCheck, CalendarX, CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

// Página pública (sin sesión) a la que llevan los botones del correo: el enlace firmado es la autorización.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu turno", robots: { index: false, follow: false } };

type Params = { token: string; accion: string };

function isAction(value: string): value is PatientLinkAction {
  return value === "confirmar" || value === "cancelar";
}

/** El turno del enlace y qué se puede hacer con él ahora; null si el enlace no es válido. */
async function resolveLink(token: string, action: PatientLinkAction) {
  const secret = getAppointmentLinkSecret();
  const slot = secret ? verifyAppointmentLinkToken(token, secret) : null;
  if (!slot) return null;
  const appointment = await getAppointmentByIdFromDb(slot.appointmentId);
  if (!appointment) return null;
  return { appointment, outcome: evaluatePatientLink(appointment, slot, action, new Date()) };
}

/** Cambio de estado hecho por el paciente desde el correo, con auditoría. */
async function setStatusFromLink(appointment: Appointment, status: "confirmado" | "cancelado") {
  const before = await readAuditSnapshot("turno", appointment.id);
  const updated = await updateAppointmentStatusInDb(appointment.id, status, { notifyPatient: false });
  await auditWrite(patientAuditContext(appointment.patientName, await headers()), "turno", "modificacion", appointment.id, before);
  return updated;
}

function describe(appointment: Appointment): string {
  const day = formatAppDate(appointment.date, "EEEE d 'de' MMMM");
  return `del ${day} a las ${normalizeTime(appointment.time)} h con ${appointment.professionalName}`;
}

async function cancelAppointment(token: string) {
  "use server";
  const resolved = await resolveLink(token, "cancelar");
  if (resolved?.outcome === "disponible") {
    await setStatusFromLink(resolved.appointment, "cancelado");
  }
  // La misma página muestra el resultado (cancelado, o por qué no se pudo).
  redirect(`/turno/${token}/cancelar`);
}

const MESSAGES: Record<Exclude<PatientLinkOutcome, "disponible">, (when: string) => { title: string; text: string }> = {
  "ya-confirmado": (when) => ({ title: "Turno confirmado", text: `Tu turno ${when} ha sido confirmado. ¡Te esperamos!` }),
  cancelado: (when) => ({
    title: "Turno cancelado",
    text: `Tu turno ${when} ha sido cancelado. Si querés un nuevo turno, comunicate con el consultorio.`,
  }),
  "turno-modificado": () => ({
    title: "Este enlace ya no corresponde",
    text: "Tu turno cambió de fecha u horario. Usá los botones del último correo que te enviamos.",
  }),
  finalizado: () => ({
    title: "Este turno ya pasó",
    text: "No se puede confirmar ni cancelar un turno que ya empezó o terminó.",
  }),
  "fuera-de-plazo": (when) => ({
    title: "Ya no se puede cancelar desde el correo",
    text: `Tu turno ${when} empieza en menos de ${PATIENT_CANCEL_MIN_HOURS_BEFORE} horas. Para cancelarlo, comunicate con el consultorio.`,
  }),
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{siteConfig.clinicName}</p>
        {children}
      </div>
    </main>
  );
}

export default async function PatientAppointmentLinkPage({ params }: { params: Promise<Params> }) {
  const { token, accion } = await params;
  if (!isAction(accion)) notFound();

  const resolved = await resolveLink(token, accion);
  if (!resolved) {
    return (
      <Shell>
        <CircleAlert className="mx-auto mt-6 h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Enlace no válido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No encontramos el turno de este enlace. Comunicate con el consultorio.
        </p>
      </Shell>
    );
  }

  let { appointment, outcome } = resolved;
  const when = describe(appointment);

  // Confirmar es de un toque: se aplica al abrir el enlace.
  if (accion === "confirmar" && outcome === "disponible") {
    appointment = await setStatusFromLink(appointment, "confirmado");
    outcome = "ya-confirmado";
  }

  // Cancelar pide un paso más (los filtros de correo abren los enlaces solos).
  if (accion === "cancelar" && outcome === "disponible") {
    return (
      <Shell>
        <CalendarX className="mx-auto mt-6 h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">¿Cancelás tu turno?</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu turno {when}. El horario queda libre para otro paciente.
        </p>
        <form action={cancelAppointment.bind(null, token)} className="mt-6">
          <Button type="submit" variant="destructive" className="w-full">
            Sí, cancelar mi turno
          </Button>
        </form>
      </Shell>
    );
  }

  const message = MESSAGES[outcome as Exclude<PatientLinkOutcome, "disponible">](when);
  const Icon = outcome === "ya-confirmado" ? CalendarCheck : outcome === "cancelado" ? CalendarX : CircleAlert;
  const iconColor =
    outcome === "ya-confirmado" ? "text-emerald-600" : outcome === "cancelado" ? "text-red-500" : "text-amber-500";
  return (
    <Shell>
      <Icon className={`mx-auto mt-6 h-10 w-10 ${iconColor}`} />
      <h1 className="mt-4 text-xl font-semibold text-slate-900">{message.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{message.text}</p>
    </Shell>
  );
}
