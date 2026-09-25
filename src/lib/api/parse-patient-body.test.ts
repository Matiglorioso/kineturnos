import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePatientWriteInput } from "./parse-patient-body";

const validBody = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Juan",
  lastName: "Pérez",
  dni: "30123456",
  phone: "11 4444-4444",
  email: "juan@example.com",
  insurance: "OSDE",
  status: "activo",
  notes: "Notas",
  ...overrides,
});

describe("parsePatientWriteInput: cuerpo inválido", () => {
  for (const body of [null, undefined, "texto", 42]) {
    it(`rechaza ${JSON.stringify(body) ?? "undefined"}`, () => {
      assert.deepEqual(parsePatientWriteInput(body), {
        error: "Cuerpo de solicitud invalido.",
      });
    });
  }
});

describe("parsePatientWriteInput: payload válido", () => {
  it("devuelve el input normalizado", () => {
    const { input, error } = parsePatientWriteInput(
      validBody({
        id: "p-1",
        lastAppointment: "15-09-2026",
        createdAt: "01-01-2026",
      })
    );

    assert.equal(error, undefined);
    assert.deepEqual(input, {
      id: "p-1",
      firstName: "Juan",
      lastName: "Pérez",
      dni: "30123456",
      phone: "11 4444-4444",
      email: "juan@example.com",
      insurance: "OSDE",
      status: "activo",
      notes: "Notas",
      lastAppointment: "15-09-2026",
      createdAt: "01-01-2026",
    });
  });

  it("recorta espacios en los campos de texto", () => {
    const { input } = parsePatientWriteInput(
      validBody({
        firstName: " Juan ",
        lastName: "  Pérez",
        dni: " 30123456 ",
        phone: " 11 4444-4444 ",
        insurance: " OSDE ",
        notes: " Notas ",
      })
    );

    assert.equal(input?.firstName, "Juan");
    assert.equal(input?.lastName, "Pérez");
    assert.equal(input?.dni, "30123456");
    assert.equal(input?.phone, "11 4444-4444");
    assert.equal(input?.insurance, "OSDE");
    assert.equal(input?.notes, "Notas");
  });

  it("sin obra social queda 'Particular'", () => {
    for (const insurance of ["", "   ", undefined]) {
      const { input } = parsePatientWriteInput(validBody({ insurance }));
      assert.equal(input?.insurance, "Particular", String(insurance));
    }
  });

  it("email y notas vacíos quedan undefined", () => {
    const { input } = parsePatientWriteInput(
      validBody({ email: "  ", notes: "" })
    );

    assert.equal(input?.email, undefined);
    assert.equal(input?.notes, undefined);
  });

  it("sin estado, el paciente queda activo", () => {
    const body = validBody();
    delete (body as Record<string, unknown>).status;

    assert.equal(parsePatientWriteInput(body).input?.status, "activo");
  });

  it("respeta el estado inactivo", () => {
    const { input } = parsePatientWriteInput(validBody({ status: "inactivo" }));
    assert.equal(input?.status, "inactivo");
  });

  it("ignora id, lastAppointment y createdAt que no sean string", () => {
    const { input } = parsePatientWriteInput(
      validBody({ id: 1, lastAppointment: 2, createdAt: null })
    );

    assert.equal(input?.id, undefined);
    assert.equal(input?.lastAppointment, undefined);
    assert.equal(input?.createdAt, undefined);
  });
});

describe("parsePatientWriteInput: validación", () => {
  it("objeto vacío informa primero el nombre obligatorio", () => {
    assert.deepEqual(parsePatientWriteInput({}), {
      error: "El nombre es obligatorio",
    });
  });

  it("requiere apellido", () => {
    const { error } = parsePatientWriteInput(validBody({ lastName: " " }));
    assert.equal(error, "El apellido es obligatorio");
  });

  it("requiere DNI de 7 u 8 dígitos", () => {
    assert.equal(
      parsePatientWriteInput(validBody({ dni: "" })).error,
      "El DNI es obligatorio"
    );
    for (const dni of ["123456", "123456789"]) {
      assert.equal(
        parsePatientWriteInput(validBody({ dni })).error,
        "El DNI debe tener 7 u 8 dígitos",
        dni
      );
    }
  });

  it("acepta DNI con puntos (se validan solo los dígitos)", () => {
    const { error } = parsePatientWriteInput(validBody({ dni: "30.123.456" }));
    assert.equal(error, undefined);
  });

  it("requiere teléfono", () => {
    const { error } = parsePatientWriteInput(validBody({ phone: "" }));
    assert.equal(error, "El teléfono es obligatorio");
  });

  it("rechaza email mal formado", () => {
    const { error } = parsePatientWriteInput(validBody({ email: "juan@" }));
    assert.equal(error, "Ingresá un email válido");
  });

  // Brechas M7 (plan de testing, paso 2): hoy el parser las acepta.
  it.todo("rechaza un status de paciente fuera de activo/inactivo");
  it.todo("el error indica el campo inválido (field) para responder 400");
});
