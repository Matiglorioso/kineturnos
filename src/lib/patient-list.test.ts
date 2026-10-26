import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Patient } from "@/types";
import {
  ALL_INSURANCES,
  DEFAULT_PATIENT_LIST_OPTIONS,
  filterAndSortPatients,
  getInsuranceOptions,
  type PatientListOptions,
} from "./patient-list";

function patient(overrides: Partial<Patient>): Patient {
  return {
    id: overrides.name ?? "p",
    name: "Sin nombre",
    dni: "1",
    phone: "+54 11 5555-5555",
    insurance: "Particular",
    status: "activo",
    ...overrides,
  };
}

const patients = [
  patient({ name: "Martín Acosta", dni: "27.334.556", insurance: "Particular", status: "inactivo" }),
  patient({ name: "ana Torres", dni: "33.445.678", insurance: "OSDE 210" }),
  patient({ name: "Ángela Ruiz", dni: "9.876.543", insurance: "APROSS" }),
  patient({
    name: "Carlos Ruiz",
    dni: "28.901.234",
    cuil: "20289012347",
    insurance: "OSDE 210",
    email: "carlos@mail.com",
  }),
];

const names = (options: Partial<PatientListOptions>) =>
  filterAndSortPatients(patients, { ...DEFAULT_PATIENT_LIST_OPTIONS, ...options }).map(
    (item) => item.name
  );

describe("orden de la lista de pacientes", () => {
  it("por nombre, sin importar mayúsculas ni tildes", () => {
    assert.deepEqual(names({ sort: "nombre-asc" }), [
      "ana Torres",
      "Ángela Ruiz",
      "Carlos Ruiz",
      "Martín Acosta",
    ]);
    assert.deepEqual(names({ sort: "nombre-desc" }), [
      "Martín Acosta",
      "Carlos Ruiz",
      "Ángela Ruiz",
      "ana Torres",
    ]);
  });

  it("por DNI como número, no como texto", () => {
    assert.deepEqual(names({ sort: "dni-asc" }), [
      "Ángela Ruiz",
      "Martín Acosta",
      "Carlos Ruiz",
      "ana Torres",
    ]);
    assert.equal(names({ sort: "dni-desc" })[0], "ana Torres");
  });

  it("por estado: activos primero y, entre ellos, por nombre", () => {
    assert.deepEqual(names({ sort: "estado" }), [
      "ana Torres",
      "Ángela Ruiz",
      "Carlos Ruiz",
      "Martín Acosta",
    ]);
  });
});

describe("filtro por obra social y búsqueda", () => {
  it("lista las obras sociales sin repetir y en orden", () => {
    assert.deepEqual(getInsuranceOptions(patients), ["APROSS", "OSDE 210", "Particular"]);
  });

  it("filtra por obra social exacta", () => {
    assert.deepEqual(names({ insurance: "OSDE 210" }), ["ana Torres", "Carlos Ruiz"]);
    assert.equal(names({ insurance: ALL_INSURANCES }).length, 4);
  });

  it("combina búsqueda, obra social y orden", () => {
    assert.deepEqual(names({ search: "ruiz", sort: "nombre-desc" }), ["Carlos Ruiz", "Ángela Ruiz"]);
    assert.deepEqual(names({ search: "ruiz", insurance: "APROSS" }), ["Ángela Ruiz"]);
    assert.deepEqual(names({ search: "carlos@" }), ["Carlos Ruiz"]);
  });

  it("encuentra el DNI con o sin puntos", () => {
    assert.deepEqual(names({ search: "33445678" }), ["ana Torres"]);
    assert.deepEqual(names({ search: "33.445" }), ["ana Torres"]);
  });

  it("encuentra el CUIL con o sin guiones, completo o en parte (RF08)", () => {
    assert.deepEqual(names({ search: "20-28901234-7" }), ["Carlos Ruiz"]);
    assert.deepEqual(names({ search: "20289012347" }), ["Carlos Ruiz"]);
    // "20-289" no está en el DNI (28901234): lo encuentra por el CUIL.
    assert.deepEqual(names({ search: "20-289" }), ["Carlos Ruiz"]);
    // Sin CUIL cargado: el CUIL completo lo encuentra por el DNI que contiene.
    assert.deepEqual(names({ search: "27-33445678-1" }), ["ana Torres"]);
    assert.deepEqual(names({ search: "20-09876543-1" }), ["Ángela Ruiz"]);
  });
});
