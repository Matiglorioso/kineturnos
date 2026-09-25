import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPatientLastAppointmentDate } from "@/lib/patient-appointments";

// Jueves 24-09-2026 a las 18:00 ART.
const now = new Date("2026-09-24T21:00:00Z");

describe("último turno del paciente (M6)", () => {
  it("con un turno futuro pendiente y uno atendido pasado, muestra el atendido", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "15-10-2026", status: "pendiente" },
          { date: "10-09-2026", status: "atendido" },
        ],
        now
      ),
      "10-09-2026"
    );
  });

  it("ignora cancelados y ausentes aunque sean más recientes", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "01-09-2026", status: "atendido" },
          { date: "20-09-2026", status: "cancelado" },
          { date: "22-09-2026", status: "ausente" },
        ],
        now
      ),
      "01-09-2026"
    );
  });

  it("toma el atendido más reciente en orden cronológico real", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "31-01-2026", status: "atendido" },
          { date: "02-09-2026", status: "atendido" },
          { date: "15-06-2026", status: "atendido" },
        ],
        now
      ),
      "02-09-2026"
    );
  });

  it("un atendido de hoy cuenta", () => {
    assert.equal(
      getPatientLastAppointmentDate([{ date: "24-09-2026", status: "atendido" }], now),
      "24-09-2026"
    );
  });

  it("sin atendidos no hay último turno", () => {
    assert.equal(
      getPatientLastAppointmentDate(
        [
          { date: "30-09-2026", status: "confirmado" },
          { date: "01-09-2026", status: "cancelado" },
        ],
        now
      ),
      null
    );
    assert.equal(getPatientLastAppointmentDate([], now), null);
  });
});
