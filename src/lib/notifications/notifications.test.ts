import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppointmentStatus } from "@/types";
import { isAuthorizedCronRequest } from "./cron-auth";
import {
  getAppointmentNotificationEvents,
  getReminderKey,
  getReminderWindow,
  type NotifiableAppointment,
} from "./events";
import { getMailerConfig, MAIL_DISABLED_ERROR, sendEmail } from "./mailer";
import { buildAppointmentEmail, type AppointmentNotificationData } from "./templates";

const base: NotifiableAppointment = {
  patientId: "pac1",
  professionalId: "prof1",
  date: "30-09-2026",
  time: "10:00",
  status: "pendiente",
};

function types(previous: NotifiableAppointment | null, next: NotifiableAppointment) {
  return getAppointmentNotificationEvents(previous, next).map(
    ({ type, target }) => `${type}:${target}`
  );
}

describe("qué correo dispara cada escritura de turno", () => {
  it("alta de un turno activo: creación", () => {
    assert.deepEqual(types(null, base), ["creacion:next"]);
    assert.deepEqual(types(null, { ...base, status: "confirmado" }), ["creacion:next"]);
  });

  it("alta de un turno ya cancelado o atendido: nada", () => {
    for (const status of ["cancelado", "atendido", "ausente"] as AppointmentStatus[]) {
      assert.deepEqual(types(null, { ...base, status }), [], status);
    }
  });

  it("pendiente → confirmado: confirmación", () => {
    assert.deepEqual(types(base, { ...base, status: "confirmado" }), ["confirmacion:next"]);
  });

  it("cancelación desde pendiente o confirmado", () => {
    assert.deepEqual(types(base, { ...base, status: "cancelado" }), ["cancelacion:previous"]);
    assert.deepEqual(
      types({ ...base, status: "confirmado" }, { ...base, status: "cancelado" }),
      ["cancelacion:previous"]
    );
  });

  it("atendido y ausente no avisan", () => {
    assert.deepEqual(types(base, { ...base, status: "atendido" }), []);
    assert.deepEqual(types(base, { ...base, status: "ausente" }), []);
  });

  it("cambio de fecha, hora o profesional: reprogramación", () => {
    assert.deepEqual(types(base, { ...base, date: "01-10-2026" }), ["reprogramacion:next"]);
    assert.deepEqual(types(base, { ...base, time: "11:00" }), ["reprogramacion:next"]);
    assert.deepEqual(types(base, { ...base, professionalId: "prof2" }), [
      "reprogramacion:next",
    ]);
  });

  it("reprogramar y confirmar a la vez: un solo correo de reprogramación", () => {
    assert.deepEqual(types(base, { ...base, time: "11:00", status: "confirmado" }), [
      "reprogramacion:next",
    ]);
  });

  it("misma hora con otro formato (10:00:00) no es reprogramación", () => {
    assert.deepEqual(types(base, { ...base, time: "10:00:00" }), []);
  });

  it("cambio de paciente: cancelación al anterior y creación al nuevo", () => {
    assert.deepEqual(types(base, { ...base, patientId: "pac2" }), [
      "cancelacion:previous",
      "creacion:next",
    ]);
  });

  it("editar tipo de sesión u observaciones no avisa", () => {
    assert.deepEqual(types(base, { ...base }), []);
  });

  it("un turno en estado final ya no avisa", () => {
    const cancelled = { ...base, status: "cancelado" as const };
    assert.deepEqual(types(cancelled, cancelled), []);
  });
});

describe("recordatorio 24 h antes", () => {
  it("la ventana va de 2 h a 24 h desde ahora", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    const { from, to } = getReminderWindow(now);
    assert.equal(from.toISOString(), "2026-09-29T14:00:00.000Z");
    assert.equal(to.toISOString(), "2026-09-30T12:00:00.000Z");
  });

  it("la clave cambia si el turno se reprograma", () => {
    assert.equal(
      getReminderKey("t1", "30-09-2026", "10:00:00"),
      "recordatorio:t1:30-09-2026:10:00"
    );
    assert.notEqual(
      getReminderKey("t1", "30-09-2026", "10:00"),
      getReminderKey("t1", "30-09-2026", "11:00")
    );
  });
});

const data: AppointmentNotificationData = {
  patientName: "Ana Torres",
  professionalName: "Camila Vargas",
  date: "30-09-2026",
  time: "10:00",
  sessionType: "Rehabilitación",
  status: "confirmado",
};

describe("plantillas de correo", () => {
  it("creación: asunto con fecha larga y detalle del turno", () => {
    const email = buildAppointmentEmail("creacion", data);
    assert.equal(
      email.subject,
      "Tu turno en SANMAR SALUD: Miércoles 30 de septiembre de 2026 a las 10:00 h"
    );
    assert.match(email.text, /^Hola Ana:/);
    assert.match(email.text, /agendado y confirmado/);
    assert.match(email.text, /Profesional: Camila Vargas/);
    assert.match(email.text, /Estado: Confirmado/);
  });

  it("escapa el HTML de los datos", () => {
    const email = buildAppointmentEmail("creacion", {
      ...data,
      sessionType: "Control <b>& evaluación</b>",
    });
    assert.ok(!email.html.includes("<b>&"));
    assert.match(email.html, /Control &lt;b&gt;&amp; evaluación&lt;\/b&gt;/);
  });

  it("reprogramación: menciona el horario y el profesional anteriores", () => {
    const email = buildAppointmentEmail("reprogramacion", {
      ...data,
      previous: { date: "29-09-2026", time: "09:00", professionalName: "Laura Ruiz" },
    });
    assert.match(email.subject, /^Tu turno cambió/);
    assert.match(
      email.text,
      /Antes era el Martes 29 de septiembre de 2026 a las 09:00 h con Laura Ruiz\./
    );
  });

  it("cancelación: sin tabla de detalle", () => {
    const email = buildAppointmentEmail("cancelacion", data);
    assert.match(email.subject, /^Turno cancelado/);
    assert.ok(!email.text.includes("Sesión:"));
    assert.ok(!email.html.includes("<table"));
  });

  it("confirmación y recordatorio", () => {
    assert.match(buildAppointmentEmail("confirmacion", data).subject, /^Turno confirmado/);
    assert.match(
      buildAppointmentEmail("recordatorio", data).subject,
      /^Recordatorio de tu turno/
    );
  });
});

describe("envío con Brevo", () => {
  const config = getMailerConfig({
    BREVO_API_KEY: "clave",
    MAIL_FROM_EMAIL: "turnos@sanmar.test",
  });
  const email = {
    ...buildAppointmentEmail("creacion", data),
    to: "ana@test.local",
    toName: "Ana",
  };

  it("sin API key o remitente, el envío queda deshabilitado", async () => {
    assert.equal(getMailerConfig({}), null);
    assert.equal(getMailerConfig({ BREVO_API_KEY: "clave" }), null);
    assert.deepEqual(await sendEmail(email, null), {
      status: "omitida",
      error: MAIL_DISABLED_ERROR,
    });
  });

  it("el remitente por defecto es el consultorio", () => {
    assert.equal(config?.fromName, "SANMAR SALUD");
  });

  it("manda el correo a la API de Brevo", async () => {
    let request: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      request = { url, init };
      return new Response(JSON.stringify({ messageId: "m1" }), { status: 201 });
    }) as unknown as typeof fetch;

    const result = await sendEmail(email, config, fakeFetch);
    assert.deepEqual(result, { status: "enviada", providerId: "m1" });
    assert.equal(request?.url, "https://api.brevo.com/v3/smtp/email");
    assert.equal((request?.init.headers as Record<string, string>)["api-key"], "clave");
    const body = JSON.parse(String(request?.init.body));
    assert.deepEqual(body.to, [{ email: "ana@test.local", name: "Ana" }]);
    assert.deepEqual(body.sender, { email: "turnos@sanmar.test", name: "SANMAR SALUD" });
  });

  it("con MAIL_TEST_RECIPIENT todo va a la casilla de prueba", async () => {
    let body: { to: { email: string }[]; subject: string } | undefined;
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response("{}", { status: 201 });
    }) as unknown as typeof fetch;

    await sendEmail(email, { ...config!, testRecipient: "qa@test.local" }, fakeFetch);
    assert.equal(body?.to[0].email, "qa@test.local");
    assert.match(body!.subject, /^\[Prueba → ana@test\.local\]/);
  });

  it("un error de Brevo o de red queda como fallida", async () => {
    const rejected = (async () =>
      new Response(JSON.stringify({ message: "Key not found" }), {
        status: 401,
      })) as unknown as typeof fetch;
    assert.deepEqual(await sendEmail(email, config, rejected), {
      status: "fallida",
      error: "Brevo respondió 401: Key not found",
    });

    const offline = (async () => {
      throw new Error("fetch failed");
    }) as unknown as typeof fetch;
    assert.deepEqual(await sendEmail(email, config, offline), {
      status: "fallida",
      error: "fetch failed",
    });
  });
});

describe("autenticación del cron", () => {
  it("exige el Bearer con CRON_SECRET", () => {
    assert.equal(isAuthorizedCronRequest("Bearer s3creto", "s3creto"), true);
    assert.equal(isAuthorizedCronRequest("Bearer otro", "s3creto"), false);
    assert.equal(isAuthorizedCronRequest("s3creto", "s3creto"), false);
    assert.equal(isAuthorizedCronRequest(null, "s3creto"), false);
  });

  it("sin CRON_SECRET configurado queda cerrado", () => {
    assert.equal(isAuthorizedCronRequest("Bearer ", undefined), false);
    assert.equal(isAuthorizedCronRequest("Bearer x", ""), false);
  });
});
