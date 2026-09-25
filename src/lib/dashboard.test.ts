import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRecentActivityItems } from "@/lib/dashboard-activity";
import {
  getActivePatientsCount,
  getAppointmentStatusCounts,
  getTodayDashboardMetrics,
  getUpcomingAppointments,
} from "@/lib/dashboard-stats";
import type { Appointment, Patient } from "@/types";

const TODAY = "24-09-2026";

let nextId = 0;
const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: `turno-${++nextId}`,
  patientId: "p-1",
  patientName: "Ana Torres",
  professionalId: "pro-1",
  professionalName: "Camila Vargas",
  date: TODAY,
  time: "10:00",
  status: "pendiente",
  sessionType: "Control",
  ...overrides,
});

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: "p-1",
  name: "Ana Torres",
  dni: "30111222",
  phone: "11 5555-5555",
  insurance: "Particular",
  status: "activo",
  ...overrides,
});

describe("métricas del día", () => {
  it("cuenta los turnos de hoy por estado (también fechas ISO legadas)", () => {
    const metrics = getTodayDashboardMetrics(
      [
        appointment({ status: "confirmado" }),
        appointment({ status: "pendiente" }),
        appointment({ date: "2026-09-24", status: "cancelado" }),
        appointment({ date: "25-09-2026", status: "confirmado" }), // mañana
      ],
      TODAY
    );

    assert.equal(metrics.todayTotal, 3);
    assert.equal(metrics.todayConfirmed, 1);
    assert.equal(metrics.todayPending, 1);
    assert.equal(metrics.todayCancelled, 1);
  });

  it("cuenta pacientes activos y turnos por estado", () => {
    assert.equal(
      getActivePatientsCount([patient(), patient({ id: "p-2", status: "inactivo" })]),
      1
    );
    assert.deepEqual(
      getAppointmentStatusCounts([
        appointment({ status: "atendido" }),
        appointment({ status: "atendido" }),
        appointment({ status: "ausente" }),
      ]),
      { pendiente: 0, confirmado: 0, atendido: 2, cancelado: 0, ausente: 1 }
    );
  });
});

describe("próximos turnos", () => {
  // 24-09-2026 a las 11:00 (hora local del navegador).
  const now = new Date(2026, 8, 24, 11, 0);

  it("solo activos desde ahora, ordenados cronológicamente y con límite", () => {
    const upcoming = getUpcomingAppointments(
      [
        appointment({ id: "tarde", date: "02-10-2026", time: "09:00" }),
        appointment({ id: "ya-paso", time: "09:00" }),
        appointment({ id: "cancelado", time: "12:00", status: "cancelado" }),
        appointment({ id: "pronto", time: "12:00", status: "confirmado" }),
        appointment({ id: "manana", date: "25-09-2026", time: "08:00" }),
      ],
      2,
      now
    );

    assert.deepEqual(upcoming.map((item) => item.id), ["pronto", "manana"]);
  });
});

describe("actividad reciente", () => {
  it("genera un mensaje por estado relevante y omite los pendientes", () => {
    const items = getRecentActivityItems(
      [],
      [
        appointment({ id: "a-1000", status: "confirmado" }),
        appointment({ id: "a-2000", status: "cancelado" }),
        appointment({ id: "a-3000", status: "atendido" }),
        appointment({ id: "a-4000", status: "ausente" }),
        appointment({ id: "a-5000", status: "pendiente" }),
      ]
    );

    assert.deepEqual(
      items.map((item) => item.type),
      ["cancellation", "appointment", "cancellation", "confirmation"]
    );
    assert.match(items[1].message, /Ana Torres fue atendido por Camila Vargas/);
    assert.match(items[0].message, /marcado como ausente \(24-09-2026\)/);
  });

  it("incluye pacientes nuevos por fecha de alta y respeta el máximo", () => {
    const items = getRecentActivityItems(
      [
        patient({ id: "p-1", name: "Viejo", createdAt: "01-01-2026" }),
        patient({ id: "p-2", name: "Nuevo", createdAt: "20-09-2026" }),
        patient({ id: "sin-fecha", name: "Sin fecha" }),
      ],
      [],
      1
    );

    assert.equal(items.length, 1);
    assert.equal(items[0].message, "Nuevo paciente registrado: Nuevo");
  });

  // B2 (reporte de testing): la hora de "confirmado"/"cancelado" sale del id
  // del turno (momento de creación), no del cambio de estado.
  it.todo("B2: la actividad usa el momento del cambio de estado");
});
