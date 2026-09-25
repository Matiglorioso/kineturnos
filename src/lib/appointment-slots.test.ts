import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHourlySlotLabel,
  getProfessionalHourlySlotStarts,
  isValidHourlySlotStart,
  listHourlySlotOptions,
  listHourlySlotOptionsForForm,
  shouldResetSlotOnDateChange,
} from "@/lib/appointment-slots";
import type { Appointment, AppointmentStatus, Professional } from "@/types";

// Fechas fijas: los slots no dependen de "hoy".
const MONDAY = "07-06-2027";
const WEDNESDAY = "09-06-2027";
const SUNDAY = "06-06-2027";

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

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: "a-1",
  patientId: "p-1",
  patientName: "Paciente Uno",
  professionalId: professional.id,
  professionalName: professional.name,
  date: MONDAY,
  time: "10:00",
  duration: 60,
  status: "confirmado",
  sessionType: "Rehabilitación",
  ...overrides,
});

function availability(options: { startTime: string; available: boolean }[]) {
  return Object.fromEntries(
    options.map((option) => [option.startTime, option.available])
  );
}

describe("slots: bloques de 1 h", () => {
  it("genera un bloque por hora dentro del horario", () => {
    assert.deepEqual(getProfessionalHourlySlotStarts(professional), [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
    ]);
  });

  it("horario no alineado a la hora (08:30) arranca los bloques desde ahí", () => {
    const pro = { ...professional, scheduleStart: "08:30", scheduleEnd: "11:30" };
    assert.deepEqual(getProfessionalHourlySlotStarts(pro), ["08:30", "09:30", "10:30"]);
    assert.equal(isValidHourlySlotStart(pro, "09:00"), false);
  });

  it("descarta el bloque final si no entra completo", () => {
    const pro = { ...professional, scheduleStart: "09:30", scheduleEnd: "12:00" };
    assert.deepEqual(getProfessionalHourlySlotStarts(pro), ["09:30", "10:30"]);
  });

  it("horario menor a una hora no genera bloques", () => {
    const pro = { ...professional, scheduleStart: "09:00", scheduleEnd: "09:45" };
    assert.deepEqual(getProfessionalHourlySlotStarts(pro), []);
  });

  it("acepta horarios con segundos (HH:mm:ss)", () => {
    const pro = { ...professional, scheduleStart: "09:00:00", scheduleEnd: "11:00:00" };
    assert.deepEqual(getProfessionalHourlySlotStarts(pro), ["09:00", "10:00"]);
  });

  it("formatea la etiqueta como rango de 1 h", () => {
    assert.equal(formatHourlySlotLabel("09:00"), "09:00 - 10:00 hs");
  });
});

describe("slots: disponibilidad por día", () => {
  it("sin profesional, sin fecha o en día no laboral no hay opciones", () => {
    assert.deepEqual(listHourlySlotOptions(undefined, MONDAY, []), []);
    assert.deepEqual(listHourlySlotOptions(professional, "", []), []);
    assert.deepEqual(listHourlySlotOptions(professional, SUNDAY, []), []);
  });

  it("reconoce días con tilde (Miércoles)", () => {
    assert.equal(listHourlySlotOptions(professional, WEDNESDAY, []).length, 4);
  });

  it("sin turnos, todos los bloques están libres", () => {
    const options = listHourlySlotOptions(professional, MONDAY, []);

    assert.equal(options.length, 4);
    assert.ok(options.every((option) => option.available));
    assert.equal(options[0].label, "09:00 - 10:00 hs");
  });
});

describe("slots: ocupación", () => {
  for (const status of ["pendiente", "confirmado", "atendido"] as AppointmentStatus[]) {
    it(`un turno ${status} ocupa su bloque`, () => {
      const options = listHourlySlotOptions(professional, MONDAY, [
        appointment({ status }),
      ]);
      assert.equal(availability(options)["10:00"], false);
    });
  }

  for (const status of ["cancelado", "ausente"] as AppointmentStatus[]) {
    it(`un turno ${status} libera su bloque`, () => {
      const options = listHourlySlotOptions(professional, MONDAY, [
        appointment({ status }),
      ]);
      assert.equal(availability(options)["10:00"], true);
    });
  }

  it("un turno fuera de grilla bloquea todos los bloques que pisa", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [
      appointment({ time: "10:30", duration: 45 }), // 10:30–11:15
    ]);

    assert.deepEqual(availability(options), {
      "09:00": true,
      "10:00": false,
      "11:00": false,
      "12:00": true,
    });
  });

  it("turnos contiguos no se consideran solapados", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [
      appointment({ time: "09:00", duration: 60 }),
    ]);

    assert.equal(availability(options)["09:00"], false);
    assert.equal(availability(options)["10:00"], true);
  });

  it("ignora turnos de otro profesional o de otro día", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [
      appointment({ professionalId: "pro-2" }),
      appointment({ id: "a-2", date: WEDNESDAY }),
    ]);

    assert.ok(options.every((option) => option.available));
  });

  it("compara fechas legadas en ISO contra dd-MM-yyyy", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [
      appointment({ date: "2027-06-07" }),
    ]);

    assert.equal(availability(options)["10:00"], false);
  });

  it("excludeId libera el bloque del propio turno al editar", () => {
    const options = listHourlySlotOptions(
      professional,
      MONDAY,
      [appointment({ id: "a-edit" })],
      "a-edit"
    );

    assert.equal(availability(options)["10:00"], true);
  });
});

describe("slots: horarios que ya pasaron hoy (M3)", () => {
  // Lunes 07-06-2027 a las 10:30 ART.
  const now = new Date("2027-06-07T13:30:00Z");

  it("hoy, los bloques ya empezados no están disponibles", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [], undefined, { now });

    assert.deepEqual(availability(options), {
      "09:00": false,
      "10:00": false,
      "11:00": true,
      "12:00": true,
    });
  });

  it("otro día no se ve afectado", () => {
    const options = listHourlySlotOptions(professional, WEDNESDAY, [], undefined, { now });
    assert.ok(options.every((option) => option.available));
  });

  it("al editar, el horario actual del turno sigue disponible aunque ya haya pasado", () => {
    const options = listHourlySlotOptionsForForm(professional, MONDAY, [], {
      excludeId: "a-1",
      currentTime: "09:00",
      now,
    });

    assert.equal(availability(options)["09:00"], true);
    assert.equal(availability(options)["10:00"], false);
  });
});

describe("slots: opciones del formulario de edición", () => {
  it("si el horario actual es un bloque estándar, no agrega opciones", () => {
    const options = listHourlySlotOptionsForForm(professional, MONDAY, [], {
      currentTime: "10:00:00",
    });

    assert.equal(options.length, 4);
  });

  it("agrega el horario actual fuera de grilla como primera opción", () => {
    const options = listHourlySlotOptionsForForm(professional, MONDAY, [], {
      currentTime: "10:15",
      currentDuration: 45,
    });

    assert.equal(options.length, 5);
    assert.deepEqual(options[0], {
      startTime: "10:15",
      label: "10:15 - 11:00 hs (actual)",
      available: true,
    });
  });

  it("sin duración actual usa el bloque de 60 min en la etiqueta", () => {
    const [first] = listHourlySlotOptionsForForm(professional, MONDAY, [], {
      currentTime: "10:15",
    });

    assert.equal(first.label, "10:15 - 11:15 hs (actual)");
  });

  it("sin horario actual devuelve las opciones base", () => {
    assert.deepEqual(
      listHourlySlotOptionsForForm(professional, MONDAY, []),
      listHourlySlotOptions(professional, MONDAY, [])
    );
  });
});

describe("slots: validación de inicio de bloque", () => {
  it("acepta inicios de bloque (con o sin segundos)", () => {
    assert.equal(isValidHourlySlotStart(professional, "09:00"), true);
    assert.equal(isValidHourlySlotStart(professional, "12:00:00"), true);
  });

  it("rechaza horarios fuera de grilla o de horario", () => {
    assert.equal(isValidHourlySlotStart(professional, "10:30"), false);
    assert.equal(isValidHourlySlotStart(professional, "13:00"), false);
    assert.equal(isValidHourlySlotStart(professional, "08:00"), false);
  });

  it("sin profesional nunca es válido", () => {
    assert.equal(isValidHourlySlotStart(undefined, "09:00"), false);
  });
});

describe("slots: reset al cambiar de fecha", () => {
  it("no resetea en un turno nuevo (sin fecha previa)", () => {
    assert.equal(shouldResetSlotOnDateChange(undefined, MONDAY), false);
  });

  it("no resetea si es el mismo día (aunque cambie el formato)", () => {
    assert.equal(shouldResetSlotOnDateChange(MONDAY, MONDAY), false);
    assert.equal(shouldResetSlotOnDateChange("2027-06-07", MONDAY), false);
  });

  it("resetea si cambia el día", () => {
    assert.equal(shouldResetSlotOnDateChange(MONDAY, WEDNESDAY), true);
  });
});
