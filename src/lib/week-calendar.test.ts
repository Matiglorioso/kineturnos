import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAppDate, toAppDate } from "@/lib/date-utils";
import {
  filterAgendaAppointments,
  formatWeekRangeLabel,
  getAppointmentHeight,
  getAppointmentTopOffset,
  getHourSlots,
  getWeekDaysMonToSat,
  getWeekHourBounds,
  getWeekStartMonday,
  groupAppointmentsByAppDate,
  isDateInWorkWeek,
  isSameWorkWeek,
  layoutDayAppointments,
  shiftWeek,
} from "@/lib/week-calendar";
import type { Appointment } from "@/types";

// Semana de lunes 07-06-2027 a sábado 12-06-2027.
const MONDAY = parseAppDate("07-06-2027")!;
const WEDNESDAY = parseAppDate("09-06-2027")!;
const SUNDAY = parseAppDate("13-06-2027")!;

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

describe("semana de trabajo", () => {
  it("la semana empieza el lunes (también para un domingo)", () => {
    assert.equal(toAppDate(getWeekStartMonday(WEDNESDAY)), "07-06-2027");
    assert.equal(toAppDate(getWeekStartMonday(SUNDAY)), "07-06-2027");
  });

  it("lista de lunes a sábado", () => {
    assert.deepEqual(getWeekDaysMonToSat(MONDAY).map(toAppDate), [
      "07-06-2027",
      "08-06-2027",
      "09-06-2027",
      "10-06-2027",
      "11-06-2027",
      "12-06-2027",
    ]);
  });

  it("etiqueta el rango en español con mayúscula inicial", () => {
    assert.equal(formatWeekRangeLabel(MONDAY), "Lunes 7 jun - Sábado 12 jun");
  });

  it("una fecha pertenece a la semana de lunes a sábado (el domingo no)", () => {
    assert.equal(isDateInWorkWeek("07-06-2027", MONDAY), true);
    assert.equal(isDateInWorkWeek("12-06-2027", MONDAY), true);
    assert.equal(isDateInWorkWeek("13-06-2027", MONDAY), false);
    assert.equal(isDateInWorkWeek("06-06-2027", MONDAY), false);
    assert.equal(isDateInWorkWeek("fecha-invalida", MONDAY), false);
  });

  it("compara semanas y avanza/retrocede de a una", () => {
    assert.equal(isSameWorkWeek(MONDAY, WEDNESDAY), true);
    assert.equal(toAppDate(shiftWeek(MONDAY, 1)), "14-06-2027");
    assert.equal(toAppDate(shiftWeek(MONDAY, -1)), "31-05-2027");
    assert.equal(isSameWorkWeek(shiftWeek(MONDAY, 1), WEDNESDAY), false);
  });
});

describe("filtros y agrupación de la agenda", () => {
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

  it("agrupa por día de la semana, ordenado por hora, ignorando otros días", () => {
    const grouped = groupAppointmentsByAppDate(
      [
        appointment({ date: "07-06-2027", time: "15:00" }),
        appointment({ date: "07-06-2027", time: "09:00" }),
        appointment({ date: "2027-06-09", time: "10:00" }), // ISO legado
        appointment({ date: "13-06-2027", time: "10:00" }), // domingo
        appointment({ date: "14-06-2027", time: "10:00" }), // otra semana
      ],
      getWeekDaysMonToSat(MONDAY)
    );

    assert.equal(Object.keys(grouped).length, 6);
    assert.deepEqual(grouped["07-06-2027"].map((item) => item.time), ["09:00", "15:00"]);
    assert.equal(grouped["09-06-2027"].length, 1);
    assert.equal(grouped["12-06-2027"].length, 0);
  });
});

describe("grilla horaria de la vista semanal", () => {
  it("sin turnos usa el rango por defecto (08 a 19)", () => {
    assert.deepEqual(getWeekHourBounds([]), { startHour: 8, endHour: 19 });
  });

  it("se amplía con turnos fuera de rango, con un margen de 1 h y límites 7–21", () => {
    assert.deepEqual(
      getWeekHourBounds([appointment({ time: "07:00" }), appointment({ time: "20:00" })]),
      { startHour: 7, endHour: 21 }
    );
    assert.deepEqual(getWeekHourBounds([appointment({ time: "09:00" })]), {
      startHour: 7,
      endHour: 20,
    });
  });

  it("genera las horas y ubica cada turno según su hora", () => {
    assert.deepEqual(getHourSlots(8, 11), [8, 9, 10]);
    assert.equal(getAppointmentTopOffset("09:30", 8, 60), 90);
    assert.equal(getAppointmentHeight(80), 76);
    assert.equal(getAppointmentHeight(40), 52); // alto mínimo
  });
});

describe("columnas para turnos solapados (layoutDayAppointments)", () => {
  const columnsOf = (items: Appointment[]) =>
    Object.fromEntries(
      layoutDayAppointments(items).map(({ appointment, column, columnCount }) => [
        appointment.time,
        `${column}/${columnCount}`,
      ])
    );

  it("sin turnos no hay nada que ubicar", () => {
    assert.deepEqual(layoutDayAppointments([]), []);
  });

  it("turnos que no se pisan van en una sola columna", () => {
    assert.deepEqual(
      columnsOf([appointment({ time: "09:00" }), appointment({ time: "10:00" })]),
      { "09:00": "0/1", "10:00": "0/1" }
    );
  });

  it("turnos que se pisan se reparten en columnas y reutilizan la que se libera", () => {
    assert.deepEqual(
      columnsOf([
        appointment({ time: "11:00" }),
        appointment({ time: "10:00" }),
        appointment({ time: "10:30" }),
        appointment({ time: "15:00" }), // otro grupo, sin solapamiento
      ]),
      {
        "10:00": "0/2",
        "10:30": "1/2",
        "11:00": "0/2", // 10:00–11:00 ya terminó
        "15:00": "0/1",
      }
    );
  });
});
