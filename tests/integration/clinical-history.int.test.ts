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
  summary: { diagnosis: { text: string } | null };
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
  it("el profesional registra la sesión de su turno; el diagnóstico queda vigente", async () => {
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
        diagnosis: "Lumbalgia mecánica",
        treatment: "",
        evolution: "Primera evaluación. Dolor 7/10.",
      },
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.date, date);
    assert.equal(created.data?.professionalName, ownProfessional.nombre);
    assert.equal(created.data?.editable, true);

    const again = await api(historia(patient.id), {
      method: "POST",
      auth: profe,
      body: { appointmentId: turno.id, evolution: "Duplicado" },
    });
    assert.equal(again.status, 409);

    const after = await api<History>(historia(patient.id), { auth: profe });
    assert.equal(after.data?.summary.diagnosis?.text, "Lumbalgia mecánica");
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

describe("trazabilidad (RNF07) y conservación", () => {
  it("registra lecturas, altas y correcciones; solo administración ve el registro", async () => {
    const patient = await createPatient();
    const created = await api<Entry>(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "Sesión inicial" },
    });
    assert.equal(created.status, 201, created.error);
    await api(`${historia(patient.id)}/${created.data!.id}`, {
      method: "PATCH",
      auth: admin,
      body: { evolution: "Sesión inicial (corregida)" },
    });
    await api(historia(patient.id), { auth: admin });

    const log = await api<{ action: string; userRole: string }[]>(
      `${historia(patient.id)}/accesos`,
      { auth: admin }
    );
    assert.equal(log.status, 200, log.error);
    assert.deepEqual(
      log.data?.map((item) => item.action).sort(),
      ["alta", "edicion", "lectura"]
    );
    assert.equal(log.data?.[0].userRole, "Administración");

    assert.equal(
      (await api(`${historia(patient.id)}/accesos`, { auth: profe })).status,
      403
    );
  });

  it("un paciente con historia clínica no se puede eliminar (409)", async () => {
    const patient = await createPatient();
    await api(historia(patient.id), {
      method: "POST",
      auth: admin,
      body: { evolution: "Registro a conservar" },
    });
    const res = await api(`/api/patients/${patient.id}`, { method: "DELETE", auth: admin });
    assert.equal(res.status, 409);
    assert.match(res.error ?? "", /historia clínica/);
  });
});
