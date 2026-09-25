import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDay, subDays } from "date-fns";
import {
  APPOINTMENT_FUTURE_STATUS_ERROR,
  APPOINTMENT_OVERLAP_ERROR,
  APPOINTMENT_PAST_TIME_ERROR,
  APPOINTMENT_PATIENT_OVERLAP_ERROR,
  hasProfessionalOverlap,
  validateAppointmentForm,
  validateAppointmentStatusChange,
  type AppointmentFormInput,
} from "@/lib/appointment-validation";
import { parseAppDate, toAppDate } from "@/lib/date-utils";
import type { Appointment, Professional } from "@/types";

/** Próximo lunes (siempre futuro), en formato de la app. */
function nextMondayAppDate(from = new Date()): string {
  return toAppDate(nextDay(from, 1)); // 1 = Monday
}

function nextSundayAppDate(from = new Date()): string {
  return toAppDate(nextDay(from, 0)); // 0 = Sunday
}

function pastMondayAppDate(from = new Date()): string {
  let cursor = subDays(from, 7);
  while (cursor.getDay() !== 1) {
    cursor = subDays(cursor, 1);
  }
  return toAppDate(cursor);
}

const professional: Professional = {
  id: "pro-1",
  name: "Ana Gómez",
  firstName: "Ana",
  lastName: "Gómez",
  specialty: "Traumatología",
  days: ["Lunes", "Miércoles", "Viernes"],
  active: true,
  avatarColor: "#0ea5e9",
};

const baseValues = (): AppointmentFormInput => ({
  patientId: "p-1",
  professionalId: professional.id,
  date: nextMondayAppDate(),
  time: "10:00",
  sessionType: "Rehabilitación",
  status: "pendiente",
});

const existingSlot = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: "a-existing",
  patientId: "p-2",
  patientName: "Otro Paciente",
  professionalId: professional.id,
  professionalName: professional.name,
  date: nextMondayAppDate(),
  time: "10:00",
  status: "confirmado",
  sessionType: "Rehabilitación",
  ...overrides,
});

describe("validación de agendado: día de atención", () => {
  it("rechaza un turno en un día que el profesional no atiende", () => {
    const values = {
      ...baseValues(),
      date: nextSundayAppDate(), // domingo fuera de L/X/V
    };

    const errors = validateAppointmentForm(values, [], [professional]);

    assert.ok(errors.date, "debe fallar por día de atención");
    assert.match(errors.date!, /no atiende/i);
  });

  it("acepta un turno en un día de atención dentro del horario", () => {
    const errors = validateAppointmentForm(baseValues(), [], [professional]);

    assert.equal(errors.date, undefined);
    assert.equal(errors.schedule, undefined);
    assert.equal(errors.overlap, undefined);
  });
});

describe("validación de agendado: conflicto de horario", () => {
  it("detecta solapamiento con hasProfessionalOverlap", () => {
    const date = nextMondayAppDate();
    const overlaps = hasProfessionalOverlap(
      [existingSlot({ date })],
      professional.id,
      date,
      "10:15"
    );

    assert.equal(overlaps, true);
  });

  it("no bloquea si el turno existente está cancelado", () => {
    const date = nextMondayAppDate();
    const overlaps = hasProfessionalOverlap(
      [existingSlot({ date, status: "cancelado" })],
      professional.id,
      date,
      "10:00"
    );

    assert.equal(overlaps, false);
  });

  it("validateAppointmentForm reporta overlap en create", () => {
    const date = nextMondayAppDate();
    const values = { ...baseValues(), date, time: "10:00" };

    const errors = validateAppointmentForm(
      values,
      [existingSlot({ date })],
      [professional]
    );

    assert.equal(errors.overlap, APPOINTMENT_OVERLAP_ERROR);
  });

  it("al editar, excludeId ignora el propio turno", () => {
    const date = nextMondayAppDate();
    const existing = existingSlot({ date, id: "a-1" });
    const values = {
      ...baseValues(),
      date,
      time: existing.time,
    };

    const errors = validateAppointmentForm(
      values,
      [existing],
      [professional],
      "a-1"
    );

    assert.equal(errors.overlap, undefined);
  });
  it("rechaza un horario que no es inicio de bloque horario", () => {
    const errors = validateAppointmentForm(
      { ...baseValues(), time: "10:15" },
      [],
      [professional]
    );

    assert.match(errors.time!, /bloque horario/i);
  });
});

describe("validación de agendado: estado vs fecha", () => {
  it("rechaza atendido en fecha futura", () => {
    const errors = validateAppointmentForm(
      { ...baseValues(), status: "atendido" },
      [],
      [professional]
    );

    assert.equal(errors.status, APPOINTMENT_FUTURE_STATUS_ERROR);
  });

  it("rechaza ausente en fecha futura", () => {
    const errors = validateAppointmentForm(
      { ...baseValues(), status: "ausente" },
      [],
      [professional]
    );

    assert.equal(errors.status, APPOINTMENT_FUTURE_STATUS_ERROR);
  });
});

describe("cambio de solo estado (A2)", () => {
  // Jueves 24-09-2026 a las 18:00 ART.
  const now = new Date("2026-09-24T21:00:00Z");
  const slot = (overrides: Partial<Appointment> = {}): Appointment =>
    existingSlot({ id: "a-1", date: "30-09-2026", time: "10:00", ...overrides });

  it("cancela aunque el profesional ya no atienda ese día ni ese horario", () => {
    // El turno es un miércoles 10:15 (fuera de grilla); la validación de estado no mira la agenda.
    const errors = validateAppointmentStatusChange(
      slot({ time: "10:15", status: "confirmado" }),
      "cancelado",
      [],
      now
    );
    assert.deepEqual(errors, {});
  });

  it("marca atendido un turno pasado sin revalidar la fecha", () => {
    const errors = validateAppointmentStatusChange(
      slot({ date: "10-09-2026", status: "confirmado" }),
      "atendido",
      [],
      now
    );
    assert.deepEqual(errors, {});
  });

  it("rechaza atendido o ausente en un turno futuro", () => {
    for (const status of ["atendido", "ausente"] as const) {
      const errors = validateAppointmentStatusChange(slot(), status, [], now);
      assert.equal(errors.status, APPOINTMENT_FUTURE_STATUS_ERROR, status);
    }
  });

  it("al reactivar un cancelado, chequea que el horario del profesional siga libre", () => {
    const taken = slot({ id: "a-2", patientId: "p-9", status: "confirmado" });
    const errors = validateAppointmentStatusChange(
      slot({ status: "cancelado" }),
      "pendiente",
      [taken],
      now
    );
    assert.equal(errors.overlap, APPOINTMENT_OVERLAP_ERROR);
  });

  it("al reactivar un ausente, chequea que el paciente no tenga otro turno", () => {
    const patientBusy = slot({
      id: "a-2",
      professionalId: "pro-2",
      status: "pendiente",
    });
    const errors = validateAppointmentStatusChange(
      slot({ date: "10-09-2026", status: "ausente" }),
      "atendido",
      [{ ...patientBusy, date: "10-09-2026" }],
      now
    );
    assert.equal(errors.overlap, APPOINTMENT_PATIENT_OVERLAP_ERROR);
  });

  it("reactivar con el horario libre funciona", () => {
    const freed = slot({ id: "a-2", patientId: "p-9", status: "cancelado" });
    const errors = validateAppointmentStatusChange(
      slot({ status: "cancelado" }),
      "confirmado",
      [freed],
      now
    );
    assert.deepEqual(errors, {});
  });

  it("entre estados activos no vuelve a chequear solapamiento", () => {
    // Un solapamiento heredado no debe impedir confirmar.
    const legacy = slot({ id: "a-2", patientId: "p-9", status: "pendiente" });
    const errors = validateAppointmentStatusChange(
      slot({ status: "pendiente" }),
      "confirmado",
      [legacy],
      now
    );
    assert.deepEqual(errors, {});
  });
});

describe("edición completa con la agenda del profesional modificada (A2)", () => {
  // Turno existente: miércoles 30-09-2026 a las 10:15 (fuera de grilla).
  // El profesional ahora atiende solo lunes y viernes.
  const changedProfessional: Professional = {
    ...professional,
    days: ["Lunes", "Viernes"],
  };
  const now = new Date("2026-09-24T21:00:00Z");
  const previous = {
    previousDate: "30-09-2026",
    previousTime: "10:15",
    previousProfessionalId: changedProfessional.id,
    now,
  };
  const editValues = (overrides: Partial<AppointmentFormInput> = {}) => ({
    ...baseValues(),
    date: "30-09-2026",
    time: "10:15",
    status: "confirmado",
    sessionType: "Control",
    ...overrides,
  });

  it("deja editar el turno sin moverlo aunque quede fuera de la agenda actual", () => {
    const errors = validateAppointmentForm(
      editValues(),
      [],
      [changedProfessional],
      "a-1",
      previous
    );
    assert.deepEqual(errors, {});
  });

  it("si se mueve a otro horario, valida contra la agenda actual", () => {
    const errors = validateAppointmentForm(
      editValues({ time: "11:00" }), // bloque válido, pero el miércoles ya no atiende
      [],
      [changedProfessional],
      "a-1",
      previous
    );
    assert.ok(errors.date, "el miércoles ya no es día de atención");
  });

  it("si cambia de profesional, valida contra la agenda del nuevo", () => {
    const errors = validateAppointmentForm(
      editValues({ professionalId: "pro-2" }),
      [],
      [changedProfessional, { ...changedProfessional, id: "pro-2", name: "Otro" }],
      "a-1",
      previous
    );
    assert.ok(errors.date || errors.time, "el turno no entra en la agenda del nuevo");
  });

  it("sin mover el turno, sigue chequeando solapamientos", () => {
    const errors = validateAppointmentForm(
      editValues(),
      [existingSlot({ id: "a-2", date: "30-09-2026", time: "10:00", patientId: "p-9" })],
      [changedProfessional],
      "a-1",
      previous
    );
    assert.equal(errors.overlap, APPOINTMENT_OVERLAP_ERROR);
  });
});

describe("validación de agendado: paciente con dos turnos a la vez (M2)", () => {
  const otherProfessional: Professional = {
    ...professional,
    id: "pro-2",
    name: "Luis Díaz",
  };
  const professionals = [professional, otherProfessional];
  const patientSlot = (overrides: Partial<Appointment> = {}) =>
    existingSlot({
      patientId: "p-1",
      professionalId: otherProfessional.id,
      professionalName: otherProfessional.name,
      ...overrides,
    });

  it("rechaza un turno del mismo paciente, a la misma hora, con otro profesional", () => {
    const errors = validateAppointmentForm(
      baseValues(),
      [patientSlot()],
      professionals
    );

    assert.equal(errors.overlap, APPOINTMENT_PATIENT_OVERLAP_ERROR);
  });

  it("detecta solapamiento parcial", () => {
    const errors = validateAppointmentForm(
      baseValues(), // 10:00–11:00
      [patientSlot({ time: "10:30" })], // 10:30–11:30
      professionals
    );

    assert.equal(errors.overlap, APPOINTMENT_PATIENT_OVERLAP_ERROR);
  });

  it("un turno cancelado o ausente del paciente no bloquea", () => {
    for (const status of ["cancelado", "ausente"] as const) {
      const errors = validateAppointmentForm(
        baseValues(),
        [patientSlot({ status })],
        professionals
      );
      assert.equal(errors.overlap, undefined, status);
    }
  });

  it("a otra hora el paciente puede tener otro turno", () => {
    const errors = validateAppointmentForm(
      baseValues(),
      [patientSlot({ time: "11:00" })],
      professionals
    );

    assert.equal(errors.overlap, undefined);
  });

  it("al editar, no choca consigo mismo", () => {
    const own = patientSlot({ id: "a-own", professionalId: professional.id });
    const errors = validateAppointmentForm(
      baseValues(),
      [own],
      professionals,
      "a-own"
    );

    assert.equal(errors.overlap, undefined);
  });
});

describe("validación de agendado: horario pasado de hoy (M3)", () => {
  // Jueves 24-09-2026 a las 14:00 ART (17:00 UTC).
  const TODAY = "24-09-2026";
  const now = new Date("2026-09-24T17:00:00Z");
  const allDay: Professional = {
    ...professional,
    days: ["Jueves", "Viernes"],
  };

  const todayValues = (time: string): AppointmentFormInput => ({
    ...baseValues(),
    date: TODAY,
    time,
  });

  it("rechaza crear un turno para hoy a una hora que ya pasó", () => {
    for (const time of ["08:00", "13:00"]) {
      const errors = validateAppointmentForm(
        todayValues(time),
        [],
        [allDay],
        undefined,
        { now }
      );
      assert.equal(errors.time, APPOINTMENT_PAST_TIME_ERROR, time);
    }
  });

  it("acepta un turno para hoy que todavía no empezó", () => {
    for (const time of ["14:00", "17:00"]) {
      const errors = validateAppointmentForm(
        todayValues(time),
        [],
        [allDay],
        undefined,
        { now }
      );
      assert.deepEqual(errors, {}, time);
    }
  });

  it("acepta mañana a primera hora", () => {
    const errors = validateAppointmentForm(
      { ...todayValues("08:00"), date: "25-09-2026" },
      [],
      [allDay],
      undefined,
      { now }
    );
    assert.deepEqual(errors, {});
  });

  it("al editar, deja tocar un turno de hoy que ya empezó sin moverlo", () => {
    const errors = validateAppointmentForm(
      { ...todayValues("08:00"), status: "atendido" },
      [],
      [allDay],
      "a-1",
      { previousDate: TODAY, previousTime: "08:00", now }
    );
    assert.deepEqual(errors, {});
  });

  it("al editar, rechaza moverlo a otra hora que ya pasó", () => {
    const errors = validateAppointmentForm(
      todayValues("09:00"),
      [],
      [allDay],
      "a-1",
      { previousDate: TODAY, previousTime: "08:00", now }
    );
    assert.equal(errors.time, APPOINTMENT_PAST_TIME_ERROR);
  });
});

describe("validación de agendado: fechas pasadas al editar", () => {
  it("permite editar un turno pasado sin cambiar la fecha", () => {
    const pastDate = pastMondayAppDate();
    const existing = existingSlot({ date: pastDate, id: "a-past" });
    const values = {
      ...baseValues(),
      date: pastDate,
      time: existing.time,
    };

    const errors = validateAppointmentForm(
      values,
      [existing],
      [professional],
      "a-past",
      { previousDate: pastDate }
    );

    assert.equal(errors.date, undefined);
  });

  it("rechaza mover un turno a otra fecha pasada", () => {
    const pastDate = pastMondayAppDate();
    const earlierPastDate = toAppDate(subDays(parseAppDate(pastDate)!, 7));
    const existing = existingSlot({ date: pastDate, id: "a-past" });
    const values = {
      ...baseValues(),
      date: earlierPastDate,
      time: existing.time,
    };

    const errors = validateAppointmentForm(
      values,
      [existing],
      [professional],
      "a-past",
      { previousDate: pastDate }
    );

    assert.match(errors.date!, /fecha pasada/i);
  });
});
