import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDay, subDays } from "date-fns";
import {
  APPOINTMENT_DURATION_INVALID_ERROR,
  APPOINTMENT_FUTURE_STATUS_ERROR,
} from "@/lib/appointment-validation";
import { toAppDate } from "@/lib/date-utils";
import {
  parseAppointmentStatusInput,
  parseAppointmentWriteInput,
} from "./parse-appointment-body";

// El parser valida contra "hoy": se usan fechas relativas.
const futureDate = () => toAppDate(nextDay(new Date(), 1));
const pastDate = () => toAppDate(subDays(new Date(), 7));

const validBody = (overrides: Record<string, unknown> = {}) => ({
  patientId: "p-1",
  professionalId: "pro-1",
  date: futureDate(),
  time: "10:00",
  duration: 60,
  sessionType: "Rehabilitación",
  status: "pendiente",
  notes: "Primera sesión",
  ...overrides,
});

describe("parseAppointmentWriteInput: cuerpo inválido", () => {
  for (const body of [null, undefined, "texto", 42]) {
    it(`rechaza ${JSON.stringify(body) ?? "undefined"}`, () => {
      assert.deepEqual(parseAppointmentWriteInput(body), {
        error: "Cuerpo de solicitud invalido.",
      });
    });
  }
});

describe("parseAppointmentWriteInput: payload válido", () => {
  it("devuelve el input normalizado", () => {
    const date = futureDate();
    const { input, error } = parseAppointmentWriteInput(
      validBody({ id: "a-1", date })
    );

    assert.equal(error, undefined);
    assert.deepEqual(input, {
      id: "a-1",
      patientId: "p-1",
      professionalId: "pro-1",
      date,
      time: "10:00",
      duration: 60,
      status: "pendiente",
      sessionType: "Rehabilitación",
      notes: "Primera sesión",
    });
  });

  it("sin duración ni estado usa 60 min y pendiente", () => {
    const body = validBody();
    delete (body as Record<string, unknown>).duration;
    delete (body as Record<string, unknown>).status;

    const { input } = parseAppointmentWriteInput(body);

    assert.equal(input?.duration, 60);
    assert.equal(input?.status, "pendiente");
  });

  it("recorta espacios en la hora", () => {
    const { input } = parseAppointmentWriteInput(validBody({ time: " 10:00 " }));
    assert.equal(input?.time, "10:00");
  });

  it("ignora id y notas que no sean string", () => {
    const { input } = parseAppointmentWriteInput(
      validBody({ id: 7, notes: { texto: "x" } })
    );

    assert.equal(input?.id, undefined);
    assert.equal(input?.notes, undefined);
  });

  it("no valida día ni horario del profesional (lo hace la capa de DB)", () => {
    // Domingo y 07:15: el parser no conoce al profesional.
    const sunday = toAppDate(nextDay(new Date(), 0));
    const { error } = parseAppointmentWriteInput(
      validBody({ date: sunday, time: "07:15" })
    );

    assert.equal(error, undefined);
  });
});

describe("parseAppointmentWriteInput: validación", () => {
  it("objeto vacío informa primero el paciente", () => {
    assert.deepEqual(parseAppointmentWriteInput({}), {
      error: "Seleccioná un paciente",
    });
  });

  it("requiere profesional, horario y tipo de sesión", () => {
    assert.equal(
      parseAppointmentWriteInput(validBody({ professionalId: "" })).error,
      "Seleccioná un profesional"
    );
    assert.equal(
      parseAppointmentWriteInput(validBody({ time: "" })).error,
      "Elegí un horario"
    );
    assert.equal(
      parseAppointmentWriteInput(validBody({ sessionType: "" })).error,
      "Seleccioná un tipo de sesión"
    );
  });

  it("requiere fecha en formato dd-MM-yyyy", () => {
    assert.equal(
      parseAppointmentWriteInput(validBody({ date: "" })).error,
      "La fecha es obligatoria"
    );
    for (const date of ["2027-06-07", "31-02-2027", "7/6/2027"]) {
      assert.match(
        parseAppointmentWriteInput(validBody({ date })).error ?? "",
        /formato dd-MM-yyyy/,
        date
      );
    }
  });

  it("rechaza fechas pasadas", () => {
    const { error } = parseAppointmentWriteInput(validBody({ date: pastDate() }));
    assert.equal(error, "No se pueden crear turnos en fechas pasadas");
  });

  it("rechaza duraciones distintas de 60", () => {
    for (const duration of [30, 45, "90", "abc"]) {
      assert.equal(
        parseAppointmentWriteInput(validBody({ duration })).error,
        APPOINTMENT_DURATION_INVALID_ERROR,
        String(duration)
      );
    }
  });

  it("rechaza atendido o ausente en fecha futura", () => {
    for (const status of ["atendido", "ausente"]) {
      assert.equal(
        parseAppointmentWriteInput(validBody({ status })).error,
        APPOINTMENT_FUTURE_STATUS_ERROR,
        status
      );
    }
  });

  // Brechas M7 (plan de testing, paso 2): hoy el parser las acepta.
  it.todo("rechaza un status fuera de AppointmentStatus (\"foo\")");
  it.todo("rechaza un sessionType fuera de SESSION_TYPES");
  it.todo("rechaza horas mal formadas (\"25:99\", \"abc\")");
  // Bug: el PUT de edición completa pasa por este parser sin excludeId/previousDate,
  // así que editar un turno pasado (ej. marcarlo atendido desde el formulario) da 400.
  it.todo("al editar un turno pasado sin cambiar la fecha, no lo rechaza como alta");
});

describe("parseAppointmentStatusInput", () => {
  for (const status of ["pendiente", "confirmado", "atendido", "cancelado", "ausente"]) {
    it(`acepta ${status}`, () => {
      assert.deepEqual(parseAppointmentStatusInput({ status }), { status });
    });
  }

  it("rechaza estados desconocidos o de otro tipo", () => {
    for (const status of ["foo", "Pendiente", "", 1, null, undefined]) {
      assert.deepEqual(
        parseAppointmentStatusInput({ status }),
        { error: "Estado de turno invalido." },
        String(status)
      );
    }
  });

  it("rechaza cuerpos que no son objeto", () => {
    for (const body of [null, "atendido"]) {
      assert.deepEqual(parseAppointmentStatusInput(body), {
        error: "Cuerpo de solicitud invalido.",
      });
    }
  });
});
