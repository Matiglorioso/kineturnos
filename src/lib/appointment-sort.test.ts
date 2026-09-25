import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareAppointmentsByDateTime,
  sortAppointmentsByDateTime,
} from "@/lib/appointment-sort";

describe("orden de turnos (B1)", () => {
  it("ordena por fecha real, no por string dd-MM-yyyy", () => {
    const sorted = sortAppointmentsByDateTime([
      { date: "02-10-2026", time: "09:00" },
      { date: "15-09-2026", time: "09:00" },
      { date: "01-01-2027", time: "09:00" },
    ]);

    assert.deepEqual(
      sorted.map((item) => item.date),
      ["15-09-2026", "02-10-2026", "01-01-2027"]
    );
  });

  it("a igual fecha, ordena por hora", () => {
    const sorted = sortAppointmentsByDateTime([
      { date: "15-09-2026", time: "14:00" },
      { date: "15-09-2026", time: "09:00" },
    ]);

    assert.deepEqual(
      sorted.map((item) => item.time),
      ["09:00", "14:00"]
    );
  });

  it("trata igual una fecha legada en ISO", () => {
    assert.equal(
      compareAppointmentsByDateTime(
        { date: "2026-09-15", time: "09:00" },
        { date: "15-09-2026", time: "09:00" }
      ),
      0
    );
  });

  it("no muta el array original", () => {
    const items = [
      { date: "02-10-2026", time: "09:00" },
      { date: "15-09-2026", time: "09:00" },
    ];
    sortAppointmentsByDateTime(items);
    assert.equal(items[0].date, "02-10-2026");
  });
});
