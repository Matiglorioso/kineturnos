import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEditClinicalEntry,
  CLINICAL_TEXT_MAX_LENGTH,
  getClinicalSummary,
  parseClinicalEntryInput,
} from "./clinical-history";

describe("edición de registros de historia clínica", () => {
  const createdAt = new Date("2026-09-29T12:00:00Z");
  const entry = { authorId: "u1", createdAt };
  const hoursLater = (hours: number) => new Date(createdAt.getTime() + hours * 3600_000);

  it("el autor puede corregirlo durante 24 h", () => {
    assert.equal(canEditClinicalEntry(entry, "u1", hoursLater(0)), true);
    // El reloj del servidor puede ir apenas detrás del de la base.
    assert.equal(canEditClinicalEntry(entry, "u1", hoursLater(-0.001)), true);
    assert.equal(canEditClinicalEntry(entry, "u1", hoursLater(23.9)), true);
  });

  it("a las 24 h queda cerrado", () => {
    assert.equal(canEditClinicalEntry(entry, "u1", hoursLater(24)), false);
    assert.equal(canEditClinicalEntry(entry, "u1", hoursLater(72)), false);
  });

  it("otro usuario nunca lo edita, aunque sea administrador", () => {
    assert.equal(canEditClinicalEntry(entry, "u2", hoursLater(1)), false);
  });
});

describe("diagnóstico y plan vigentes", () => {
  it("toma el registro más reciente que cargó cada uno", () => {
    const summary = getClinicalSummary([
      { date: "29-09-2026", diagnosis: null, treatment: null },
      { date: "22-09-2026", diagnosis: null, treatment: "Fortalecimiento, 3 veces por semana" },
      { date: "15-09-2026", diagnosis: "Esguince de tobillo grado II", treatment: "Reposo" },
    ]);
    assert.deepEqual(summary, {
      diagnosis: { text: "Esguince de tobillo grado II", date: "15-09-2026" },
      treatment: { text: "Fortalecimiento, 3 veces por semana", date: "22-09-2026" },
    });
  });

  it("sin registros no hay diagnóstico ni plan", () => {
    assert.deepEqual(getClinicalSummary([]), { diagnosis: null, treatment: null });
  });
});

describe("validación del registro (RF11)", () => {
  it("la evolución es obligatoria", () => {
    assert.deepEqual(parseClinicalEntryInput({ evolution: "   " }), {
      error: "Escribí la evolución de la sesión.",
      field: "evolution",
    });
    assert.equal(parseClinicalEntryInput(null).error, "Datos inválidos.");
  });

  it("diagnóstico, plan y turno son opcionales; los vacíos quedan en null", () => {
    assert.deepEqual(parseClinicalEntryInput({ evolution: " Mejora del rango ", diagnosis: "" }), {
      input: {
        appointmentId: null,
        date: null,
        diagnosis: null,
        treatment: null,
        evolution: "Mejora del rango",
      },
    });
  });

  it("limita el largo de cada texto", () => {
    const result = parseClinicalEntryInput({
      evolution: "ok",
      diagnosis: "x".repeat(CLINICAL_TEXT_MAX_LENGTH + 1),
    });
    assert.equal(result.field, "diagnosis");
  });

  it("valida el formato de la fecha", () => {
    assert.equal(parseClinicalEntryInput({ evolution: "ok", date: "2026-13-40" }).field, "date");
    assert.equal(
      parseClinicalEntryInput({ evolution: "ok", date: "29-09-2026" }).input?.date,
      "29-09-2026"
    );
  });
});
