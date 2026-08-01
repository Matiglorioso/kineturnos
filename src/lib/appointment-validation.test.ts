import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDay } from "date-fns";
import {
  APPOINTMENT_OVERLAP_ERROR,
  hasProfessionalOverlap,
  validateAppointmentForm,
  type AppointmentFormInput,
} from "@/lib/appointment-validation";
import { toAppDate } from "@/lib/date-utils";
import type { Appointment, Professional } from "@/types";

/** Próximo lunes (siempre futuro), en formato de la app. */
function nextMondayAppDate(from = new Date()): string {
  return toAppDate(nextDay(from, 1)); // 1 = Monday
}

function nextSundayAppDate(from = new Date()): string {
  return toAppDate(nextDay(from, 0)); // 0 = Sunday
}

const professional: Professional = {
  id: "pro-1",
  name: "Ana Gómez",
  firstName: "Ana",
  lastName: "Gómez",
  specialty: "Traumatología",
  days: ["Lunes", "Miércoles", "Viernes"],
  scheduleStart: "09:00",
  scheduleEnd: "13:00",
  defaultDuration: 45,
  active: true,
  avatarColor: "#0ea5e9",
};

const baseValues = (): AppointmentFormInput => ({
  patientId: "p-1",
  professionalId: professional.id,
  date: nextMondayAppDate(),
  time: "10:00",
  duration: "45",
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
  duration: 45,
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
      "10:15",
      45
    );

    assert.equal(overlaps, true);
  });

  it("no bloquea si el turno existente está cancelado", () => {
    const date = nextMondayAppDate();
    const overlaps = hasProfessionalOverlap(
      [existingSlot({ date, status: "cancelado" })],
      professional.id,
      date,
      "10:00",
      45
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
});
