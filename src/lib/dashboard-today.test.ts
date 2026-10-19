import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Appointment, AppointmentStatus } from "@/types";
import {
  getDaySchedule,
  getNextWorkday,
  getPendingAttendance,
  getUnconfirmed,
  greetingFor,
  phoneHref,
  summarizeDay,
} from "./dashboard-today";

let counter = 0;
function appointment(date: string, time: string, status: AppointmentStatus): Appointment {
  counter += 1;
  return {
    id: `t${counter}`,
    patientId: "p",
    patientName: `Paciente ${counter}`,
    professionalId: "pro",
    professionalName: "Camila Vargas",
    date,
    time,
    status,
    sessionType: "Control",
  };
}

const TODAY = "21-10-2026"; // miércoles
const at = (hours: number) => hours * 60;

describe("agenda de hoy en el panel", () => {
  const items = [
    appointment(TODAY, "11:00", "confirmado"),
    appointment(TODAY, "09:00", "atendido"),
    appointment(TODAY, "10:00", "cancelado"),
    appointment(TODAY, "15:00", "pendiente"),
    appointment("22-10-2026", "09:00", "pendiente"),
  ];

  it("lista los turnos del día por horario, sin cancelados", () => {
    assert.deepEqual(
      getDaySchedule(items, TODAY).map((item) => item.time),
      ["09:00", "11:00", "15:00"]
    );
  });

  it("resume cuántos hay, cuántos se atendieron y cuántos faltan", () => {
    assert.deepEqual(summarizeDay(getDaySchedule(items, TODAY), at(10)), { total: 3, attended: 1, upcoming: 2 });
    assert.deepEqual(summarizeDay(getDaySchedule(items, TODAY), at(12)), { total: 3, attended: 1, upcoming: 1 });
  });
});

describe("para hacer", () => {
  it("asistencia sin registrar: turnos terminados que siguen activos, los más recientes primero", () => {
    const items = [
      appointment("20-10-2026", "09:00", "confirmado"),
      appointment(TODAY, "09:00", "pendiente"),
      appointment(TODAY, "11:00", "confirmado"), // termina a las 12
      appointment(TODAY, "08:00", "atendido"),
      appointment("10-08-2026", "09:00", "pendiente"), // más de 30 días
      appointment("22-10-2026", "09:00", "pendiente"),
    ];
    assert.deepEqual(
      getPendingAttendance(items, TODAY, at(11) + 30).map((item) => `${item.date} ${item.time}`),
      ["21-10-2026 09:00", "20-10-2026 09:00"]
    );
    assert.equal(getPendingAttendance(items, TODAY, at(12)).length, 3);
  });

  it("confirmar: los pendientes del próximo día de atención", () => {
    assert.equal(getNextWorkday(TODAY), "22-10-2026");
    assert.equal(getNextWorkday("24-10-2026"), "26-10-2026", "el sábado pasa al lunes");
    const items = [
      appointment("22-10-2026", "10:00", "pendiente"),
      appointment("22-10-2026", "09:00", "pendiente"),
      appointment("22-10-2026", "11:00", "confirmado"),
    ];
    assert.deepEqual(
      getUnconfirmed(items, "22-10-2026").map((item) => item.time),
      ["09:00", "10:00"]
    );
  });

  it("saludo y teléfono para llamar", () => {
    assert.equal(greetingFor(at(9)), "Buen día");
    assert.equal(greetingFor(at(15)), "Buenas tardes");
    assert.equal(greetingFor(at(21)), "Buenas noches");
    assert.equal(phoneHref("+54 11 2345-6789"), "tel:+541123456789");
  });
});
