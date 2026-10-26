import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  api,
  cleanupTestData,
  createProfessional,
  createUser,
  login,
  prisma,
  testId,
  type Auth,
} from "./helpers";

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

type Created = { user: { id: string; email: string; mustChangePassword: boolean }; temporaryPassword: string };

const userBody = (overrides: Record<string, unknown> = {}) => {
  const id = testId("user");
  return { id, name: `Usuario ${id}`, email: `${id}@test.local`, role: "admin", professionalId: "", ...overrides };
};

async function adminSession(): Promise<{ id: string; auth: Auth }> {
  const user = await createUser({ rol: "admin" });
  return { id: user.id, auth: await login(user.email) };
}

describe("API de usuarios: acceso", () => {
  it("Administración lista los usuarios sin exponer contraseñas; un Profesional recibe 403", async () => {
    const admin = await adminSession();
    const res = await api<Record<string, unknown>[]>("/api/users", { auth: admin.auth });
    assert.equal(res.status, 200, res.error);
    assert.ok(res.data?.some((user) => user.id === admin.id));
    assert.ok(res.data?.every((user) => !("passwordHash" in user) && !("password_hash" in user)));

    const profe = await createUser({ rol: "profesional" });
    const forbidden = await api("/api/users", { auth: await login(profe.email) });
    assert.equal(forbidden.status, 403);
  });
});

describe("alta con contraseña temporal y cambio obligatorio", () => {
  it("crea el usuario vinculado, obliga a cambiar la contraseña y registra el ingreso", async () => {
    const admin = await adminSession();
    const professional = await createProfessional();
    const body = userBody({ role: "profesional", professionalId: professional.id });

    const created = await api<Created>("/api/users", { method: "POST", body, auth: admin.auth });
    assert.equal(created.status, 201, created.error);
    const { temporaryPassword } = created.data!;
    assert.match(temporaryPassword, /^Kine-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
    assert.equal(created.data?.user.mustChangePassword, true);

    const record = await prisma.usuario.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(record.profesionalId, professional.id);
    assert.notEqual(record.passwordHash, temporaryPassword);

    // Con la temporal entra, pero la API solo le deja cambiarla.
    const session = await login(body.email, temporaryPassword);
    const blocked = await api("/api/appointments", { auth: session });
    assert.equal(blocked.status, 403);
    assert.match(blocked.error ?? "", /cambiar tu contraseña/);

    const wrongCurrent = await api("/api/account/password", {
      method: "POST",
      body: { currentPassword: "otra-cosa-1", newPassword: "MiClave2026" },
      auth: session,
    });
    assert.equal(wrongCurrent.status, 400);
    assert.equal(wrongCurrent.field, "currentPassword");

    const weak = await api("/api/account/password", {
      method: "POST",
      body: { currentPassword: temporaryPassword, newPassword: "solotexto" },
      auth: session,
    });
    assert.equal(weak.status, 400);
    assert.equal(weak.field, "newPassword");

    const changed = await api("/api/account/password", {
      method: "POST",
      body: { currentPassword: temporaryPassword, newPassword: "MiClave2026" },
      auth: session,
    });
    assert.equal(changed.status, 200, changed.error);
    assert.equal((await api("/api/appointments", { auth: session })).status, 200);

    const after = await prisma.usuario.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(after.debeCambiarPassword, false);
    assert.ok(after.ultimoIngreso);
    await assert.rejects(login(body.email, temporaryPassword));
    await login(body.email, "MiClave2026");
  });

  it("valida los datos: email repetido, profesional ya vinculado y Profesional sin vínculo", async () => {
    const admin = await adminSession();
    const professional = await createProfessional();
    const first = userBody({ role: "profesional", professionalId: professional.id });
    assert.equal((await api("/api/users", { method: "POST", body: first, auth: admin.auth })).status, 201);

    const sameEmail = await api("/api/users", {
      method: "POST",
      body: userBody({ email: first.email.toUpperCase() }),
      auth: admin.auth,
    });
    assert.equal(sameEmail.status, 409);
    assert.equal(sameEmail.field, "email");

    const sameProfessional = await api("/api/users", {
      method: "POST",
      body: userBody({ role: "profesional", professionalId: professional.id }),
      auth: admin.auth,
    });
    assert.equal(sameProfessional.status, 409);
    assert.equal(sameProfessional.field, "professionalId");

    const unlinked = await api("/api/users", {
      method: "POST",
      body: userBody({ role: "profesional" }),
      auth: admin.auth,
    });
    assert.equal(unlinked.status, 400);
    assert.equal(unlinked.field, "professionalId");
  });
});

describe("reglas de gestión", () => {
  it("Administración no crea ni edita usuarios Superadmin; un Superadmin sí", async () => {
    const admin = await adminSession();
    const denied = await api("/api/users", {
      method: "POST",
      body: userBody({ role: "superadmin" }),
      auth: admin.auth,
    });
    assert.equal(denied.status, 403);

    const superadmin = await createUser({ rol: "superadmin" });
    const editDenied = await api(`/api/users/${superadmin.id}`, {
      method: "PATCH",
      body: { name: "Cambio", email: superadmin.email, role: "superadmin", professionalId: "" },
      auth: admin.auth,
    });
    assert.equal(editDenied.status, 403);

    const superSession = await login(superadmin.email);
    const allowed = await api("/api/users", {
      method: "POST",
      body: userBody({ role: "superadmin" }),
      auth: superSession,
    });
    assert.equal(allowed.status, 201, allowed.error);
  });

  it("nadie se desactiva ni se cambia el perfil a sí mismo", async () => {
    const admin = await adminSession();
    const record = await prisma.usuario.findUniqueOrThrow({ where: { id: admin.id } });
    const base = { name: record.nombre, email: record.email, role: "admin", professionalId: "" };

    const deactivate = await api(`/api/users/${admin.id}`, {
      method: "PATCH",
      body: { ...base, active: false },
      auth: admin.auth,
    });
    assert.equal(deactivate.status, 400);
    assert.equal(deactivate.field, "active");

    const professional = await createProfessional();
    const demote = await api(`/api/users/${admin.id}`, {
      method: "PATCH",
      body: { ...base, role: "profesional", professionalId: professional.id },
      auth: admin.auth,
    });
    assert.equal(demote.status, 400);
    assert.equal(demote.field, "role");

    const reset = await api(`/api/users/${admin.id}/password`, { method: "POST", auth: admin.auth });
    assert.equal(reset.status, 400);
  });

  it("restablecer invalida la contraseña anterior; desactivar corta la sesión abierta", async () => {
    const admin = await adminSession();
    const target = await createUser({ rol: "admin" });
    const targetSession = await login(target.email);

    const reset = await api<Created>(`/api/users/${target.id}/password`, { method: "POST", auth: admin.auth });
    assert.equal(reset.status, 200, reset.error);
    await assert.rejects(login(target.email));
    await login(target.email, reset.data!.temporaryPassword);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: target.id } })).debeCambiarPassword, true);

    const deactivated = await api<{ active: boolean }>(`/api/users/${target.id}`, {
      method: "PATCH",
      body: { name: target.nombre, email: target.email, role: "admin", professionalId: "", active: false },
      auth: admin.auth,
    });
    assert.equal(deactivated.status, 200, deactivated.error);
    assert.equal(deactivated.data?.active, false);
    assert.equal((await api("/api/patients", { auth: targetSession })).status, 401);
  });
});
