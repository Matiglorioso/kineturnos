import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAgendaAppointments, sortAppointmentsByTime } from "@/lib/agenda-list";
import type { Appointment } from "@/types";

let nextId = 0;
const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: `a-${++nextId}`,
  patientId: "p-1",
  patientName: "Paciente",
  professionalId: "pro-1",
  professionalName: "Profesional",
  date: "07-06-2027",
  time: "10:00",
  status: "pendiente",
  sessionType: "Control",
  ...overrides,
});

describe("orden y filtros de la agenda", () => {
  it("ordena por hora", () => {
    const items = [appointment({ time: "15:00" }), appointment({ time: "08:00" }), appointment({ time: "10:00" })];
    assert.deepEqual(sortAppointmentsByTime(items).map((item) => item.time), ["08:00", "10:00", "15:00"]);
  });

  it("filtra por estado y por profesional", () => {
    const items = [
      appointment({ status: "pendiente", professionalId: "pro-1" }),
      appointment({ status: "confirmado", professionalId: "pro-1" }),
      appointment({ status: "pendiente", professionalId: "pro-2" }),
    ];

    assert.equal(
      filterAgendaAppointments(items, { statusFilter: "todos", professionalFilter: "todos" }).length,
      3
    );
    assert.equal(
      filterAgendaAppointments(items, { statusFilter: "pendiente", professionalFilter: "todos" }).length,
      2
    );
    assert.equal(
      filterAgendaAppointments(items, { statusFilter: "pendiente", professionalFilter: "pro-2" }).length,
      1
    );
  });

  it("busca por nombre del paciente (sin mayúsculas ni tildes), combinado con los demás filtros", () => {
    const items = [
      appointment({ status: "pendiente", patientName: "Martín Gómez" }),
      appointment({ status: "confirmado", patientName: "Martín Gómez" }),
      appointment({ status: "pendiente", patientName: "Ana Ruiz" }),
    ];
    const base = { statusFilter: "todos" as const, professionalFilter: "todos" };

    assert.equal(filterAgendaAppointments(items, { ...base, patientQuery: "martin gom" }).length, 2);
    assert.equal(
      filterAgendaAppointments(items, { ...base, statusFilter: "pendiente", patientQuery: "MARTÍN" })
        .length,
      1
    );
    assert.equal(filterAgendaAppointments(items, { ...base, patientQuery: "  " }).length, 3);
  });
});
