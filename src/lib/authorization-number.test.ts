import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duplicateAuthorizationNumberMessage } from "./authorization-number";

describe("número de autorización repetido en la misma obra social", () => {
  it("avisa con qué paciente ya está cargado", () => {
    assert.equal(
      duplicateAuthorizationNumberMessage("881612", "APROSS", { patientName: "Agustina Acosta", samePatient: false }),
      "El número 881612 ya está cargado en APROSS para Agustina Acosta. Revisá el número."
    );
  });

  it("si es del mismo paciente, lo dice así", () => {
    assert.equal(
      duplicateAuthorizationNumberMessage("881612", "APROSS", { patientName: "Agustina Acosta", samePatient: true }),
      "Este paciente ya tiene la autorización 881612 de APROSS. Editala en lugar de cargarla de nuevo."
    );
  });
});
