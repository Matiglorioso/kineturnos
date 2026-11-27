import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHourlySlotLabel,
  getHourlySlotStarts,
  isValidHourlySlotStart,
  listHourlySlotOptions,
  listHourlySlotOptionsForForm,
  noSlotsReason,
  shouldResetSlotOnDateChange,
} from "@/lib/appointment-slots";
import type { Appointment, AppointmentStatus, Professional } from "@/types";

// Fechas fijas: los slots no dependen de "hoy".
const MONDAY = "07-06-2027";
const WEDNESDAY = "09-06-2027";
const SUNDAY = "06-06-2027";

/** Horario del consultorio: 07:00 a 12:00 y 13:00 a 20:00, bloques de 1 hora (sin turnos a las 12:00). */
const CLINIC_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

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

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: "a-1",
  patientId: "p-1",
  patientName: "Paciente Uno",
  professionalId: professional.id,
  professionalName: professional.name,
  date: MONDAY,
  time: "10:00",
  status: "confirmado",
  sessionType: "Rehabilitación",
  ...overrides,
});

function availability(options: { startTime: string; available: boolean }[]) {
  return Object.fromEntries(
    options.map((option) => [option.startTime, option.available])
  );
}

describe("slots: bloques de 1 h del consultorio", () => {
  it("genera un bloque por hora de 07:00 a 12:00 y de 13:00 a 20:00", () => {
    assert.deepEqual(getHourlySlotStarts(), CLINIC_SLOTS);
  });

  it("no hay bloque a las 12:00: es la pausa del mediodía", () => {
    assert.equal(getHourlySlotStarts().includes("12:00"), false);
    const options = listHourlySlotOptions(professional, MONDAY, []);
    assert.equal(options.some((option) => option.startTime === "12:00"), false);
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
    assert.equal(
      listHourlySlotOptions(professional, WEDNESDAY, []).length,
      CLINIC_SLOTS.length
    );
  });

  it("sin turnos, todos los bloques están libres", () => {
    const options = listHourlySlotOptions(professional, MONDAY, []);

    assert.deepEqual(
      options.map((option) => option.startTime),
      CLINIC_SLOTS
    );
    assert.ok(options.every((option) => option.available));
    assert.equal(options[0].label, "07:00 - 08:00 hs");
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

  it("un turno fuera de grilla (1 h) bloquea los dos bloques que pisa", () => {
    const slots = availability(
      listHourlySlotOptions(professional, MONDAY, [
        appointment({ time: "10:30" }), // 10:30–11:30
      ])
    );

    assert.equal(slots["09:00"], true);
    assert.equal(slots["10:00"], false);
    assert.equal(slots["11:00"], false);
    assert.equal(slots["13:00"], true);
  });

  it("turnos contiguos no se consideran solapados", () => {
    const options = listHourlySlotOptions(professional, MONDAY, [
      appointment({ time: "09:00" }),
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
    const slots = availability(
      listHourlySlotOptions(professional, MONDAY, [], undefined, { now })
    );

    assert.equal(slots["08:00"], false);
    assert.equal(slots["09:00"], false);
    assert.equal(slots["10:00"], false);
    assert.equal(slots["11:00"], true);
    assert.equal(slots["17:00"], true);
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

    assert.equal(options.length, CLINIC_SLOTS.length);
  });

  it("agrega el horario actual fuera de grilla como primera opción (1 h)", () => {
    const options = listHourlySlotOptionsForForm(professional, MONDAY, [], {
      currentTime: "10:15",
    });

    assert.equal(options.length, CLINIC_SLOTS.length + 1);
    assert.deepEqual(options[0], {
      startTime: "10:15",
      label: "10:15 - 11:15 hs (actual)",
      available: true,
    });
  });

  it("sin horario actual devuelve las opciones base", () => {
    assert.deepEqual(
      listHourlySlotOptionsForForm(professional, MONDAY, []),
      listHourlySlotOptions(professional, MONDAY, [])
    );
  });
});

describe("slots: validación de inicio de bloque", () => {
  it("acepta inicios de bloque del consultorio (con o sin segundos)", () => {
    assert.equal(isValidHourlySlotStart("07:00"), true);
    assert.equal(isValidHourlySlotStart("11:00"), true);
    assert.equal(isValidHourlySlotStart("13:00"), true);
    assert.equal(isValidHourlySlotStart("19:00:00"), true);
  });

  it("rechaza horarios fuera de grilla, en la pausa del mediodía o fuera del horario", () => {
    assert.equal(isValidHourlySlotStart("10:30"), false);
    assert.equal(isValidHourlySlotStart("06:00"), false);
    assert.equal(isValidHourlySlotStart("12:00"), false);
    assert.equal(isValidHourlySlotStart("20:00"), false);
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

describe("slots: por qué no hay horarios", () => {
  const reason = (date: string, appointments: Appointment[] = [], now = new Date("2027-06-01T12:00:00Z")) =>
    noSlotsReason(professional, date, listHourlySlotOptions(professional, date, appointments, undefined, { now }), now);

  it("si hay horarios libres, no hay nada que explicar", () => {
    assert.equal(reason(MONDAY), null);
  });

  it("el profesional no atiende ese día", () => {
    assert.match(reason(SUNDAY) ?? "", /^Ana Gómez no atiende los domingo/i);
  });

  it("todos los bloques del día están ocupados", () => {
    const full = CLINIC_SLOTS.map((time, index) => appointment({ id: `a-${index}`, time }));
    assert.equal(
      reason(MONDAY, full),
      "Ana Gómez ya tiene ocupados todos los horarios de ese día. Elegí otra fecha u otro profesional."
    );
  });

  it("es hoy y ya pasaron todos los horarios", () => {
    // Lunes 07-06-2027 a las 20:30 ART.
    assert.equal(
      reason(MONDAY, [], new Date("2027-06-07T23:30:00Z")),
      "Ya pasaron todos los horarios de hoy. Elegí otra fecha."
    );
  });
});
