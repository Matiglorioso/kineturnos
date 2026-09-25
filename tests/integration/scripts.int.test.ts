import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { PrismaClient } from "@prisma/client";
import { mockProfessionals } from "../../prisma/fixtures/mockProfessionals";
import { appDateToDb, appTimeToDb } from "../../src/lib/db/date-codec";
import { prisma, runScript, withScratchDatabase } from "./helpers";

after(() => prisma.$disconnect());

const SEED_ENV = { SEED_INITIAL_PASSWORD: "it-password-123" };

async function insertRealData(client: PrismaClient) {
  const professional = await client.profesional.create({
    data: {
      id: "prof-real",
      nombre: "Real Profesional",
      nombrePila: "Real",
      apellido: "Profesional",
      especialidad: "RPG",
      diasAtencion: ["Lunes"],
      horarioInicio: "08:00",
      horarioFin: "12:00",
      colorAvatar: "brand",
    },
  });
  const patient = await client.paciente.create({
    data: {
      id: "pac-real",
      nombre: "Real Paciente",
      dni: "30111222",
      dniNormalizado: "30111222",
      telefono: "11 5555-5555",
      ultimoTurno: appDateToDb("10-03-2026"),
    },
  });
  return { professional, patient };
}

async function counts(client: PrismaClient) {
  return {
    pacientes: await client.paciente.count(),
    profesionales: await client.profesional.count(),
    usuarios: await client.usuario.count(),
  };
}

describe("db:seed:minimal (A1)", () => {
  it("con datos existentes aborta sin borrar nada", async () => {
    await withScratchDatabase(async ({ url, client }) => {
      await insertRealData(client);
      const before = await counts(client);

      const result = runScript("prisma/seed-minimal.ts", {
        ...SEED_ENV,
        DATABASE_URL: url,
      });

      assert.notEqual(result.status, 0, result.output);
      assert.deepEqual(await counts(client), before);
    });
  });

  it("con --force crea los usuarios sin borrar pacientes ni profesionales", async () => {
    await withScratchDatabase(async ({ url, client }) => {
      await insertRealData(client);

      const result = runScript(
        "prisma/seed-minimal.ts",
        { ...SEED_ENV, DATABASE_URL: url },
        ["--force"]
      );

      assert.equal(result.status, 0, result.output);
      assert.deepEqual(await counts(client), {
        pacientes: 1,
        profesionales: 1,
        usuarios: 3,
      });
    });
  });

  it("en una base vacía crea los 3 usuarios", async () => {
    await withScratchDatabase(async ({ url, client }) => {
      const result = runScript("prisma/seed-minimal.ts", {
        ...SEED_ENV,
        DATABASE_URL: url,
      });

      assert.equal(result.status, 0, result.output);
      assert.equal(await client.usuario.count(), 3);
    });
  });
});

describe("db:seed (A1)", () => {
  it("con datos existentes aborta aunque ALLOW_DEV_SEED=1", async () => {
    await withScratchDatabase(async ({ url, client }) => {
      await insertRealData(client);
      const before = await counts(client);

      const result = runScript("prisma/seed.ts", {
        ...SEED_ENV,
        ALLOW_DEV_SEED: "1",
        DATABASE_URL: url,
      });

      assert.notEqual(result.status, 0, result.output);
      assert.deepEqual(await counts(client), before);
    });
  });
});

describe("db:purge-demo (M5)", () => {
  it("no toca el último turno de pacientes reales y recalcula los afectados", async () => {
    await withScratchDatabase(async ({ url, client }) => {
      const { professional, patient } = await insertRealData(client);
      const mock = mockProfessionals[0];

      // Profesional demo con un turno atendido de un paciente real.
      await client.profesional.create({
        data: {
          id: mock.id,
          nombre: mock.name,
          nombrePila: mock.firstName,
          apellido: mock.lastName,
          especialidad: mock.specialty,
          diasAtencion: mock.days,
          horarioInicio: mock.scheduleStart,
          horarioFin: mock.scheduleEnd,
          colorAvatar: mock.avatarColor,
        },
      });

      const affected = await client.paciente.create({
        data: {
          id: "pac-afectado",
          nombre: "Afectado Paciente",
          dni: "30333444",
          dniNormalizado: "30333444",
          telefono: "11 5555-5555",
          ultimoTurno: appDateToDb("20-04-2026"),
        },
      });

      const turno = (id: string, pacienteId: string, profesionalId: string, fecha: string) =>
        client.turno.create({
          data: {
            id,
            pacienteId,
            pacienteNombre: "x",
            profesionalId,
            profesionalNombre: "x",
            fecha: appDateToDb(fecha),
            hora: appTimeToDb("10:00"),
            duracion: 60,
            estado: "atendido",
            tipoSesion: "Control",
          },
        });

      await turno("t-real", patient.id, professional.id, "10-03-2026");
      await turno("t-afectado-real", affected.id, professional.id, "01-04-2026");
      await turno("t-afectado-demo", affected.id, mock.id, "20-04-2026");

      const result = runScript("prisma/purge-demo-data.ts", { DATABASE_URL: url });
      assert.equal(result.status, 0, result.output);

      const realAfter = await client.paciente.findUniqueOrThrow({ where: { id: patient.id } });
      assert.equal(
        realAfter.ultimoTurno?.toISOString(),
        appDateToDb("10-03-2026").toISOString(),
        "paciente real sin turnos demo: no cambia"
      );

      const affectedAfter = await client.paciente.findUniqueOrThrow({
        where: { id: affected.id },
      });
      assert.equal(
        affectedAfter.ultimoTurno?.toISOString(),
        appDateToDb("01-04-2026").toISOString(),
        "paciente real que perdió un turno demo: se recalcula"
      );
    });
  });
});
