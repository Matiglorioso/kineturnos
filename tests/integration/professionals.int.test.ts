import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  api,
  appointmentBody,
  cleanupTestData,
  createPatient,
  createProfessional,
  createUser,
  futureWorkday,
  weekdayName,
  prisma,
  testId,
  uniqueDigits,
} from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

const professionalBody = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Test",
  lastName: "Kine",
  license: `MN ${uniqueDigits(6)}`,
  email: "prof.test@email.com",
  phone: "+54 11 8888-8888",
  specialty: "Traumatología",
  days: ["Lunes", "Martes"],
  active: true,
  avatarColor: "brand",
  notes: "",
  ...overrides,
});

describe("API de profesionales", () => {
  it("GET lista los profesionales", async () => {
    const res = await api<unknown[]>("/api/professionals");
    assert.equal(res.status, 200);
    assert.ok(res.data && res.data.length > 0);
  });

  it("alta, edición y baja de un profesional sin turnos", async () => {
    const id = testId("prof");
    const body = professionalBody({ id });

    const created = await api<{ id: string }>("/api/professionals", {
      method: "POST",
      body,
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.id, id);

    const updated = await api<{ specialty: string; days: string[] }>(
      `/api/professionals/${id}`,
      {
        method: "PATCH",
        body: { ...body, specialty: "RPG", days: ["Lunes", "Jueves"] },
      }
    );
    assert.equal(updated.status, 200, updated.error);
    assert.equal(updated.data?.specialty, "RPG");
    assert.deepEqual(updated.data?.days, ["Lunes", "Jueves"]);

    const deleted = await api(`/api/professionals/${id}`, { method: "DELETE" });
    assert.equal(deleted.status, 200, deleted.error);
  });

  it("rechaza una matrícula duplicada con 409", async () => {
    const digits = uniqueDigits(6);
    const first = await api("/api/professionals", {
      method: "POST",
      body: professionalBody({ id: testId("prof"), license: `MN ${digits}` }),
    });
    assert.equal(first.status, 201, first.error);

    const duplicate = await api("/api/professionals", {
      method: "POST",
      body: professionalBody({ id: testId("prof"), license: `mn${digits}` }),
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.field, "license");
  });

  it("no deja borrar un profesional con turnos activos (409)", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();

    const created = await api("/api/appointments", {
      method: "POST",
      body: appointmentBody({
        patientId: patient.id,
        professionalId: professional.id,
        date: futureWorkday(10),
        time: "10:00",
      }),
    });
    assert.equal(created.status, 201, created.error);

    const blocked = await api(`/api/professionals/${professional.id}`, {
      method: "DELETE",
    });
    assert.equal(blocked.status, 409);
    assert.match(blocked.error ?? "", /turno\(s\) activo/);
  });

  it("no deja desactivarlo ni sacarle un día con turnos activos ese día (409)", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const date = futureWorkday(10);
    const created = await api("/api/appointments", {
      method: "POST",
      body: appointmentBody({ patientId: patient.id, professionalId: professional.id, date, time: "10:00" }),
    });
    assert.equal(created.status, 201, created.error);

    const current = (await api<Record<string, unknown>>(`/api/professionals/${professional.id}`)).data!;
    const deactivate = await api(`/api/professionals/${professional.id}`, {
      method: "PATCH",
      body: { ...current, active: false },
    });
    assert.equal(deactivate.status, 409);
    assert.match(deactivate.error ?? "", /No se puede desactivar al profesional/);

    const day = weekdayName(date);
    const days = (current.days as string[]).filter((item) => item !== day);
    const removeDay = await api(`/api/professionals/${professional.id}`, {
      method: "PATCH",
      body: { ...current, days },
    });
    assert.equal(removeDay.status, 409);
    assert.match(removeDay.error ?? "", new RegExp(`No se puede sacar el ${day.toLowerCase()}`));
  });

  it("desactivarlo desactiva su usuario, y reactivarlo lo reactiva", async () => {
    const professional = await createProfessional();
    const user = await createUser({ rol: "profesional", profesionalId: professional.id });
    const current = (await api<Record<string, unknown>>(`/api/professionals/${professional.id}`)).data!;

    const off = await api(`/api/professionals/${professional.id}`, { method: "PATCH", body: { ...current, active: false } });
    assert.equal(off.status, 200, off.error);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } })).activo, false);

    const on = await api(`/api/professionals/${professional.id}`, { method: "PATCH", body: { ...current, active: true } });
    assert.equal(on.status, 200, on.error);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } })).activo, true);
  });

  it("al renombrarlo, el nombre se propaga a sus turnos", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    const appointment = appointmentBody({
      patientId: patient.id,
      professionalId: professional.id,
      date: futureWorkday(11),
      time: "11:00",
    });
    const created = await api<{ id: string }>("/api/appointments", { method: "POST", body: appointment });
    assert.equal(created.status, 201, created.error);

    const renamed = await api(`/api/professionals/${professional.id}`, {
      method: "PATCH",
      body: professionalBody({
        license: professional.matricula,
        firstName: "Nombre",
        lastName: "Nuevo",
        days: professional.diasAtencion,
      }),
    });
    assert.equal(renamed.status, 200, renamed.error);

    // El id lo genera el servidor.
    const turno = await prisma.turno.findUniqueOrThrow({
      where: { id: created.data!.id },
    });
    assert.equal(turno.profesionalNombre, "Nombre Nuevo");
  });
});
