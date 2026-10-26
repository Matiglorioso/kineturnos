import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePasswordChangeBody, parseUserWriteInput } from "./api/parse-user-body";
import { newPasswordValidationError } from "./auth/password-policy";
import { generateTemporaryPassword } from "./auth/temporary-password";
import { assignableRoles, canManageUser, INITIAL_USER_FORM, selfEditError, validateUserForm } from "./user-form";
import { filterUsers, formatLastLogin } from "./user-list";
import type { AppUser } from "@/types";

const user = (overrides: Partial<AppUser>): AppUser => ({
  id: "u-1",
  name: "Usuario",
  email: "u@test.local",
  role: "admin",
  active: true,
  professionalId: null,
  professionalName: null,
  lastLogin: null,
  mustChangePassword: false,
  createdAt: "2026-10-01T12:00:00.000Z",
  ...overrides,
});

describe("política de contraseñas", () => {
  it("pide 8 caracteres con letras y números", () => {
    assert.equal(newPasswordValidationError("abc123"), "La contraseña debe tener al menos 8 caracteres");
    assert.equal(newPasswordValidationError("solotexto"), "La contraseña tiene que combinar letras y números");
    assert.equal(newPasswordValidationError("12345678"), "La contraseña tiene que combinar letras y números");
    assert.equal(newPasswordValidationError("MiClave2026"), undefined);
  });

  it("la temporal cumple la política, es legible y cambia cada vez", () => {
    const passwords = Array.from({ length: 50 }, generateTemporaryPassword);
    for (const password of passwords) {
      assert.match(password, /^Kine-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
      assert.doesNotMatch(password.slice(5), /[0O1lI]/);
      assert.equal(newPasswordValidationError(password), undefined);
    }
    assert.equal(new Set(passwords).size, passwords.length);
  });
});

describe("formulario y reglas de usuarios", () => {
  it("valida nombre, email y el profesional del perfil Profesional", () => {
    assert.deepEqual(Object.keys(validateUserForm(INITIAL_USER_FORM)).sort(), ["email", "name", "professionalId"]);
    assert.deepEqual(
      validateUserForm({ name: "Ana", email: "no-es-email", role: "admin", professionalId: "" }),
      { email: "Ingresá un email válido" }
    );
    assert.deepEqual(validateUserForm({ name: "Ana", email: "ana@test.local", role: "admin", professionalId: "" }), {});
  });

  it("solo un Superadmin asigna o gestiona el perfil Superadmin", () => {
    assert.deepEqual(assignableRoles("admin"), ["admin", "profesional"]);
    assert.deepEqual(assignableRoles("superadmin"), ["admin", "profesional", "superadmin"]);
    assert.equal(canManageUser("admin", { role: "superadmin" }), false);
    assert.equal(canManageUser("admin", { role: "profesional" }), true);
    assert.equal(canManageUser("superadmin", { role: "superadmin" }), true);
  });

  it("nadie se desactiva ni se cambia el perfil a sí mismo", () => {
    const self = { id: "u-1", role: "admin" as const };
    assert.equal(selfEditError("u-1", self, { active: false }), "No podés desactivar tu propio usuario");
    assert.equal(selfEditError("u-1", self, { role: "profesional" }), "No podés cambiar tu propio perfil");
    assert.equal(selfEditError("u-1", self, { role: "admin", active: true }), undefined);
    assert.equal(selfEditError("u-2", self, { active: false, role: "profesional" }), undefined);
  });
});

describe("parser de la API de usuarios", () => {
  it("normaliza y descarta el profesional si el perfil no es Profesional", () => {
    assert.deepEqual(
      parseUserWriteInput({ name: " Ana ", email: " Ana@Test.local ", role: "admin", professionalId: "pr-1" }).input,
      { id: undefined, name: "Ana", email: "Ana@Test.local", role: "admin", professionalId: null, active: undefined }
    );
  });

  it("rechaza perfil y estado inválidos", () => {
    assert.equal(parseUserWriteInput({ name: "Ana", email: "a@b.co", role: "dueño" }).field, "role");
    assert.equal(parseUserWriteInput({ name: "Ana", email: "a@b.co", role: "admin", active: "no" }).field, "active");
    assert.equal(parseUserWriteInput(null).error, "Cuerpo de solicitud invalido.");
  });

  it("el cambio de contraseña pide la actual y la nueva", () => {
    assert.equal(parsePasswordChangeBody({ newPassword: "x" }).field, "currentPassword");
    assert.equal(parsePasswordChangeBody({ currentPassword: "x" }).field, "newPassword");
    assert.deepEqual(parsePasswordChangeBody({ currentPassword: "a", newPassword: "b" }).input, {
      currentPassword: "a",
      newPassword: "b",
    });
  });
});

describe("lista de usuarios", () => {
  const users = [
    user({ id: "1", name: "Zoe Admin", role: "admin" }),
    user({ id: "2", name: "Ana Pérez", role: "profesional", professionalName: "Lic. Ana Pérez", active: false }),
    user({ id: "3", name: "Bruno Kine", role: "profesional", email: "bruno@consultorio.com" }),
  ];

  it("activos primero y por nombre", () => {
    assert.deepEqual(
      filterUsers(users, { search: "", role: "todos", status: "todos" }).map((item) => item.id),
      ["3", "1", "2"]
    );
  });

  it("filtra por perfil, estado y busca sin tildes por nombre, email o profesional", () => {
    assert.deepEqual(filterUsers(users, { search: "", role: "profesional", status: "activos" }).map((u) => u.id), ["3"]);
    assert.deepEqual(filterUsers(users, { search: "", role: "todos", status: "inactivos" }).map((u) => u.id), ["2"]);
    assert.deepEqual(filterUsers(users, { search: "perez", role: "todos", status: "todos" }).map((u) => u.id), ["2"]);
    assert.deepEqual(filterUsers(users, { search: "CONSULTORIO", role: "todos", status: "todos" }).map((u) => u.id), ["3"]);
  });

  it("último ingreso en la hora del consultorio: hoy, ayer, fecha o nunca", () => {
    const now = new Date("2026-10-19T18:00:00.000Z"); // 15:00 en Buenos Aires
    assert.equal(formatLastLogin(null, now), "Nunca");
    assert.equal(formatLastLogin("2026-10-19T12:05:00.000Z", now), "Hoy 09:05");
    assert.equal(formatLastLogin("2026-10-19T01:30:00.000Z", now), "Ayer 22:30");
    assert.equal(formatLastLogin("2026-10-03T15:00:00.000Z", now), "03/10/2026");
  });
});
