import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agendaUrlForDate } from "./agenda-url";

describe("fecha de la agenda en la URL", () => {
  const today = "19-11-2026";

  it("otro día queda en ?fecha= (así sobrevive a recargar la página)", () => {
    assert.equal(agendaUrlForDate("24-11-2026", today), "/agenda?fecha=24-11-2026");
  });

  it("hoy deja la URL limpia", () => {
    assert.equal(agendaUrlForDate("19-11-2026", today), "/agenda");
  });

  it("una fecha inválida deja la URL limpia", () => {
    assert.equal(agendaUrlForDate("31-02-2026", today), "/agenda");
  });
});
