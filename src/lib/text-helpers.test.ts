import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getApiErrorMessage, getLoadErrorMessage } from "@/lib/api-error-message";
import { ApiError } from "@/lib/api/fetch-json";
import {
  DUPLICATE_DNI_MESSAGE,
  isDuplicateDni,
  isDuplicateLicense,
} from "@/lib/document-validation";
import { getLoginErrorMessage } from "@/lib/login-errors";
import { resolveNameParts, splitFullName, toTitleCaseName } from "@/lib/person-name";
import { pluralize } from "@/lib/pluralize";

describe("nombres de personas", () => {
  it("separa nombre y apellido(s)", () => {
    assert.deepEqual(splitFullName("  Ana María   de la Torre "), {
      firstName: "Ana",
      lastName: "María de la Torre",
    });
    assert.deepEqual(splitFullName("Ana"), { firstName: "Ana", lastName: "" });
    assert.deepEqual(splitFullName("   "), { firstName: "", lastName: "" });
  });

  it("pasa a Title Case, incluidos acentos y apellidos compuestos", () => {
    assert.equal(toTitleCaseName("juan PÉREZ"), "Juan Pérez");
    assert.equal(toTitleCaseName("maría  gonzález-ruiz"), "María González-Ruiz");
  });

  it("usa nombre y apellido explícitos, o los deduce del nombre completo", () => {
    assert.deepEqual(resolveNameParts("X Y", "Ana", "Torres"), {
      firstName: "Ana",
      lastName: "Torres",
    });
    assert.deepEqual(resolveNameParts("Ana Torres"), { firstName: "Ana", lastName: "Torres" });
    assert.deepEqual(resolveNameParts("Ana Torres", " ", "Ruiz"), {
      firstName: "Ana",
      lastName: "Ruiz",
    });
  });

  it("pluraliza según la cantidad", () => {
    assert.equal(pluralize(1, "turno"), "1 turno");
    assert.equal(pluralize(3, "turno"), "3 turnos");
    assert.equal(pluralize(2, "paciente activo", "pacientes activos"), "2 pacientes activos");
  });
});

describe("DNI y matrícula duplicados", () => {
  it("compara el DNI normalizado y excluye el propio registro al editar", () => {
    const records = [{ id: "p-1", dni: "30.111.222" }];

    assert.equal(isDuplicateDni("30111222", records), true);
    assert.equal(isDuplicateDni("30111222", records, "p-1"), false);
    assert.equal(isDuplicateDni("", records), false);
    assert.ok(DUPLICATE_DNI_MESSAGE);
  });

  it("compara la matrícula normalizada e ignora registros sin matrícula", () => {
    const records = [{ id: "pro-1", license: "MN 12.345" }, { id: "pro-2" }];

    assert.equal(isDuplicateLicense("mn12345", records), true);
    assert.equal(isDuplicateLicense("mn12345", records, "pro-1"), false);
    assert.equal(isDuplicateLicense("MP 999", records), false);
  });
});

describe("mensajes de error", () => {
  it("API: prioriza el mensaje del servidor salvo en 500", () => {
    assert.equal(getApiErrorMessage(409, "El DNI ya existe"), "El DNI ya existe");
    assert.match(getApiErrorMessage(401), /sesión expiró/);
    assert.match(getApiErrorMessage(403), /permiso/);
    assert.match(getApiErrorMessage(503), /base de datos/);
    assert.equal(getApiErrorMessage(500), "Ocurrió un error en el servidor.");
    assert.equal(getApiErrorMessage(418), "No se pudo completar la solicitud.");
  });

  it("carga de datos: distingue error de API, sin conexión y genérico", () => {
    assert.equal(
      getLoadErrorMessage(new ApiError("Paciente no encontrado.", 404), "fallback"),
      "Paciente no encontrado."
    );
    assert.match(getLoadErrorMessage(new ApiError("", 401), "fallback"), /sesión expiró/);
    assert.match(getLoadErrorMessage(new TypeError("fetch failed"), "fallback"), /Sin conexión/);
    assert.equal(getLoadErrorMessage(new Error("Algo raro"), "fallback"), "Algo raro");
    assert.equal(getLoadErrorMessage("nada", "fallback"), "fallback");
  });

  it("login: bloqueo, credenciales, red y desconocido", () => {
    assert.equal(getLoginErrorMessage(null, null, "rate_limited").kind, "rate_limited");
    assert.equal(getLoginErrorMessage(null, "CredentialsSignin").kind, "credentials");
    assert.equal(getLoginErrorMessage(new TypeError("fetch failed")).kind, "network");
    assert.deepEqual(getLoginErrorMessage(new Error("Falla")), {
      kind: "unknown",
      message: "Falla",
    });
    assert.equal(getLoginErrorMessage(undefined).kind, "unknown");
  });
});
