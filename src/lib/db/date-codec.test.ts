import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appDateToDb,
  appTimeToDb,
  dbDateToApp,
  dbTimeToApp,
  maxDbDate,
  optionalAppDateToDb,
  optionalDbDateToApp,
} from "./date-codec";

describe("date-codec: fechas", () => {
  it("convierte dd-MM-yyyy a medianoche UTC y vuelve", () => {
    const date = appDateToDb("05-03-2027");
    assert.equal(date.toISOString(), "2027-03-05T00:00:00.000Z");
    assert.equal(dbDateToApp(date), "05-03-2027");
  });

  it("acepta ISO yyyy-MM-dd (datos legados)", () => {
    assert.equal(dbDateToApp(appDateToDb("2026-01-15")), "15-01-2026");
    assert.equal(dbDateToApp(appDateToDb("2026-01-15T10:00:00.000Z")), "15-01-2026");
  });

  it("rechaza fechas imposibles o mal formadas", () => {
    assert.throws(() => appDateToDb("31-02-2026"), /Fecha inválida/);
    assert.throws(() => appDateToDb("2026/01/15"), /Fecha inválida/);
    assert.throws(() => appDateToDb(""), /Fecha inválida/);
  });

  it("opcionales: vacío es null / undefined", () => {
    assert.equal(optionalAppDateToDb(undefined), null);
    assert.equal(optionalAppDateToDb("  "), null);
    assert.equal(optionalDbDateToApp(null), undefined);
  });

  it("maxDbDate ordena cronológicamente (no lexicográficamente)", () => {
    const max = maxDbDate([
      appDateToDb("31-01-2026"),
      appDateToDb("01-12-2026"),
      appDateToDb("15-06-2026"),
    ]);
    assert.equal(max && dbDateToApp(max), "01-12-2026");
    assert.equal(maxDbDate([]), null);
  });
});

describe("date-codec: horas", () => {
  it("convierte HH:mm a TIME y vuelve", () => {
    const time = appTimeToDb("09:00");
    assert.equal(time.toISOString(), "1970-01-01T09:00:00.000Z");
    assert.equal(dbTimeToApp(time), "09:00");
    assert.equal(dbTimeToApp(appTimeToDb("14:30:00")), "14:30");
  });

  it("rechaza horas inválidas", () => {
    assert.throws(() => appTimeToDb("24:00"), /Hora inválida/);
    assert.throws(() => appTimeToDb("9"), /Hora inválida/);
  });
});
