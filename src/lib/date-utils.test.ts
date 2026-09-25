// El servidor de Vercel corre en UTC. node:test aísla cada archivo en su
// propio proceso, así que fijar TZ acá no afecta a los demás tests.
process.env.TZ = "UTC";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateAppointmentForm } from "@/lib/appointment-validation";
import {
  getTodayAppDate,
  isFutureAppDate,
  isPastAppDate,
} from "@/lib/date-utils";
import type { Professional } from "@/types";

/** 24-09-2026 22:30 ART (UTC-3) = 25-09-2026 01:30 UTC. */
const NIGHT_ART = new Date("2026-09-25T01:30:00Z");
/** 24-09-2026 09:00 ART. */
const MORNING_ART = new Date("2026-09-24T12:00:00Z");

describe("fecha de hoy en hora argentina (M1)", () => {
  it("a las 22:30 ART sigue siendo hoy aunque en UTC ya sea mañana", () => {
    assert.equal(getTodayAppDate(NIGHT_ART), "24-09-2026");
  });

  it("de día coincide con UTC", () => {
    assert.equal(getTodayAppDate(MORNING_ART), "24-09-2026");
  });

  it("hoy no es pasado ni futuro, a cualquier hora", () => {
    for (const now of [NIGHT_ART, MORNING_ART]) {
      assert.equal(isPastAppDate("24-09-2026", now), false);
      assert.equal(isFutureAppDate("24-09-2026", now), false);
    }
  });

  it("ayer es pasado y mañana es futuro", () => {
    assert.equal(isPastAppDate("23-09-2026", NIGHT_ART), true);
    assert.equal(isFutureAppDate("25-09-2026", NIGHT_ART), true);
  });
});

describe("validación de turnos con el servidor en UTC (M1)", () => {
  const professional: Professional = {
    id: "pro-1",
    name: "Ana Gómez",
    firstName: "Ana",
    lastName: "Gómez",
    specialty: "Traumatología",
    days: ["Jueves"],
    scheduleStart: "08:00",
    scheduleEnd: "23:00",
    defaultDuration: 60,
    active: true,
    avatarColor: "#0ea5e9",
  };

  it("crear un turno para hoy a las 22:00 ART (21:30 ART) funciona", () => {
    const errors = validateAppointmentForm(
      {
        patientId: "p-1",
        professionalId: professional.id,
        date: "24-09-2026", // jueves
        time: "22:00",
        duration: "60",
        sessionType: "Rehabilitación",
        status: "pendiente",
      },
      [],
      [professional],
      undefined,
      { now: new Date("2026-09-25T00:30:00Z") } // 24-09 21:30 ART
    );

    assert.deepEqual(errors, {});
  });
});
