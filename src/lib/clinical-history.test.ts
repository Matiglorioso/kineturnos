import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEditClinicalEntry,
  CLINICAL_TEXT_MAX_LENGTH,
  getClinicalEditDeadline,
  getSessionNumbers,
  parseClinicalEntryInput,
  sessionProfessionalError,
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

describe("validación del registro (RF11)", () => {
  it("la evolución es obligatoria", () => {
    assert.deepEqual(parseClinicalEntryInput({ evolution: "   " }), {
      error: "Escribí la evolución de la sesión.",
      field: "evolution",
    });
    assert.equal(parseClinicalEntryInput(null).error, "Datos inválidos.");
  });

  it("solo fecha, profesional y evolución (y el turno, si se abre desde la agenda)", () => {
    // Diagnóstico y plan ya no se cargan en la evolución: si llegan, se ignoran.
    assert.deepEqual(
      parseClinicalEntryInput({ evolution: " Mejora del rango ", diagnosis: "Lumbalgia", treatment: "RPG" }),
      {
        input: {
          appointmentId: null,
          date: null,
          evolution: "Mejora del rango",
          professionalId: null,
        },
      }
    );
  });

  it("limita el largo de la evolución", () => {
    const result = parseClinicalEntryInput({ evolution: "x".repeat(CLINICAL_TEXT_MAX_LENGTH + 1) });
    assert.equal(result.field, "evolution");
  });

  it("valida el formato de la fecha", () => {
    assert.equal(parseClinicalEntryInput({ evolution: "ok", date: "2026-13-40" }).field, "date");
    assert.equal(
      parseClinicalEntryInput({ evolution: "ok", date: "29-09-2026" }).input?.date,
      "29-09-2026"
    );
  });
});

describe("numeración de sesiones", () => {
  it("la sesión 1 es la más vieja; en el mismo día desempata la hora de carga", () => {
    const numbers = getSessionNumbers([
      { id: "c", date: "29-09-2026", createdAt: "2026-09-29T15:00:00.000Z" },
      { id: "a", date: "15-09-2026", createdAt: "2026-09-15T12:00:00.000Z" },
      { id: "b", date: "29-09-2026", createdAt: "2026-09-29T10:00:00.000Z" },
    ]);
    assert.deepEqual([...numbers.entries()], [["a", 1], ["b", 2], ["c", 3]]);
  });
});

describe("plazo de corrección", () => {
  it("la fecha límite de edición es 24 h después de cargar", () => {
    assert.equal(
      getClinicalEditDeadline(new Date("2026-09-29T12:00:00Z")).toISOString(),
      "2026-09-30T12:00:00.000Z"
    );
  });
});

describe("profesional de una sesión sin turno", () => {
  const sinTurno = { appointmentId: null, professionalId: null };

  it("el Profesional queda como el de la sesión", () => {
    assert.equal(sessionProfessionalError({ professionalId: "pro1" }, sinTurno), null);
  });

  it("Administración tiene que elegir qué profesional atendió", () => {
    assert.deepEqual(sessionProfessionalError({ professionalId: null }, sinTurno), {
      error: "Elegí qué profesional atendió la sesión.",
      field: "professionalId",
    });
    assert.equal(sessionProfessionalError({ professionalId: null }, { appointmentId: null, professionalId: "pro1" }), null);
  });

  it("con turno, el profesional sale del turno", () => {
    assert.equal(sessionProfessionalError({ professionalId: null }, { appointmentId: "t1", professionalId: null }), null);
  });
});
