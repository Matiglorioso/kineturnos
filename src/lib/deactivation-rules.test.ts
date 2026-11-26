import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeAppointmentsBlockMessage,
  appointmentsOnRemovedDays,
  removedDaysBlockMessage,
  removedWorkDays,
} from "./deactivation-rules";

describe("desactivar con turnos activos", () => {
  it("sin turnos activos se puede desactivar", () => {
    assert.equal(activeAppointmentsBlockMessage("paciente", 0), null);
  });

  it("con turnos activos se bloquea y dice cuántos (en singular y en plural)", () => {
    assert.equal(
      activeAppointmentsBlockMessage("paciente", 1),
      "No se puede desactivar al paciente porque tiene 1 turno activo (pendiente o confirmado). Cancelalo o registrá su asistencia antes de desactivarlo."
    );
    assert.equal(
      activeAppointmentsBlockMessage("profesional", 3),
      "No se puede desactivar al profesional porque tiene 3 turnos activos (pendientes o confirmados). Cancelalos o registrá su asistencia antes de desactivarlo."
    );
  });
});

describe("sacar días de atención con turnos", () => {
  it("detecta los días que se sacan, sin importar tildes ni mayúsculas", () => {
    assert.deepEqual(removedWorkDays(["Lunes", "Miércoles", "Sábado"], ["lunes", "Miercoles"]), ["Sábado"]);
    assert.deepEqual(removedWorkDays(["Lunes"], ["Lunes", "Martes"]), []);
  });

  it("encuentra los turnos activos que caen en esos días", () => {
    // 21-11-2026 y 28-11-2026 son sábados; 23-11-2026 es lunes.
    const dates = appointmentsOnRemovedDays(
      [{ date: "21-11-2026" }, { date: "23-11-2026" }, { date: "28-11-2026" }],
      ["Sábado"]
    );
    assert.deepEqual(dates, ["21-11-2026", "28-11-2026"]);
  });

  it("bloquea con la cantidad y las primeras fechas", () => {
    assert.equal(removedDaysBlockMessage(["Sábado"], []), null);
    assert.equal(
      removedDaysBlockMessage(["Sábado"], ["21-11-2026", "28-11-2026"]),
      "No se puede sacar el sábado: hay 2 turnos activos ese día (21-11-2026, 28-11-2026). Reprogramalos o cancelalos antes de cambiar los días de atención."
    );
    assert.equal(
      removedDaysBlockMessage(["Martes", "Jueves"], ["03-12-2026", "08-12-2026", "10-12-2026", "15-12-2026"]),
      "No se puede sacar el martes y el jueves: hay 4 turnos activos esos días (03-12-2026, 08-12-2026, 10-12-2026 y 1 fecha más). Reprogramalos o cancelalos antes de cambiar los días de atención."
    );
    assert.equal(
      removedDaysBlockMessage(["Sábado"], ["21-11-2026", "21-11-2026", "28-11-2026"]),
      "No se puede sacar el sábado: hay 3 turnos activos ese día (21-11-2026, 28-11-2026). Reprogramalos o cancelalos antes de cambiar los días de atención."
    );
  });
});
