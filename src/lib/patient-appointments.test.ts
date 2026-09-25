import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countPatientAppointments,
  getPatientAppointments,
  getPatientLastAppointmentDate,
  removePatientAppointments,
  splitPatientAppointments,
} from "@/lib/patient-appointments";
import type { Appointment } from "@/types";

// Jueves 24-09-2026 a las 18:00 ART.
const now = new Date("2026-09-24T21:00:00Z");

describe("último turno del paciente (M6)", () => {
  it("con un turno futuro pendiente y uno atendido pasado, muestra el atendido", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "15-10-2026", status: "pendiente" },
          { date: "10-09-2026", status: "atendido" },
        ],
        now
      ),
      "10-09-2026"
    );
  });

  it("ignora cancelados y ausentes aunque sean más recientes", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "01-09-2026", status: "atendido" },
          { date: "20-09-2026", status: "cancelado" },
          { date: "22-09-2026", status: "ausente" },
        ],
        now
      ),
      "01-09-2026"
    );
  });

  it("toma el atendido más reciente en orden cronológico real", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "31-01-2026", status: "atendido" },
          { date: "02-09-2026", status: "atendido" },
          { date: "15-06-2026", status: "atendido" },
        ],
        now
      ),
      "02-09-2026"
    );
  });

  it("un atendido de hoy cuenta", () => {
    assert.equal(
      getPatientLastAppointmentDate([{ date: "24-09-2026", status: "atendido" }], now),
      "24-09-2026"
    );
  });

  it("sin atendidos no hay último turno", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "30-09-2026", status: "confirmado" },
          { date: "01-09-2026", status: "cancelado" },
        ],
        now
      ),
      null
    );
    assert.equal(getPatientLastAppointmentDate([], now), null);
  });
});

describe("turnos de un paciente", () => {
  const appointment = (overrides: Partial<Appointment>): Appointment => ({
    id: "a",
    patientId: "p-1",
    patientName: "Ana",
    professionalId: "pro-1",
    professionalName: "Camila",
    date: "24-09-2026",
    time: "10:00",
    status: "pendiente",
    sessionType: "Control",
    ...overrides,
  });
  // 24-09-2026 a las 12:00 (hora local del navegador).
  const reference = new Date(2026, 8, 24, 12, 0);
  const items = [
    appointment({ id: "manana", date: "25-09-2026" }),
    appointment({ id: "hoy-tarde", time: "15:00", status: "confirmado" }),
    appointment({ id: "hoy-temprano", time: "09:00" }),
    appointment({ id: "futuro-cancelado", date: "30-09-2026", status: "cancelado" }),
    appointment({ id: "atendido", date: "10-09-2026", status: "atendido" }),
    appointment({ id: "otro-paciente", patientId: "p-2" }),
  ];

  it("filtra, cuenta y quita los turnos del paciente", () => {
    assert.equal(countPatientAppointments(items, "p-1"), 5);
    assert.equal(getPatientAppointments(items, "p-2").length, 1);
    assert.deepEqual(
      removePatientAppointments(items, "p-1").map((item) => item.id),
      ["otro-paciente"]
    );
  });

  it("separa próximos (activos desde ahora, en orden) de pasados (más reciente primero)", () => {
    const { upcoming, past } = splitPatientAppointments(items, "p-1", reference);

    assert.deepEqual(upcoming.map((item) => item.id), ["hoy-tarde", "manana"]);
    // Un cancelado futuro no es "próximo": va al historial.
    assert.deepEqual(past.map((item) => item.id), [
      "futuro-cancelado",
      "hoy-temprano",
      "atendido",
    ]);
  });
});
