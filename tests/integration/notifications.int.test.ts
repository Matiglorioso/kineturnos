import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { MAIL_DISABLED_ERROR } from "../../src/lib/notifications/mailer";
import { PATIENT_WITHOUT_EMAIL_ERROR } from "../../src/lib/db/notifications";
import {
  api,
  appointmentBody,
  BASE_URL,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  prisma,
} from "./helpers";

/**
 * Notificaciones por correo (RF05). En CI y en local no hay BREVO_API_KEY:
 * los correos se encolan y quedan "omitida" con el motivo, sin salir a internet.
 */

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

async function patientWithEmail() {
  const patient = await createPatient();
  return prisma.paciente.update({
    where: { id: patient.id },
    data: { email: `${patient.id}@test.local` },
  });
}

/** Espera a que el envío posterior a la respuesta (after) termine. */
async function notificationsOf(turnoId: string, expected: number) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const rows = await prisma.notificacion.findMany({
      where: { turnoId },
      orderBy: { creadaEn: "asc" },
    });
    const settled = rows.every((row) => row.estado !== "pendiente" && row.estado !== "enviando");
    if (rows.length >= expected && settled) return rows;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return prisma.notificacion.findMany({ where: { turnoId }, orderBy: { creadaEn: "asc" } });
}

describe("correos al paciente por cada cambio del turno", () => {
  it("alta, confirmación, reprogramación y cancelación encolan un correo cada una", async () => {
    const professional = await createProfessional();
    const patient = await patientWithEmail();
    const body = appointmentBody({
      patientId: patient.id,
      professionalId: professional.id,
      date: futureWorkday(15),
      time: "09:00",
    });

    assert.equal((await api("/api/appointments", { method: "POST", body })).status, 201);
    assert.equal(
      (
        await api(`/api/appointments/${body.id}`, {
          method: "PATCH",
          body: { status: "confirmado" },
        })
      ).status,
      200
    );
    const moved = await api(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: { ...body, time: "11:00", status: "confirmado" },
    });
    assert.equal(moved.status, 200, moved.error);
    // Cambiar solo las observaciones no avisa.
    const notes = await api(`/api/appointments/${body.id}`, {
      method: "PATCH",
      body: { ...body, time: "11:00", status: "confirmado", notes: "Traer estudios" },
    });
    assert.equal(notes.status, 200, notes.error);
    assert.equal(
      (
        await api(`/api/appointments/${body.id}`, {
          method: "PATCH",
          body: { status: "cancelado" },
        })
      ).status,
      200
    );

    const rows = await notificationsOf(body.id, 4);
    assert.deepEqual(
      rows.map((row) => row.tipo),
      ["creacion", "confirmacion", "reprogramacion", "cancelacion"]
    );
    for (const row of rows) {
      assert.equal(row.destinatario, patient.email);
      assert.equal(row.estado, "omitida", `${row.tipo}: sin BREVO_API_KEY no se envía`);
      assert.equal(row.error, MAIL_DISABLED_ERROR);
    }

    const reprogramacion = rows[2].datos as { time: string; previous?: { time: string } };
    assert.equal(reprogramacion.time, "11:00");
    assert.equal(reprogramacion.previous?.time, "09:00");
  });

  it("un paciente sin email queda registrado como omitido", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const body = appointmentBody({
      patientId: patient.id,
      professionalId: professional.id,
      date: futureWorkday(16),
      time: "10:00",
    });

    assert.equal((await api("/api/appointments", { method: "POST", body })).status, 201);

    const [row] = await notificationsOf(body.id, 1);
    assert.equal(row.tipo, "creacion");
    assert.equal(row.estado, "omitida");
    assert.equal(row.destinatario, null);
    assert.equal(row.error, PATIENT_WITHOUT_EMAIL_ERROR);
  });

  it("si la escritura falla (choque de horario) no queda ningún correo", async () => {
    const professional = await createProfessional();
    const patient = await patientWithEmail();
    const date = futureWorkday(17);
    await createAppointmentInDb({ patient, professional, date, time: "12:00" });

    const other = await patientWithEmail();
    const body = appointmentBody({
      patientId: other.id,
      professionalId: professional.id,
      date,
      time: "12:00",
    });
    assert.equal((await api("/api/appointments", { method: "POST", body })).status, 409);
    assert.equal(await prisma.notificacion.count({ where: { turnoId: body.id } }), 0);
  });
});

/** Fecha y hora (en el consultorio) de dentro de `hours` horas, redondeada a la hora. */
function clinicSlotIn(hours: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(Date.now() + hours * 60 * 60 * 1000))
      .map((part) => [part.type, part.value])
  );
  return { date: `${parts.day}-${parts.month}-${parts.year}`, time: `${parts.hour}:00` };
}

async function callCron(secret?: string) {
  const response = await fetch(`${BASE_URL}/api/cron/notificaciones`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
  return { status: response.status, json: await response.json().catch(() => null) };
}

describe("cron de recordatorios", () => {
  it("sin el secreto responde 401", async () => {
    assert.equal((await callCron()).status, 401);
    assert.equal((await callCron("incorrecto")).status, 401);
  });

  it("encola un solo recordatorio por turno dentro de las próximas 24 h", async () => {
    const secret = process.env.CRON_SECRET;
    assert.ok(secret, "CRON_SECRET tiene que estar definido (como en el dev server)");

    const professional = await createProfessional();
    const patient = await patientWithEmail();
    const soon = await createAppointmentInDb({
      patient,
      professional,
      ...clinicSlotIn(12),
      status: "confirmado",
    });
    const later = await createAppointmentInDb({
      patient,
      professional,
      ...clinicSlotIn(48),
    });
    const cancelled = await createAppointmentInDb({
      patient: await patientWithEmail(),
      professional,
      ...clinicSlotIn(13),
      status: "cancelado",
    });

    const first = await callCron(secret);
    assert.equal(first.status, 200, JSON.stringify(first.json));
    assert.ok(first.json.data.recordatorios >= 1);

    const second = await callCron(secret);
    assert.equal(second.status, 200);

    const reminders = await prisma.notificacion.findMany({
      where: { tipo: "recordatorio", turnoId: { in: [soon.id, later.id, cancelled.id] } },
    });
    assert.equal(reminders.length, 1, "solo el turno activo de dentro de 12 h");
    assert.equal(reminders[0].turnoId, soon.id);
    assert.equal(reminders[0].estado, "omitida");
  });
});
