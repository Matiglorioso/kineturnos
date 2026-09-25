import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProfessionalWriteInput } from "./parse-professional-body";

const validBody = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Ana",
  lastName: "Gómez",
  license: "MN 12345",
  email: "ana@example.com",
  phone: "11 5555-5555",
  specialty: "Traumatología",
  days: ["Lunes", "Miércoles"],
  scheduleStart: "09:00",
  scheduleEnd: "13:00",
  defaultDuration: 60,
  active: true,
  avatarColor: "#0ea5e9",
  notes: "Notas",
  ...overrides,
});

describe("parseProfessionalWriteInput: cuerpo inválido", () => {
  for (const body of [null, undefined, "texto", 42]) {
    it(`rechaza ${JSON.stringify(body) ?? "undefined"}`, () => {
      assert.deepEqual(parseProfessionalWriteInput(body), {
        error: "Cuerpo de solicitud invalido.",
      });
    });
  }
});

describe("parseProfessionalWriteInput: payload válido", () => {
  it("devuelve el input normalizado", () => {
    const { input, error } = parseProfessionalWriteInput(
      validBody({ id: "pro-1" })
    );

    assert.equal(error, undefined);
    assert.deepEqual(input, {
      id: "pro-1",
      firstName: "Ana",
      lastName: "Gómez",
      license: "MN 12345",
      email: "ana@example.com",
      phone: "11 5555-5555",
      specialty: "Traumatología",
      days: ["Lunes", "Miércoles"],
      scheduleStart: "09:00",
      scheduleEnd: "13:00",
      defaultDuration: 60,
      active: true,
      avatarColor: "#0ea5e9",
      notes: "Notas",
    });
  });

  it("recorta espacios en nombre, apellido, matrícula y notas", () => {
    const { input } = parseProfessionalWriteInput(
      validBody({
        firstName: "  Ana ",
        lastName: " Gómez  ",
        license: " MN 12345 ",
        notes: "  Notas  ",
      })
    );

    assert.equal(input?.firstName, "Ana");
    assert.equal(input?.lastName, "Gómez");
    assert.equal(input?.license, "MN 12345");
    assert.equal(input?.notes, "Notas");
  });

  it("email, teléfono y notas vacíos quedan undefined", () => {
    const { input } = parseProfessionalWriteInput(
      validBody({ email: "   ", phone: "", notes: undefined })
    );

    assert.equal(input?.email, undefined);
    assert.equal(input?.phone, undefined);
    assert.equal(input?.notes, undefined);
  });

  it("aplica defaults: activo, color 'brand' y duración 45", () => {
    const body = validBody();
    delete (body as Record<string, unknown>).active;
    delete (body as Record<string, unknown>).avatarColor;
    delete (body as Record<string, unknown>).defaultDuration;

    const { input } = parseProfessionalWriteInput(body);

    assert.equal(input?.active, true);
    assert.equal(input?.avatarColor, "brand");
    assert.equal(input?.defaultDuration, 45);
  });

  it("active: false desactiva al profesional", () => {
    const { input } = parseProfessionalWriteInput(validBody({ active: false }));
    assert.equal(input?.active, false);
  });

  it("convierte defaultDuration string a número", () => {
    const { input } = parseProfessionalWriteInput(
      validBody({ defaultDuration: "30" })
    );
    assert.equal(input?.defaultDuration, 30);
  });

  it("ignora id y avatarColor que no sean string", () => {
    const { input } = parseProfessionalWriteInput(
      validBody({ id: 123, avatarColor: { color: "red" } })
    );

    assert.equal(input?.id, undefined);
    assert.equal(input?.avatarColor, "brand");
  });
});

describe("parseProfessionalWriteInput: validación", () => {
  it("objeto vacío informa primero el nombre obligatorio", () => {
    assert.equal(parseProfessionalWriteInput({}).error, "El nombre es obligatorio");
  });

  it("nombre solo con espacios es inválido", () => {
    const { error } = parseProfessionalWriteInput(validBody({ firstName: "  " }));
    assert.equal(error, "El nombre es obligatorio");
  });

  it("requiere apellido", () => {
    const { error } = parseProfessionalWriteInput(validBody({ lastName: "" }));
    assert.equal(error, "El apellido es obligatorio");
  });

  it("requiere matrícula válida", () => {
    assert.equal(
      parseProfessionalWriteInput(validBody({ license: "" })).error,
      "La matrícula es obligatoria"
    );
    assert.equal(
      parseProfessionalWriteInput(validBody({ license: "M.1" })).error,
      "Ingresá una matrícula válida"
    );
  });

  it("requiere especialidad", () => {
    const { error } = parseProfessionalWriteInput(validBody({ specialty: "" }));
    assert.equal(error, "La especialidad es obligatoria");
  });

  it("requiere al menos un día (y days debe ser un array)", () => {
    for (const days of [[], "Lunes", undefined]) {
      const { error } = parseProfessionalWriteInput(validBody({ days }));
      assert.equal(error, "Seleccioná al menos un día de atención", String(days));
    }
  });

  it("requiere horario de inicio y fin", () => {
    assert.equal(
      parseProfessionalWriteInput(validBody({ scheduleStart: "" })).error,
      "La hora de inicio es obligatoria"
    );
    assert.equal(
      parseProfessionalWriteInput(validBody({ scheduleEnd: "" })).error,
      "La hora de fin es obligatoria"
    );
  });

  it("la hora de fin debe ser posterior a la de inicio", () => {
    for (const scheduleEnd of ["09:00", "08:00"]) {
      const { error } = parseProfessionalWriteInput(validBody({ scheduleEnd }));
      assert.equal(error, "La hora de fin debe ser posterior a la de inicio");
    }
  });

  it("rechaza email mal formado", () => {
    const { error } = parseProfessionalWriteInput(
      validBody({ email: "ana@sin-dominio" })
    );
    assert.equal(error, "Ingresá un email válido");
  });

});

describe("parseProfessionalWriteInput: validaciones de formato (M7)", () => {
  it("rechaza días fuera de lunes a sábado", () => {
    for (const day of ["Domingo", "foo", "lunes"]) {
      assert.deepEqual(
        parseProfessionalWriteInput(validBody({ days: ["Lunes", day] })),
        { error: `Día de atención inválido: ${day}`, field: "days" },
        day
      );
    }
  });

  it("rechaza horas mal formadas", () => {
    for (const scheduleStart of ["25:99", "9", "abc", "24:00"]) {
      assert.deepEqual(
        parseProfessionalWriteInput(validBody({ scheduleStart })),
        { error: "Hora de inicio inválida (usá HH:mm)", field: "scheduleStart" },
        scheduleStart
      );
    }
    assert.deepEqual(
      parseProfessionalWriteInput(validBody({ scheduleEnd: "13:60" })),
      { error: "Hora de fin inválida (usá HH:mm)", field: "scheduleEnd" }
    );
  });

  it("rechaza defaultDuration que no sea un entero positivo", () => {
    for (const defaultDuration of ["abc", 0, -30, 30.5]) {
      assert.deepEqual(
        parseProfessionalWriteInput(validBody({ defaultDuration })),
        {
          error: "La duración debe ser un número entero de minutos",
          field: "defaultDuration",
        },
        String(defaultDuration)
      );
    }
  });

  it("los errores de validación indican el campo", () => {
    assert.deepEqual(parseProfessionalWriteInput(validBody({ lastName: "" })), {
      error: "El apellido es obligatorio",
      field: "lastName",
    });
  });
});

describe("parseProfessionalWriteInput: prioridad de errores", () => {
  it("con varios errores devuelve solo el primero", () => {
    const { error, input } = parseProfessionalWriteInput(
      validBody({ lastName: "", email: "mal" })
    );

    assert.equal(error, "El apellido es obligatorio");
    assert.equal(input, undefined);
  });
});
