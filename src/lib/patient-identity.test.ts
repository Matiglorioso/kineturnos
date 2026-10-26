import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ageOn, birthDateValidationError, formatAge, normalizeBirthDateInput } from "./birth-date";
import { cuilCheckDigit, cuilFormatValidationError, formatCuil, normalizeCuil } from "./document-validation";
import { buildPatientFormValues, INITIAL_PATIENT_FORM, normalizeIdentityFields, validatePatientForm } from "./patient-form";

describe("CUIL", () => {
  it("normaliza y formatea con guiones", () => {
    assert.equal(normalizeCuil("20-32456789-6"), "20324567896");
    assert.equal(formatCuil("20324567896"), "20-32456789-6");
    assert.equal(formatCuil("123"), "123");
  });

  it("calcula el dígito verificador (módulo 11)", () => {
    assert.equal(cuilCheckDigit("2032456789"), 6);
    // Resto 1: no hay dígito posible con ese prefijo (AFIP asigna 23 o 24).
    assert.equal(cuilCheckDigit("2701234567"), null);
  });

  it("es opcional", () => {
    assert.equal(cuilFormatValidationError("", "32456789"), undefined);
  });

  it("acepta un CUIL válido que corresponde al DNI, con o sin guiones", () => {
    assert.equal(cuilFormatValidationError("20-32456789-6", "32.456.789"), undefined);
    assert.equal(cuilFormatValidationError("20324567896", "32456789"), undefined);
  });

  it("DNI de 7 dígitos: se completa con un cero", () => {
    assert.equal(cuilFormatValidationError("20-01234567-5", "1.234.567"), undefined);
  });

  it("rechaza largo, prefijo y dígito verificador incorrectos", () => {
    assert.equal(cuilFormatValidationError("20-3245678-6", "32456789"), "El CUIL debe tener 11 dígitos");
    assert.equal(cuilFormatValidationError("20-32456789-5", "32456789"), "El CUIL no es válido: revisá los dígitos");
    assert.equal(cuilFormatValidationError("30-32456789-6", "32456789"), "El CUIL no es válido: revisá los dígitos");
  });

  it("rechaza un CUIL de otro DNI", () => {
    assert.equal(cuilFormatValidationError("20-32456789-6", "30111222"), "El CUIL no corresponde al DNI");
  });
});

describe("fecha de nacimiento", () => {
  const today = "19-10-2026";

  it("acepta barras, puntos y días o meses de un dígito", () => {
    assert.equal(normalizeBirthDateInput("5/3/1990"), "05-03-1990");
    assert.equal(normalizeBirthDateInput("05.03.1990"), "05-03-1990");
    assert.equal(normalizeBirthDateInput(" 05-03-1990 "), "05-03-1990");
  });

  it("es opcional", () => {
    assert.equal(birthDateValidationError("", today), undefined);
  });

  it("rechaza formato inválido, fechas inexistentes, futuras y de hace más de 120 años", () => {
    assert.equal(birthDateValidationError("1990-03-05", today), "Ingresá la fecha con el formato dd-mm-aaaa");
    assert.equal(birthDateValidationError("31-02-1990", today), "Ingresá la fecha con el formato dd-mm-aaaa");
    assert.equal(birthDateValidationError("20-10-2026", today), "La fecha de nacimiento no puede ser futura");
    assert.equal(birthDateValidationError("01-01-1900", today), "Revisá la fecha de nacimiento");
    assert.equal(birthDateValidationError("19-10-2026", today), undefined);
  });

  it("calcula la edad cumplida", () => {
    assert.equal(ageOn("19-10-1990", today), 36);
    assert.equal(ageOn("20-10-1990", today), 35);
    assert.equal(formatAge("01-01-2025", today), "1 año");
    assert.equal(formatAge("05-03-1990", today), "36 años");
    assert.equal(formatAge(undefined, today), "");
  });
});

describe("formulario del paciente: CUIL y fecha de nacimiento", () => {
  const base = {
    ...INITIAL_PATIENT_FORM,
    firstName: "Ana",
    lastName: "Torres",
    dni: "32456789",
    phone: "1144445555",
  };

  it("valida los dos campos y no revalida el CUIL si el DNI está mal", () => {
    const errors = validatePatientForm(
      { ...base, cuil: "20-30111222-1", birthDate: "40-01-1990" },
      { today: "19-10-2026" }
    );
    assert.equal(errors.cuil, "El CUIL no es válido: revisá los dígitos");
    assert.ok(errors.birthDate);
    assert.equal(validatePatientForm({ ...base, dni: "", cuil: "1" }).cuil, undefined);
  });

  it("normaliza para guardar y vuelve a mostrar el CUIL con guiones al editar", () => {
    assert.deepEqual(normalizeIdentityFields({ cuil: "20-32456789-6", birthDate: "5/3/1990" }), {
      cuil: "20324567896",
      birthDate: "05-03-1990",
    });
    assert.deepEqual(normalizeIdentityFields({ cuil: "", birthDate: "" }), { cuil: undefined, birthDate: undefined });

    const values = buildPatientFormValues({
      id: "p-1",
      name: "Ana Torres",
      dni: "32456789",
      cuil: "20324567896",
      birthDate: "05-03-1990",
      phone: "1",
      insurance: "Particular",
      status: "activo",
    });
    assert.equal(values.cuil, "20-32456789-6");
    assert.equal(values.birthDate, "05-03-1990");
  });
});
