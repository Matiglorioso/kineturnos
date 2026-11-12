import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeCoverageAlerts, summarizeMonthInsuranceSessions } from "@/lib/dashboard-shortcuts";
import type { Appointment, Patient } from "@/types";

const patient = (overrides: Partial<Patient>): Patient => ({
  id: "p",
  name: "Paciente",
  dni: "1",
  phone: "1",
  insurance: "Particular",
  status: "activo",
  ...overrides,
});

const appointment = (overrides: Partial<Appointment>): Appointment => ({
  id: Math.random().toString(36),
  patientId: "p",
  patientName: "Paciente",
  professionalId: "pro",
  professionalName: "Profesional",
  date: "10-11-2026",
  time: "10:00",
  status: "atendido",
  sessionType: "Control",
  ...overrides,
});

describe("atajo de autorizaciones", () => {
  it("cuenta los pacientes activos sin cobertura y los por renovar", () => {
    const patients = [
      patient({ id: "a", coverage: { kind: "agotada", tone: "alert", label: "Agotada" } }),
      patient({ id: "b", coverage: { kind: "vencida", tone: "alert", label: "Vencida" } }),
      patient({ id: "c", coverage: { kind: "vigente", tone: "warning", label: "Por renovar" } }),
      patient({ id: "d", coverage: { kind: "vigente", tone: "ok", label: "Vigente" } }),
      patient({ id: "e", status: "inactivo", coverage: { kind: "agotada", tone: "alert", label: "Agotada" } }),
    ];
    assert.deepEqual(summarizeCoverageAlerts(patients), { toResolve: 2, toRenew: 1 });
  });
});

describe("atajo de la planilla del mes", () => {
  const patients = [
    patient({ id: "apross", insurance: "APROSS" }),
    patient({ id: "osde", insurance: "OSDE" }),
    patient({ id: "part", insurance: "Particular" }),
  ];

  it("suma las sesiones atendidas del mes con obra social, de mayor a menor", () => {
    const appointments = [
      appointment({ patientId: "apross", date: "02-11-2026" }),
      appointment({ patientId: "apross", date: "30-11-2026" }),
      appointment({ patientId: "osde", date: "12-11-2026" }),
      // No cuentan: particular, otro mes, no atendido.
      appointment({ patientId: "part", date: "12-11-2026" }),
      appointment({ patientId: "osde", date: "31-10-2026" }),
      appointment({ patientId: "osde", date: "12-11-2026", status: "ausente" }),
    ];
    assert.deepEqual(summarizeMonthInsuranceSessions(appointments, patients, "12-11-2026"), {
      total: 3,
      byInsurance: [
        { name: "APROSS", count: 2 },
        { name: "OSDE", count: 1 },
      ],
    });
  });

  it("sin sesiones, en cero", () => {
    assert.deepEqual(summarizeMonthInsuranceSessions([], patients, "12-11-2026"), { total: 0, byInsurance: [] });
  });
});
