import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getClinicScheduleLabel,
  isWithinClinicSchedule,
  validateProfessionalAppointmentSlot,
} from "@/lib/professional-schedule";
import { WEEK_DAYS } from "@/lib/professional-utils";
import type { Professional } from "@/types";

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

describe("horario del consultorio: 07:00 a 12:00 y de 13:00 a 20:00, de lunes a viernes", () => {
  it("el texto del horario nombra los dos tramos", () => {
    assert.equal(getClinicScheduleLabel(), "07:00 a 12:00 y de 13:00 a 20:00");
  });

  it("un turno de 1 h tiene que entrar entero en la mañana o en la tarde", () => {
    for (const time of ["07:00", "11:00", "13:00", "19:00"]) {
      assert.equal(isWithinClinicSchedule(time), true, time);
    }
    for (const time of ["06:00", "11:30", "12:00", "12:30", "19:30", "20:00"]) {
      assert.equal(isWithinClinicSchedule(time), false, time);
    }
  });

  it("un turno a las 12:00 se rechaza con el horario del consultorio en el mensaje", () => {
    // Lunes 07-06-2027.
    assert.deepEqual(validateProfessionalAppointmentSlot(professional, "07-06-2027", "12:00"), {
      schedule:
        "El horario debe estar dentro del horario del consultorio: 07:00 a 12:00 y de 13:00 a 20:00.",
    });
    assert.deepEqual(validateProfessionalAppointmentSlot(professional, "07-06-2027", "13:00"), {});
  });

  it("los días de atención son de lunes a viernes", () => {
    assert.deepEqual(WEEK_DAYS, ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]);
  });
});
