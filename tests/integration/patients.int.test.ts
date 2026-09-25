import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  api,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  prisma,
  testId,
  uniqueDigits,
} from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

const patientBody = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Test",
  lastName: "Integracion",
  dni: uniqueDigits(8),
  phone: "+54 11 9999-9999",
  email: "test.int@email.com",
  insurance: "Particular",
  status: "activo",
  notes: "",
  ...overrides,
});

describe("API de pacientes", () => {
  it("GET lista los pacientes", async () => {
    const res = await api<unknown[]>("/api/patients");
    assert.equal(res.status, 200);
    assert.ok(res.data && res.data.length > 0);
  });

  it("alta, edición y baja de un paciente", async () => {
    const id = testId("pac");
    const body = patientBody({ id });

    const created = await api<{ id: string; name: string }>("/api/patients", {
      method: "POST",
      body,
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.id, id);

    const updated = await api<{ name: string; insurance: string }>(
      `/api/patients/${id}`,
      {
        method: "PATCH",
        body: { ...body, lastName: "Actualizado", insurance: "OSDE" },
      }
    );
    assert.equal(updated.status, 200, updated.error);
    assert.equal(updated.data?.name, "Test Actualizado");
    assert.equal(updated.data?.insurance, "OSDE");

    const deleted = await api(`/api/patients/${id}`, { method: "DELETE" });
    assert.equal(deleted.status, 200, deleted.error);
    assert.equal(await prisma.paciente.count({ where: { id } }), 0);
  });

  it("rechaza un DNI duplicado con 409 y field dni", async () => {
    const dni = uniqueDigits(8);
    const first = await api("/api/patients", {
      method: "POST",
      body: patientBody({ id: testId("pac"), dni }),
    });
    assert.equal(first.status, 201, first.error);

    // Mismo DNI con otro formato: se compara normalizado.
    const dotted = `${dni.slice(0, 2)}.${dni.slice(2, 5)}.${dni.slice(5)}`;
    const duplicate = await api("/api/patients", {
      method: "POST",
      body: patientBody({ id: testId("pac"), dni: dotted }),
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.field, "dni");
  });

  it("no deja borrar un paciente con turnos activos (M4)", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional,
      date: futureWorkday(30),
      time: "10:00",
      status: "pendiente",
    });

    const res = await api(`/api/patients/${patient.id}`, { method: "DELETE" });
    assert.equal(res.status, 409);
    assert.match(res.error ?? "", /turno\(s\) activo/);
    assert.equal(await prisma.paciente.count({ where: { id: patient.id } }), 1);
    assert.equal(await prisma.turno.count({ where: { pacienteId: patient.id } }), 1);
  });

  it("con solo turnos finales, borra el paciente y su historial", async () => {
    const professional = await createProfessional();
    const patient = await createPatient();
    await createAppointmentInDb({
      patient,
      professional,
      date: "10-02-2026",
      time: "10:00",
      status: "atendido",
    });

    const res = await api(`/api/patients/${patient.id}`, { method: "DELETE" });
    assert.equal(res.status, 200, res.error);
    assert.equal(await prisma.turno.count({ where: { pacienteId: patient.id } }), 0);
  });

  it("un body inválido responde 400 con el campo", async () => {
    const res = await api("/api/patients", {
      method: "POST",
      body: patientBody({ id: testId("pac"), status: "borrado" }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.field, "status");
  });
});
