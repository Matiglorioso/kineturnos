import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "@prisma/client";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  ConflictError,
  DeleteBlockedError,
  DuplicateFieldError,
  NotFoundError,
  ValidationError,
} from "@/lib/db/errors";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import { getRoleLabel } from "@/lib/auth/roles";
import { cn, getInitials } from "@/lib/utils";

async function toResult(error: unknown) {
  const originalConsoleError = console.error;
  console.error = () => {}; // el 503 loguea el error original
  try {
    const response = handleWriteError(error, "No se pudo guardar.");
    return { status: response.status, body: await response.json() };
  } finally {
    console.error = originalConsoleError;
  }
}

describe("errores de escritura → respuesta HTTP", () => {
  it("validación: 400 con el campo", async () => {
    assert.deepEqual(await toResult(new ValidationError("Fecha inválida", "date")), {
      status: 400,
      body: { error: "Fecha inválida", field: "date" },
    });
  });

  it("choque de horario: 409 (aunque herede de ValidationError)", async () => {
    assert.deepEqual(await toResult(new ConflictError("Horario ocupado", "overlap")), {
      status: 409,
      body: { error: "Horario ocupado", field: "overlap" },
    });
  });

  it("duplicado y borrado bloqueado: 409; no encontrado: 404", async () => {
    assert.deepEqual(await toResult(new DuplicateFieldError("dni", "DNI repetido")), {
      status: 409,
      body: { error: "DNI repetido", field: "dni" },
    });
    assert.equal((await toResult(new DeleteBlockedError("Tiene turnos"))).status, 409);
    assert.deepEqual(await toResult(new NotFoundError("No existe")), {
      status: 404,
      body: { error: "No existe" },
    });
  });

  it("violación de unicidad de Prisma (P2002): 409 genérico", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "test",
    });
    assert.deepEqual(await toResult(error), {
      status: 409,
      body: { error: "Ya existe un registro con esos datos." },
    });
  });

  it("cualquier otro error: 503 con el mensaje de respaldo, sin exponer el detalle", async () => {
    assert.deepEqual(await toResult(new Error("connection refused")), {
      status: 503,
      body: { error: "No se pudo guardar." },
    });
  });
});

describe("helpers de UI", () => {
  it("iniciales, clases y etiquetas de rol", () => {
    assert.equal(getInitials("ana maría torres"), "AM");
    assert.equal(cn("px-2", false && "hidden", "px-4"), "px-4");
    assert.equal(getRoleLabel("recepcion"), "Recepción");
  });

  it("describe el borrado permanente según la cantidad de turnos", () => {
    assert.match(buildPermanentDeleteDescription("Ana", 1), /Ana y sus 1 turno\./);
    assert.match(buildPermanentDeleteDescription("Ana", 3), /3 turnos/);
    assert.match(buildPermanentDeleteDescription("Ana", 0), /No tiene turnos registrados/);
  });
});
