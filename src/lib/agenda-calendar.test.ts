import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countAppointmentsByDay,
  formatCalendarMonth,
  formatDayCount,
  getDefaultDayForMonth,
  getMonthDays,
  getMonthGrid,
  getMonthTabs,
  isWeekend,
  shiftCalendarMonth,
} from "./agenda-calendar";

const october = { year: 2026, month: 9 };

describe("calendario de la agenda", () => {
  it("lista los días del mes", () => {
    const days = getMonthDays(october);
    assert.equal(days.length, 31);
    assert.equal(days[0], "01-10-2026");
    assert.equal(days[30], "31-10-2026");
    assert.equal(getMonthDays({ year: 2028, month: 1 }).length, 29);
  });

  it("arma la grilla de lunes a viernes con los días vecinos", () => {
    const grid = getMonthGrid(october);
    // 1/10/2026 es jueves: la grilla arranca el lunes 28/09.
    assert.deepEqual(grid[0][0], { date: "28-09-2026", inMonth: false });
    assert.deepEqual(grid[0][3], { date: "01-10-2026", inMonth: true });
    assert.equal(grid.length, 5);
    // El 31/10 es sábado: la última semana termina el viernes 30.
    assert.deepEqual(grid[4][4], { date: "30-10-2026", inMonth: true });
    assert.ok(grid.every((week) => week.length === 5));
  });

  it("la grilla no muestra semanas sin días hábiles del mes", () => {
    // 1/11/2026 es domingo: la primera semana sería toda de octubre y se omite.
    const grid = getMonthGrid({ year: 2026, month: 10 });
    assert.deepEqual(grid[0][0], { date: "02-11-2026", inMonth: true });
    assert.equal(grid.length, 5);
    assert.deepEqual(grid[4][0], { date: "30-11-2026", inMonth: true });
    assert.deepEqual(grid[4][1], { date: "01-12-2026", inMonth: false });
  });

  it("cambia de mes y de año", () => {
    assert.deepEqual(shiftCalendarMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
    assert.deepEqual(shiftCalendarMonth({ year: 2026, month: 0 }, -1), { year: 2025, month: 11 });
    assert.equal(formatCalendarMonth(october), "Octubre 2026");
  });

  it("las pestañas son el mes actual y los dos siguientes, y siguen al día elegido", () => {
    const labels = (tabs: { year: number; month: number }[]) => tabs.map(formatCalendarMonth);
    assert.deepEqual(labels(getMonthTabs(october, october)), [
      "Octubre 2026",
      "Noviembre 2026",
      "Diciembre 2026",
    ]);
    assert.deepEqual(labels(getMonthTabs(october, { year: 2026, month: 7 })), [
      "Agosto 2026",
      "Septiembre 2026",
      "Octubre 2026",
    ]);
    assert.deepEqual(labels(getMonthTabs(october, { year: 2027, month: 2 })), [
      "Enero 2027",
      "Febrero 2027",
      "Marzo 2027",
    ]);
  });

  it("al cambiar de mes elige hoy o el primer día hábil", () => {
    assert.equal(getDefaultDayForMonth(october, "16-10-2026"), "16-10-2026");
    // 1/11/2026 es domingo: el primer día hábil es el lunes 2.
    assert.equal(getDefaultDayForMonth({ year: 2026, month: 10 }, "16-10-2026"), "02-11-2026");
    // 1/8/2026 es sábado: el primer día hábil es el lunes 3.
    assert.equal(getDefaultDayForMonth({ year: 2026, month: 7 }, "16-10-2026"), "03-08-2026");
  });

  it("el sábado y el domingo no son días de atención", () => {
    assert.equal(isWeekend("31-10-2026"), true);
    assert.equal(isWeekend("01-11-2026"), true);
    assert.equal(isWeekend("30-10-2026"), false);
    assert.equal(isWeekend("02-11-2026"), false);
  });

  it("cuenta los turnos por día y abrevia desde 10", () => {
    const counts = countAppointmentsByDay([
      { date: "16-10-2026" },
      { date: "16-10-2026" },
      { date: "19-10-2026" },
    ]);
    assert.equal(counts.get("16-10-2026"), 2);
    assert.equal(counts.get("19-10-2026"), 1);
    assert.equal(counts.get("20-10-2026"), undefined);
    assert.equal(formatDayCount(9), "9");
    // Un día lleno tiene más de 20 turnos: se muestra el número real.
    assert.equal(formatDayCount(21), "21");
    assert.equal(formatDayCount(120), "99+");
  });
});
