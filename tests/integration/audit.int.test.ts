import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { api, cleanupTestData, createUser, login, prisma, testId, uniqueDigits } from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

type AuditRow = { accion: string; cambios: unknown; usuarioNombre: string; registro: string };

const auditOf = (entidadId: string) =>
  prisma.auditoria.findMany({
    where: { entidadId },
    orderBy: { fecha: "asc" },
  }) as Promise<(AuditRow & { id: string })[]>;

describe("Auditoría", () => {
  it("registra alta, modificación (antes y después) y baja de un paciente", async () => {
    const id = testId("pac");
    const body = {
      id,
      firstName: "Audit",
      lastName: "Paciente",
      dni: uniqueDigits(8),
      phone: "+54 11 9999-9999",
      email: "",
      insurance: "Particular",
      status: "activo",
      notes: "",
    };

    assert.equal((await api("/api/patients", { method: "POST", body })).status, 201);
    // Guardar sin cambios no deja registro.
    assert.equal((await api(`/api/patients/${id}`, { method: "PATCH", body })).status, 200);
    assert.equal(
      (await api(`/api/patients/${id}`, { method: "PATCH", body: { ...body, phone: "+54 11 1111-1111" } })).status,
      200
    );
    assert.equal((await api(`/api/patients/${id}`, { method: "DELETE" })).status, 200);

    const rows = await auditOf(id);
    assert.deepEqual(
      rows.map((row) => row.accion),
      ["alta", "modificacion", "baja"]
    );
    assert.deepEqual(rows[1].cambios, [
      { field: "telefono", label: "Teléfono", before: "+54 11 9999-9999", after: "+54 11 1111-1111" },
    ]);
    assert.equal(rows[0].registro, "Audit Paciente");
  });

  it("el registro no se puede modificar ni borrar (trigger en la base)", async () => {
    const [row] = await prisma.auditoria.findMany({ take: 1 });
    assert.ok(row, "debería haber al menos un evento");

    await assert.rejects(prisma.auditoria.update({ where: { id: row.id }, data: { registro: "x" } }));
    await assert.rejects(prisma.auditoria.delete({ where: { id: row.id } }));
    await assert.rejects(prisma.$executeRawUnsafe('TRUNCATE "auditoria"'));
  });

  it("registra los ingresos exitosos y fallidos", async () => {
    const user = await createUser({ rol: "admin" });
    await assert.rejects(login(user.email, "clave-incorrecta-1"));
    await login(user.email);

    const rows = await prisma.auditoria.findMany({ where: { entidad: "sesion", entidadId: user.id } });
    assert.ok(rows.some((row) => row.accion === "ingreso_fallido"));
    assert.ok(rows.some((row) => row.accion === "ingreso" && row.usuarioId === user.id));
  });

  it("solo el Superadmin consulta la auditoría", async () => {
    const admin = await createUser({ rol: "admin" });
    const superadmin = await createUser({ rol: "superadmin" });

    const forbidden = await api("/api/auditoria", { auth: await login(admin.email) });
    assert.equal(forbidden.status, 403);

    const ok = await api<{ items: { entity: string }[]; truncated: boolean }>("/api/auditoria?dias=1", {
      auth: await login(superadmin.email),
    });
    assert.equal(ok.status, 200, ok.error);
    assert.ok(ok.data && ok.data.items.length > 0);
  });
});
