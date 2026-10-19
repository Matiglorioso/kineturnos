import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { addDays } from "date-fns";
import { getTodayAppDate, parseAppDate, toAppDate } from "../../src/lib/date-utils";
import {
  api,
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  login,
  prisma,
  testId,
  uniqueDigits,
  type Auth,
} from "./helpers";

type Insurance = { id: string; name: string; active: boolean; patientCount: number };
type Coverage = { kind: string; tone: string; label: string };
type Authorization = { id: string; used: number; sessions: number; state: string };

function daysAgo(days: number): string {
  return toAppDate(addDays(parseAppDate(getTodayAppDate())!, -days));
}

let admin: Auth;
let profe: Auth;

before(async () => {
  admin = await login("admin@kineturnos.local");
  profe = await login("profe@kineturnos.local");
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

async function createInsurance(name = testId("os")) {
  const res = await api<Insurance>("/api/obras-sociales", {
    method: "POST",
    auth: admin,
    body: { name },
  });
  assert.equal(res.status, 201, res.error);
  return res.data!;
}

async function patientWith(insurance: Insurance) {
  const patient = await createPatient();
  await prisma.paciente.update({
    where: { id: patient.id },
    data: { obraSocialId: insurance.id, obraSocial: insurance.name },
  });
  return patient;
}

describe("catálogo de obras sociales", () => {
  it("alta, nombre repetido (sin importar espacios ni mayúsculas) y renombre", async () => {
    const name = testId("os");
    const insurance = await createInsurance(name);

    const dup = await api("/api/obras-sociales", {
      method: "POST",
      auth: admin,
      body: { name: `  ${name.toUpperCase()} ` },
    });
    assert.equal(dup.status, 409);
    assert.equal(dup.field, "name");

    const patient = await patientWith(insurance);
    const renamed = await api<Insurance>(`/api/obras-sociales/${insurance.id}`, {
      method: "PATCH",
      auth: admin,
      body: { name: `${name} plan`, active: true },
    });
    assert.equal(renamed.status, 200, renamed.error);
    const stored = await prisma.paciente.findUniqueOrThrow({ where: { id: patient.id } });
    assert.equal(stored.obraSocial, `${name} plan`, "el nombre se actualiza en los pacientes");
  });

  it("no se elimina si la usa un paciente (409); el profesional no la gestiona (403)", async () => {
    const insurance = await createInsurance();
    await patientWith(insurance);
    assert.equal(
      (await api(`/api/obras-sociales/${insurance.id}`, { method: "DELETE", auth: admin })).status,
      409
    );
    assert.equal(
      (await api("/api/obras-sociales", { method: "POST", auth: profe, body: { name: testId("os") } })).status,
      403
    );
    assert.equal((await api("/api/obras-sociales", { auth: profe })).status, 200);
  });
});

describe("obra social del paciente", () => {
  it("se elige del catálogo, con número de afiliado y plan", async () => {
    const insurance = await createInsurance();
    const res = await api<{ insurance: string; insuranceId: string; affiliateNumber: string }>(
      "/api/patients",
      {
        method: "POST",
        auth: admin,
        body: {
          id: testId("pac"),
          firstName: "Test",
          lastName: "Cobertura",
          dni: uniqueDigits(8),
          phone: "+54 11 5555-5555",
          insuranceId: insurance.id,
          affiliateNumber: "123456/01",
          insurancePlan: "SAID",
        },
      }
    );
    assert.equal(res.status, 201, res.error);
    assert.equal(res.data?.insurance, insurance.name);
    assert.equal(res.data?.insuranceId, insurance.id);
    assert.equal(res.data?.affiliateNumber, "123456/01");
  });
});

describe("autorizaciones y consumo de sesiones (RF14-RF15)", () => {
  it("un paciente particular no puede tener autorizaciones (400)", async () => {
    const patient = await createPatient();
    const res = await api(`/api/patients/${patient.id}/autorizaciones`, {
      method: "POST",
      auth: admin,
      body: { state: "aprobada", sessions: 10, validFrom: daysAgo(5) },
    });
    assert.equal(res.status, 400);
    assert.equal(res.field, "insuranceId");
  });

  it("descuenta sesiones al atender, avisa al agotarse y la planilla las lista", async () => {
    const insurance = await createInsurance();
    const patient = await patientWith(insurance);
    const professional = await createProfessional();

    // Una sesión atendida antes de cargar la autorización: la consume al crearla.
    const before = await createAppointmentInDb({
      patient,
      professional,
      date: daysAgo(6),
      time: "09:00",
      status: "atendido",
    });

    const created = await api<Authorization>(`/api/patients/${patient.id}/autorizaciones`, {
      method: "POST",
      auth: admin,
      body: { number: "A-1", state: "aprobada", sessions: 2, validFrom: daysAgo(10) },
    });
    assert.equal(created.status, 201, created.error);
    assert.equal(created.data?.used, 1);

    // Marcar atendido desde la API descuenta otra sesión.
    const second = await createAppointmentInDb({ patient, professional, date: daysAgo(3), time: "10:00" });
    const attended = await api(`/api/appointments/${second.id}`, {
      method: "PATCH",
      auth: admin,
      body: { status: "atendido" },
    });
    assert.equal(attended.status, 200, attended.error);

    const read = await api<{ authorizations: Authorization[]; coverage: Coverage }>(
      `/api/patients/${patient.id}/autorizaciones`,
      { auth: admin }
    );
    assert.equal(read.data?.authorizations[0].used, 2);
    assert.equal(read.data?.coverage.kind, "agotada");

    // Sin sesiones disponibles, la siguiente atendida queda sin autorización.
    const third = await createAppointmentInDb({ patient, professional, date: daysAgo(1), time: "11:00" });
    await api(`/api/appointments/${third.id}`, { method: "PATCH", auth: admin, body: { status: "atendido" } });
    const thirdStored = await prisma.turno.findUniqueOrThrow({ where: { id: third.id } });
    assert.equal(thirdStored.autorizacionId, null);

    // No se puede bajar la cantidad por debajo de lo usado.
    const tooFew = await api(`/api/patients/${patient.id}/autorizaciones/${created.data!.id}`, {
      method: "PATCH",
      auth: admin,
      body: { number: "A-1", state: "aprobada", sessions: 1, validFrom: daysAgo(10) },
    });
    assert.equal(tooFew.status, 400);
    assert.equal(tooFew.field, "sessions");

    // Ampliarla toma la sesión que había quedado afuera.
    const widened = await api<Authorization>(`/api/patients/${patient.id}/autorizaciones/${created.data!.id}`, {
      method: "PATCH",
      auth: admin,
      body: { number: "A-1", state: "aprobada", sessions: 10, validFrom: daysAgo(10) },
    });
    assert.equal(widened.data?.used, 3);

    // La planilla del mes lista las sesiones del paciente con su autorización.
    // El mes de la última sesión (a principio de mes, las demás pueden caer en el anterior).
    const month = daysAgo(1).split("-");
    const report = await api<{ rows: { patientId: string; dates: string[]; authorizationNumbers: string[] }[] }>(
      `/api/obras-sociales/${insurance.id}/planilla?mes=${month[2]}-${month[1]}`,
      { auth: admin }
    );
    assert.equal(report.status, 200, report.error);
    const row = report.data?.rows.find((item) => item.patientId === patient.id);
    assert.ok(row, "el paciente aparece en la planilla");
    assert.deepEqual(row?.authorizationNumbers, ["A-1"]);
    assert.ok((row?.dates.length ?? 0) >= 1);

    // Al borrar la autorización, las sesiones quedan libres.
    const removed = await api(`/api/patients/${patient.id}/autorizaciones/${created.data!.id}`, {
      method: "DELETE",
      auth: admin,
    });
    assert.equal(removed.status, 200, removed.error);
    const released = await prisma.turno.findUniqueOrThrow({ where: { id: before.id } });
    assert.equal(released.autorizacionId, null);
  });

  it("la planilla exige un mes válido y el profesional no la ve", async () => {
    const insurance = await createInsurance();
    assert.equal(
      (await api(`/api/obras-sociales/${insurance.id}/planilla?mes=2026-13`, { auth: admin })).status,
      400
    );
    assert.equal(
      (await api(`/api/obras-sociales/${insurance.id}/planilla?mes=2026-10`, { auth: profe })).status,
      403
    );
  });

  it("la lista de pacientes trae el estado de la cobertura", async () => {
    const insurance = await createInsurance();
    const patient = await patientWith(insurance);
    await api(`/api/patients/${patient.id}/autorizaciones`, {
      method: "POST",
      auth: admin,
      body: { state: "pendiente", sessions: 10, validFrom: daysAgo(1) },
    });
    const res = await api<{ id: string; coverage?: Coverage }>(`/api/patients/${patient.id}`, { auth: admin });
    assert.equal(res.status, 200, res.error);
    assert.equal(res.data?.coverage?.kind, "pendiente");
    assert.equal(res.data?.coverage?.label, "Autorización en trámite");
  });
});
