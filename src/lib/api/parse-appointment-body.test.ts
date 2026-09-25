import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDay, subDays } from "date-fns";
import {
  APPOINTMENT_FUTURE_STATUS_ERROR,
  APPOINTMENT_PAST_TIME_ERROR,
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
      status: "pendiente",
      sessionType: "Rehabilitación",
      notes: "Primera sesión",
    });
  });

  it("sin estado usa pendiente", () => {
    const body = validBody();
    delete (body as Record<string, unknown>).status;

    const { input } = parseAppointmentWriteInput(body);

    assert.equal(input?.status, "pendiente");
  });

  it("ignora una duración enviada por un cliente viejo (todos duran 1 h)", () => {
    const { input, error } = parseAppointmentWriteInput(validBody({ duration: 45 }));

    assert.equal(error, undefined);
    assert.equal("duration" in (input ?? {}), false);
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
    assert.equal(parseAppointmentWriteInput({}).error, "Seleccioná un paciente");
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

  it("rechaza atendido o ausente en fecha futura", () => {
    for (const status of ["atendido", "ausente"]) {
      assert.equal(
        parseAppointmentWriteInput(validBody({ status })).error,
        APPOINTMENT_FUTURE_STATUS_ERROR,
        status
      );
    }
  });

});

describe("parseAppointmentWriteInput: validaciones de formato (M7)", () => {
  it("rechaza un estado desconocido", () => {
    assert.deepEqual(parseAppointmentWriteInput(validBody({ status: "foo" })), {
      error: "Estado de turno inválido",
      field: "status",
    });
  });

  it("rechaza un tipo de sesión fuera de la lista", () => {
    assert.deepEqual(
      parseAppointmentWriteInput(validBody({ sessionType: "Yoga" })),
      { error: "Tipo de sesión inválido", field: "sessionType" }
    );
  });

  it("rechaza horas mal formadas", () => {
    for (const time of ["25:99", "abc", "10"]) {
      assert.deepEqual(
        parseAppointmentWriteInput(validBody({ time })),
        { error: "Horario inválido (usá HH:mm)", field: "time" },
        time
      );
    }
  });

  it("los errores de validación indican el campo", () => {
    assert.deepEqual(parseAppointmentWriteInput(validBody({ patientId: "" })), {
      error: "Seleccioná un paciente",
      field: "patientId",
    });
  });
});

describe("parseAppointmentWriteInput: edición de turnos pasados", () => {
  // Regresión: el PATCH de edición completa validaba como alta y respondía 400
  // "No se pueden crear turnos en fechas pasadas" al editar un turno pasado.
  it("permite editar un turno pasado sin cambiar la fecha", () => {
    const date = pastDate();
    const { input, error } = parseAppointmentWriteInput(
      validBody({ date, status: "atendido" }),
      { excludeId: "a-1", previousDate: date }
    );

    assert.equal(error, undefined);
    assert.equal(input?.status, "atendido");
  });

  it("rechaza mover un turno a otra fecha pasada", () => {
    const { error } = parseAppointmentWriteInput(
      validBody({ date: toAppDate(subDays(new Date(), 14)) }),
      { excludeId: "a-1", previousDate: pastDate() }
    );

    assert.equal(error, "No se puede mover un turno a una fecha pasada");
  });

  it("reenvía previousTime y now: mover un turno de hoy a una hora pasada falla", () => {
    // Jueves 24-09-2026 a las 18:00 ART.
    const { error, field } = parseAppointmentWriteInput(
      validBody({ date: "24-09-2026", time: "08:00" }),
      {
        excludeId: "a-1",
        previousDate: "24-09-2026",
        previousTime: "19:00",
        now: new Date("2026-09-24T21:00:00Z"),
      }
    );

    assert.equal(error, APPOINTMENT_PAST_TIME_ERROR);
    assert.equal(field, "time");
  });

  it("sin opciones de edición, una fecha pasada sigue siendo un alta inválida", () => {
    const { error } = parseAppointmentWriteInput(
      validBody({ date: pastDate() })
    );

    assert.equal(error, "No se pueden crear turnos en fechas pasadas");
  });
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
