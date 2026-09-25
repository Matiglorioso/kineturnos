import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  normalizeDni,
  normalizeLicense,
} from "../../src/lib/document-validation";
import { prisma, TEST_PREFIX } from "./helpers";

const notTestData = { NOT: { id: { startsWith: TEST_PREFIX } } };

after(() => prisma.$disconnect());

describe("integridad de la base sembrada", () => {
  it("hay pacientes y profesionales del seed", async () => {
    assert.ok((await prisma.paciente.count({ where: notTestData })) > 0);
    assert.ok((await prisma.profesional.count({ where: notTestData })) > 0);
  });

  it("existen los usuarios admin, recepción y profesional", async () => {
    const users = await prisma.usuario.findMany({ where: notTestData });
    const roles = new Set(users.map((user) => user.rol));

    assert.ok(roles.has("admin"));
    assert.ok(roles.has("recepcion"));
    assert.ok(roles.has("profesional"));
  });

  it("dni_normalizado coincide con el DNI y no se repite", async () => {
    const patients = await prisma.paciente.findMany({ where: notTestData });

    for (const patient of patients) {
      assert.equal(patient.dniNormalizado, normalizeDni(patient.dni), patient.id);
    }
    const normalized = patients.map((patient) => patient.dniNormalizado);
    assert.equal(new Set(normalized).size, normalized.length);
  });

  it("los pacientes del seed tienen los campos completos", async () => {
    const incomplete = await prisma.paciente.findMany({
      where: {
        ...notTestData,
        OR: [
          { nombrePila: null },
          { apellido: null },
          { email: null },
          { fechaAlta: null },
        ],
      },
      select: { id: true },
    });

    assert.deepEqual(incomplete, []);
  });

  it("matricula_normalizada coincide con la matrícula y no se repite", async () => {
    const professionals = await prisma.profesional.findMany({ where: notTestData });

    for (const professional of professionals) {
      if (!professional.matricula) continue;
      assert.equal(
        professional.matriculaNormalizada,
        normalizeLicense(professional.matricula),
        professional.id
      );
    }
    const licenses = professionals
      .map((professional) => professional.matriculaNormalizada)
      .filter(Boolean);
    assert.equal(new Set(licenses).size, licenses.length);
  });

  it("todos los turnos apuntan a un paciente y un profesional existentes", async () => {
    const [{ orphans }] = await prisma.$queryRaw<{ orphans: number }[]>`
      SELECT COUNT(*)::int AS orphans
      FROM turnos t
      LEFT JOIN pacientes p ON p.id = t.paciente_id
      LEFT JOIN profesionales pr ON pr.id = t.profesional_id
      WHERE p.id IS NULL OR pr.id IS NULL`;
    assert.equal(orphans, 0);
  });
});
