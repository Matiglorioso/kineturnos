import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { statusChangeConfirmation } from "./status-confirm";

const turno = { patientName: "Lucía Vega", date: "18-11-2026", time: "08:00" };

describe("confirmación antes de cambiar el estado de un turno", () => {
  it("atendido y ausente piden confirmar, avisando que no se puede volver atrás", () => {
    assert.deepEqual(statusChangeConfirmation(turno, "atendido"), {
      title: "Marcar turno como atendido",
      description:
        "Se marcará como atendido el turno de Lucía Vega el 18-11-2026 a las 08:00 hs. Después no se puede cambiar el estado.",
      confirmLabel: "Sí, marcar atendido",
      destructive: false,
    });
    assert.equal(statusChangeConfirmation(turno, "ausente")?.confirmLabel, "Sí, marcar ausente");
  });

  it("cancelar pide confirmar; confirmar se aplica directo", () => {
    assert.equal(statusChangeConfirmation(turno, "cancelado")?.destructive, true);
    assert.equal(statusChangeConfirmation(turno, "confirmado"), null);
  });
});
