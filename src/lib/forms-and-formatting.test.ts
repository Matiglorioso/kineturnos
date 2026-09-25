import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  areSameAppDay,
  compareAppDates,
  formatAppDateLong,
  getAppointmentDateTime,
  isValidAppDate,
  maxAppDate,
  normalizeAppDate,
  parseAppDate,
} from "@/lib/date-utils";
import {
  formatAppointmentListLine,
  formatAppointmentScheduleDetail,
  formatAppointmentSlotLabel,
  formatAppointmentTimeRange,
} from "@/lib/datetime-format";
import { buildPatientFormValues, validatePatientForm, INITIAL_PATIENT_FORM } from "@/lib/patient-form";
import {
  buildProfessionalFormValues,
  validateProfessionalForm,
  INITIAL_PROFESSIONAL_FORM,
} from "@/lib/professional-form";
import {
  buildProfessionalName,
  countProfessionalAppointments,
  getProfessionalTodayCount,
  getProfessionalUpcomingAppointments,
  pickAvatarColor,
  PROFESSIONAL_AVATAR_COLORS,
  removeProfessionalAppointments,
} from "@/lib/professional-utils";
import type { Appointment, Patient, Professional } from "@/types";

describe("fechas dd-MM-yyyy", () => {
  it("valida y normaliza el formato de la app (acepta ISO legado)", () => {
    assert.equal(isValidAppDate("24-09-2026"), true);
    assert.equal(isValidAppDate("31-02-2026"), false);
    assert.equal(isValidAppDate("2026-09-24"), false);
    assert.equal(normalizeAppDate("2026-09-24"), "24-09-2026");
    assert.equal(normalizeAppDate("no-es-fecha"), "no-es-fecha");
    assert.equal(parseAppDate(""), null);
  });

  it("compara y ordena por fecha real", () => {
    assert.ok(compareAppDates("02-10-2026", "15-09-2026") > 0);
    assert.equal(areSameAppDay("2026-09-24", "24-09-2026"), true);
    assert.equal(maxAppDate(["31-01-2026", "02-10-2026", "15-09-2026"]), "02-10-2026");
    assert.equal(maxAppDate([]), null);
  });

  it("arma la fecha y hora de un turno", () => {
    const dateTime = getAppointmentDateTime("24-09-2026", "14:30:00");
    assert.equal(dateTime.getHours(), 14);
    assert.equal(dateTime.getMinutes(), 30);
    assert.equal(formatAppDateLong("24-09-2026"), "jueves 24-09-2026");
  });

  it("formatea rangos y etiquetas de turnos de 1 hora", () => {
    assert.equal(formatAppointmentTimeRange("09:00:00"), "09:00 - 10:00 hs");
    assert.equal(formatAppointmentScheduleDetail("09:00"), "09:00 - 10:00 hs (60 min)");
    assert.equal(formatAppointmentSlotLabel("2026-09-24", "09:00"), "24-09-2026 a las 09:00 hs");
    assert.deepEqual(formatAppointmentListLine("24-09-2026", "09:00"), {
      dateLabel: "24-09-2026",
      timeLabel: "09:00 - 10:00 hs",
    });
  });
});

describe("formularios de pacientes y profesionales", () => {
  const patient: Patient = {
    id: "p-1",
    name: "Ana Torres",
    dni: "30111222",
    phone: "11 5555-5555",
    insurance: "Particular",
    status: "activo",
  };

  it("paciente: arma el formulario desde el nombre completo y deja vacía la obra social 'Particular'", () => {
    assert.deepEqual(buildPatientFormValues(patient), {
      ...INITIAL_PATIENT_FORM,
      firstName: "Ana",
      lastName: "Torres",
      dni: "30111222",
      phone: "11 5555-5555",
    });
    assert.equal(buildPatientFormValues({ ...patient, insurance: "OSDE" }).insurance, "OSDE");
  });

  it("paciente: detecta DNI duplicado salvo el propio al editar", () => {
    const values = buildPatientFormValues(patient);
    const existingPatients = [{ id: "p-9", dni: "30.111.222" }];

    assert.ok(validatePatientForm(values, { existingPatients }).dni);
    assert.equal(
      validatePatientForm(values, { existingPatients, excludePatientId: "p-9" }).dni,
      undefined
    );
  });

  const professional: Professional = {
    id: "pro-1",
    name: "Camila Vargas",
    firstName: "Camila",
    lastName: "Vargas",
    license: "MN 12345",
    specialty: "RPG",
    days: ["Lunes"],
    active: true,
    avatarColor: "bg-sky-500",
  };

  it("profesional: arma el formulario y detecta matrícula duplicada", () => {
    const values = buildProfessionalFormValues(professional);
    assert.deepEqual(values, {
      ...INITIAL_PROFESSIONAL_FORM,
      firstName: "Camila",
      lastName: "Vargas",
      license: "MN 12345",
      specialty: "RPG",
      days: ["Lunes"],
    });

    const existingProfessionals = [{ id: "pro-9", license: "mn12345" }];
    assert.ok(validateProfessionalForm(values, { existingProfessionals }).license);
    assert.equal(
      validateProfessionalForm(values, {
        existingProfessionals,
        excludeProfessionalId: "pro-9",
      }).license,
      undefined
    );
  });
});

describe("helpers de profesionales", () => {
  const appointment = (overrides: Partial<Appointment>): Appointment => ({
    id: "a",
    patientId: "p-1",
    patientName: "Ana",
    professionalId: "pro-1",
    professionalName: "Camila",
    date: "24-09-2026",
    time: "10:00",
    status: "pendiente",
    sessionType: "Control",
    ...overrides,
  });
  const items = [
    appointment({ id: "hoy" }),
    appointment({ id: "hoy-otro", professionalId: "pro-2" }),
    appointment({ id: "manana", date: "25-09-2026", status: "confirmado" }),
    appointment({ id: "cancelado", date: "26-09-2026", status: "cancelado" }),
    appointment({ id: "pasado", date: "20-09-2026" }),
  ];

  it("arma el nombre y rota los colores de avatar", () => {
    assert.equal(buildProfessionalName(" Camila ", " Vargas "), "Camila Vargas");
    assert.equal(pickAvatarColor(0), PROFESSIONAL_AVATAR_COLORS[0]);
    assert.equal(
      pickAvatarColor(PROFESSIONAL_AVATAR_COLORS.length),
      PROFESSIONAL_AVATAR_COLORS[0]
    );
  });

  it("cuenta turnos de hoy y totales, y los quita al borrar", () => {
    assert.equal(countProfessionalAppointments(items, "pro-1"), 4);
    assert.equal(getProfessionalTodayCount(items, "pro-1", "24-09-2026"), 1);
    assert.deepEqual(
      removeProfessionalAppointments(items, "pro-1").map((item) => item.id),
      ["hoy-otro"]
    );
  });

  it("próximos turnos: activos desde ahora, en orden y con límite", () => {
    const reference = new Date(2026, 8, 24, 8, 0);
    assert.deepEqual(
      getProfessionalUpcomingAppointments(items, "pro-1", 5, reference).map((item) => item.id),
      ["hoy", "manana"]
    );
    assert.equal(getProfessionalUpcomingAppointments(items, "pro-1", 1, reference).length, 1);
  });
});
