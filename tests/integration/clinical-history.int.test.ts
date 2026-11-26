import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { addDays } from "date-fns";
import { CLINICAL_EDIT_CLOSED_ERROR } from "../../src/lib/clinical-history";
import { getTodayAppDate, parseAppDate, toAppDate } from "../../src/lib/date-utils";
import {
  api,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  login,
  prisma,
  type Auth,
} from "./helpers";

type Entry = {
  id: string;
  date: string;
  professionalName: string | null;
  appointmentId: string | null;
  diagnosis: string | null;
  editable: boolean;
};
type History = {
  entries: Entry[];
  sessionOptions: { id: string }[];
};

function daysAgo(days: number): string {
  return toAppDate(addDays(parseAppDate(getTodayAppDate())!, -days));
}

const historia = (patientId: string) => `/api/patients/${patientId}/historia`;

let admin: Auth;
let profe: Auth;
let ownProfessional: { id: string; nombre: string };

before(async () => {
  admin = await login("admin@kineturnos.local");
  profe = await login("profe@kineturnos.local");
  const user = await prisma.usuario.findUniqueOrThrow({ where: { id: "u-profe" } });
  ownProfessional = await prisma.profesional.findUniqueOrThrow({
    where: { id: user.profesionalId! },
  });
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("acceso a la historia clínica (RNF06)", () => {
  it("administración accede a cualquier historia", async () => {
    const patient = await createPatient();
    const res = await api<History>(historia(patient.id), { auth: admin });
    assert.equal(res.status, 200, res.error);
    assert.deepEqual(res.data?.entries, []);
  });

  it("el profesional sin turnos con el paciente no la ve ni la escribe (403)", async () => {
    const patient = await createPatient();
    assert.equal((await api(historia(patient.id), { auth: profe })).status, 403);
    const post = await api(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { evolution: "No debería guardarse" },
    });
    assert.equal(post.status, 403);
  });

  it("un turno cancelado no da acceso", async () => {
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date: futureWorkday(5),
      time: "10:00",
      status: "cancelado",
    });
    assert.equal((await api(historia(patient.id), { auth: profe })).status, 403);
  });

  it("un turno futuro (todavía no atendido) sí da acceso: puede leerla antes de la sesión", async () => {
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date: futureWorkday(6),
      time: "11:00",
    });
    assert.equal((await api(historia(patient.id), { auth: profe })).status, 200);
  });
});

describe("registro de sesiones (RF11-RF13)", () => {
  it("el profesional registra la sesión de su turno", async () => {
    const patient = await createPatient();
    const date = daysAgo(2);
    const turno = await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date,
      time: "09:00",
      status: "atendido",
    });

    const before = await api<History>(historia(patient.id), { auth: profe });
    assert.ok(before.data?.sessionOptions.some((option) => option.id === turno.id));

    const created = await api<Entry>(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: {
        appointmentId: turno.id,
        // Diagnóstico y plan ya no se cargan en la evolución: se ignoran.
        diagnosis: "Lumbalgia mecánica",
        evolution: "Primera evaluación. Dolor 7/10.",
      },
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.date, date);
    assert.equal(created.data?.professionalName, ownProfessional.nombre);
    assert.equal(created.data?.editable, true);
    assert.equal(created.data?.diagnosis, null);

    const again = await api(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { appointmentId: turno.id, evolution: "Duplicado" },
    });
    assert.equal(again.status, 409);

    const after = await api<History>(historia(patient.id), { auth: profe });
    assert.ok(!after.data?.sessionOptions.some((option) => option.id === turno.id));
  });

  it("no se registra la sesión de un turno que todavía no ocurrió", async () => {
    const patient = await createPatient();
    const turno = await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date: futureWorkday(4),
      time: "12:00",
    });
    const res = await api(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { appointmentId: turno.id, evolution: "Adelantado" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.field, "appointmentId");
  });

  it("el profesional no registra la sesión del turno de otro profesional (403)", async () => {
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date: daysAgo(3),
      time: "10:00",
      status: "atendido",
    });
    const other = await createProfessional();
    const otherTurno = await createAppointmentInDb({
      patient,
      professional: other,
      date: daysAgo(1),
      time: "10:00",
      status: "atendido",
    });
    const res = await api(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { appointmentId: otherTurno.id, evolution: "Turno ajeno" },
    });
    assert.equal(res.status, 403);
  });

  it("administración elige qué profesional atendió una sesión sin turno (400 si no lo elige)", async () => {
    const patient = await createPatient();
    const kine = await createProfessional();
    const missing = await api(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "Sin profesional" },
    });
    assert.equal(missing.status, 400);
    assert.equal(missing.field, "professionalId");

    const created = await api<Entry>(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "Con profesional", professionalId: kine.id },
    });
    assert.equal(created.status, 201, created.error);
    const stored = await prisma.historiaClinica.findUniqueOrThrow({ where: { id: created.data!.id } });
    assert.equal(stored.profesionalId, kine.id);
  });

  it("la evolución es obligatoria (400)", async () => {
    const patient = await createPatient();
    const res = await api(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "  " },
    });
    assert.equal(res.status, 400);
    assert.equal(res.field, "evolution");
  });
});

describe("corrección de registros: solo el autor, dentro de las 24 h", () => {
  it("el autor corrige; otro usuario no; pasadas las 24 h, tampoco el autor", async () => {
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional: ownProfessional,
      date: daysAgo(1),
      time: "15:00",
      status: "atendido",
    });
    const created = await api<Entry>(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { evolution: "Borrador" },
    });
    assert.equal(created.status, 201, created.error);
    const entryUrl = `${historia(patient.id)}/${created.data!.id}`;

    const fixed = await api<Entry>(entryUrl, {
      method: "PATCH",
      auth: profe,
      body: { evolution: "Evolución corregida" },
    });
    assert.equal(fixed.status, 200, fixed.error);

    const byAdmin = await api(entryUrl, {
      method: "PATCH",
      auth: admin,
      body: { evolution: "Cambio de otro usuario" },
    });
    assert.equal(byAdmin.status, 403);

    await prisma.historiaClinica.update({
      where: { id: created.data!.id },
      data: { creadoEn: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });
    const late = await api(entryUrl, {
      method: "PATCH",
      auth: profe,
      body: { evolution: "Tarde" },
    });
    assert.equal(late.status, 403);
    assert.equal(late.error, CLINICAL_EDIT_CLOSED_ERROR);

    const stored = await prisma.historiaClinica.findUniqueOrThrow({
      where: { id: created.data!.id },
    });
    assert.equal(stored.evolucion, "Evolución corregida");
  });
});

/** Una API que se sacó: 404, o 405 si la ruta coincide con la de un registro ([entryId]). */
function assertGone(status: number) {
  assert.ok(status === 404 || status === 405, `esperaba 404 o 405 y fue ${status}`);
}

describe("trazabilidad (RNF07) y conservación", () => {
  it("las consultas a la historia quedan en la auditoría del Superadmin; ya no hay «Ver accesos»", async () => {
    const patient = await createPatient();
    await api(historia(patient.id), { auth: admin });

    // El registro por paciente se sacó de la pantalla y de la API.
    assertGone((await api(`${historia(patient.id)}/accesos`, { auth: admin })).status);

    const superadmin = await login("superadmin@kineturnos.local");
    const log = await api<{ items: { action: string; entity: string; entityId: string | null }[] }>(
      "/api/auditoria?dias=1",
      { auth: superadmin }
    );
    assert.equal(log.status, 200, log.error);
    assert.ok(
      log.data?.items.some(
        (item) => item.action === "consulta" && item.entity === "historia_clinica" && item.entityId === patient.id
      )
    );
  });

  it("un paciente con historia clínica no se puede eliminar (409)", async () => {
    const patient = await createPatient();
    await api(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "Registro a conservar", professionalId: (await createProfessional()).id },
    });
    const res = await api(`/api/patients/${patient.id}`, { method: "DELETE", auth: admin });
    assert.equal(res.status, 409);
    assert.match(res.error ?? "", /historia clínica/);
  });
});

describe("la historia es solo la evolución", () => {
  it("sin alertas, antecedentes, objetivos ni resumen; sus APIs ya no existen", async () => {
    const patient = await createPatient();
    const history = await api<Record<string, unknown>>(historia(patient.id), { auth: admin });
    assert.equal(history.status, 200, history.error);
    for (const key of ["profile", "goals", "nextAppointment", "summary"]) {
      assert.ok(!(key in (history.data ?? {})), key);
    }
    assertGone(
      (await api(`${historia(patient.id)}/ficha`, { method: "PUT", auth: admin, body: { alerts: "x" } })).status
    );
    assertGone(
      (await api(`${historia(patient.id)}/objetivos`, { method: "POST", auth: admin, body: { description: "x" } })).status
    );
  });
});
