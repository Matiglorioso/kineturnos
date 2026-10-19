import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Appointment, AppointmentStatus } from "@/types";
import {
  computeIndicators,
  formatRangeLabel,
  formatRate,
  getPeriodRange,
  getPreviousRange,
  getTimeline,
  indicatorsByProfessional,
  percentChange,
  sessionsByInsurance,
} from "./dashboard-indicators";

const TODAY = "21-10-2026"; // miércoles

let counter = 0;
function appointment(date: string, status: AppointmentStatus, extra: Partial<Appointment> = {}): Appointment {
  counter += 1;
  return {
    id: `t${counter}`,
    patientId: "pac1",
    patientName: "Paciente",
    professionalId: "pro1",
    professionalName: "Camila Vargas",
    date,
    time: "10:00",
    status,
    sessionType: "Control",
    ...extra,
  };
}

describe("períodos del panel", () => {
  it("semana de lunes a domingo, mes, mes anterior, trimestre y año", () => {
    assert.deepEqual(getPeriodRange("semana", TODAY), { from: "19-10-2026", to: "25-10-2026", granularity: "dia" });
    assert.deepEqual(getPeriodRange("mes", TODAY), { from: "01-10-2026", to: "31-10-2026", granularity: "semana" });
    assert.deepEqual(getPeriodRange("mes-anterior", TODAY), {
      from: "01-09-2026",
      to: "30-09-2026",
      granularity: "semana",
    });
    assert.deepEqual(getPeriodRange("trimestre", TODAY), { from: "01-08-2026", to: "31-10-2026", granularity: "mes" });
    assert.deepEqual(getPeriodRange("anio", TODAY), { from: "01-01-2026", to: "31-12-2026", granularity: "mes" });
  });

  it("el período anterior tiene la misma duración", () => {
    assert.deepEqual(getPreviousRange(getPeriodRange("semana", TODAY)), {
      from: "12-10-2026",
      to: "18-10-2026",
      granularity: "dia",
    });
    // Mes contra mes completo (septiembre tiene 30 días, agosto 31).
    assert.deepEqual(getPreviousRange(getPeriodRange("mes-anterior", TODAY)), {
      from: "01-08-2026",
      to: "31-08-2026",
      granularity: "semana",
    });
    assert.deepEqual(getPreviousRange(getPeriodRange("trimestre", TODAY)), {
      from: "01-05-2026",
      to: "31-07-2026",
      granularity: "mes",
    });
    assert.equal(getPreviousRange(getPeriodRange("anio", TODAY)).from, "01-01-2025");
  });

  it("texto del rango", () => {
    assert.equal(formatRangeLabel(getPeriodRange("mes", TODAY)), "Del 1 de octubre al 31 de octubre de 2026");
  });
});

describe("indicadores del período (RF16)", () => {
  const items = [
    appointment("02-10-2026", "atendido", { patientId: "a" }),
    appointment("03-10-2026", "atendido", { patientId: "a" }),
    appointment("05-10-2026", "atendido", { patientId: "b" }),
    appointment("06-10-2026", "ausente", { patientId: "c" }),
    appointment("07-10-2026", "cancelado", { patientId: "c" }),
    appointment("28-10-2026", "pendiente", { patientId: "d", professionalId: "pro2", professionalName: "Ezequiel López" }),
    appointment("15-09-2026", "atendido", { patientId: "a" }),
  ];
  const october = getPeriodRange("mes", TODAY);

  it("cuenta turnos, sesiones, pacientes y tasas", () => {
    assert.deepEqual(computeIndicators(items, october), {
      total: 6,
      attended: 3,
      absent: 1,
      cancelled: 1,
      active: 1,
      patientsAttended: 2,
      cancellationRate: 1 / 6,
      absenceRate: 1 / 4,
    });
  });

  it("sin turnos, las tasas no se pueden calcular", () => {
    const empty = computeIndicators([], october);
    assert.equal(empty.cancellationRate, null);
    assert.equal(formatRate(empty.absenceRate), "—");
    assert.equal(formatRate(0.255), "26%");
  });

  it("variación contra el período anterior", () => {
    assert.equal(percentChange(12, 10), 20);
    assert.equal(percentChange(5, 10), -50);
    assert.equal(percentChange(3, 0), null);
  });

  it("agrupa por profesional, de mayor a menor", () => {
    const rows = indicatorsByProfessional(items, october);
    assert.deepEqual(
      rows.map((row) => [row.professionalName, row.total, row.attended, row.absent, row.cancelled, row.active]),
      [
        ["Camila Vargas", 5, 3, 1, 1, 0],
        ["Ezequiel López", 1, 0, 0, 0, 1],
      ]
    );
  });

  it("arma la evolución por semana", () => {
    const timeline = getTimeline(items, october);
    // Octubre 2026: 1-4, 5-11, 12-18, 19-25, 26-31.
    assert.deepEqual(
      timeline.map((bucket) => [bucket.label, bucket.attended, bucket.absent, bucket.cancelled]),
      [
        ["1/10", 2, 0, 0],
        ["5/10", 1, 1, 1],
        ["12/10", 0, 0, 0],
        ["19/10", 0, 0, 0],
        ["26/10", 0, 0, 0],
      ]
    );
    assert.equal(timeline[0].title, "Semana del 1/10 al 4/10");
  });

  it("arma la evolución por día y por mes", () => {
    assert.equal(getTimeline(items, getPeriodRange("semana", TODAY)).length, 7);
    const quarter = getTimeline(items, getPeriodRange("trimestre", TODAY));
    assert.deepEqual(
      quarter.map((bucket) => [bucket.label, bucket.attended]),
      [
        ["ago", 0],
        ["sep", 1],
        ["oct", 3],
      ]
    );
  });

  it("sesiones atendidas por obra social", () => {
    const insurance = new Map([
      ["a", "OSDE 210"],
      ["b", "APROSS"],
    ]);
    assert.deepEqual(sessionsByInsurance(items, october, insurance), [
      { name: "OSDE 210", sessions: 2 },
      { name: "APROSS", sessions: 1 },
    ]);
  });
});
