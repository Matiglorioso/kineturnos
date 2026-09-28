import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RolUsuario } from "@prisma/client";
import {
  canAccessPage,
  canManagePatients,
  canManageProfessionals,
  canScheduleAppointments,
  hasPermission,
  isScopedToOwnProfessional,
  type Permission,
} from "./permissions";
import { canAccessAppPath, hasVerifyBypass, isPublicPath } from "./route-access";

const ROLES: RolUsuario[] = ["superadmin", "admin", "profesional"];

/** Matriz esperada rol × permiso; cualquier cambio en permisos debe reflejarse acá. */
const EXPECTED: Record<Permission, Record<RolUsuario, boolean>> = {
  "appointments:read": { superadmin: true, admin: true, profesional: true },
  "appointments:write": { superadmin: true, admin: true, profesional: false },
  "appointments:status": { superadmin: true, admin: true, profesional: true },
  "patients:read": { superadmin: true, admin: true, profesional: true },
  "patients:write": { superadmin: true, admin: true, profesional: false },
  "patients:delete": { superadmin: true, admin: true, profesional: false },
  "professionals:read": { superadmin: true, admin: true, profesional: true },
  "professionals:write": { superadmin: true, admin: true, profesional: false },
  "professionals:delete": { superadmin: true, admin: true, profesional: false },
};

describe("permisos: matriz rol × permiso", () => {
  for (const [permission, byRole] of Object.entries(EXPECTED) as [
    Permission,
    Record<RolUsuario, boolean>,
  ][]) {
    for (const role of ROLES) {
      it(`${role} ${byRole[role] ? "tiene" : "no tiene"} ${permission}`, () => {
        assert.equal(hasPermission(role, permission), byRole[role]);
      });
    }
  }
});

describe("permisos: helpers por capacidad", () => {
  it("administración y superadmin agendan turnos y gestionan pacientes y profesionales", () => {
    for (const role of ["superadmin", "admin"] as const) {
      assert.equal(canScheduleAppointments(role), true, role);
      assert.equal(canManagePatients(role), true, role);
      assert.equal(canManageProfessionals(role), true, role);
    }
  });

  it("el profesional no agenda ni gestiona pacientes o profesionales", () => {
    assert.equal(canScheduleAppointments("profesional"), false);
    assert.equal(canManagePatients("profesional"), false);
    assert.equal(canManageProfessionals("profesional"), false);
  });

  it("solo el rol profesional queda acotado a sus propios turnos", () => {
    assert.equal(isScopedToOwnProfessional("profesional"), true);
    assert.equal(isScopedToOwnProfessional("admin"), false);
    assert.equal(isScopedToOwnProfessional("superadmin"), false);
  });
});

describe("permisos: acceso a páginas", () => {
  it("todos los roles acceden a inicio, agenda, pacientes y proyecto", () => {
    for (const role of ROLES) {
      for (const path of ["/", "/agenda", "/pacientes", "/proyecto"]) {
        assert.equal(canAccessPage(role, path), true, `${role} → ${path}`);
      }
    }
  });

  it("el rol profesional no accede a /profesionales ni a sus subrutas", () => {
    assert.equal(canAccessPage("profesional", "/profesionales"), false);
    assert.equal(canAccessPage("profesional", "/profesionales/123"), false);
    assert.equal(canAccessPage("admin", "/profesionales"), true);
    assert.equal(canAccessPage("superadmin", "/profesionales/123"), true);
  });

  it("permite subrutas de un prefijo habilitado", () => {
    assert.equal(canAccessPage("profesional", "/agenda/semana"), true);
  });

  it("no confunde prefijos parciales con rutas habilitadas", () => {
    assert.equal(canAccessPage("admin", "/agendas"), false);
    assert.equal(canAccessPage("admin", "/pacientes-export"), false);
  });

  it("'/' habilita solo la raíz, no cualquier ruta", () => {
    assert.equal(canAccessPage("admin", "/configuracion"), false);
  });
});

describe("route-access", () => {
  it("login, ayuda, auth, health y cron son públicas (cron valida su propio secreto)", () => {
    for (const path of [
      "/login",
      "/ayuda",
      "/ayuda/turnos",
      "/api/auth/session",
      "/api/health/db",
      "/api/cron/notificaciones",
    ]) {
      assert.equal(isPublicPath(path), true, path);
    }
  });

  it("el resto de las rutas requieren sesión", () => {
    for (const path of ["/", "/agenda", "/loginx", "/api/patients", "/api/cronx"]) {
      assert.equal(isPublicPath(path), false, path);
    }
  });

  it("canAccessAppPath deja pasar /api (la autorización la hace cada endpoint)", () => {
    assert.equal(canAccessAppPath("profesional", "/api/professionals"), true);
    assert.equal(canAccessAppPath("profesional", "/profesionales"), false);
  });
});

describe("bypass de verificación (VERIFY_SECRET)", () => {
  const env = process.env as Record<string, string | undefined>;
  const request = (secret?: string) =>
    new Request("http://localhost:3000/api/patients", {
      headers: secret ? { "x-verify-secret": secret } : {},
    });

  function withEnv(values: Record<string, string | undefined>, fn: () => void) {
    const previous = { NODE_ENV: env.NODE_ENV, VERIFY_SECRET: env.VERIFY_SECRET };
    Object.assign(env, values);
    try {
      fn();
    } finally {
      Object.assign(env, previous);
    }
  }

  it("fuera de producción, con el secreto correcto y solo en /api", () => {
    withEnv({ NODE_ENV: "development", VERIFY_SECRET: "s3cr3t" }, () => {
      assert.equal(hasVerifyBypass(request("s3cr3t"), "/api/patients"), true);
      assert.equal(hasVerifyBypass(request("otro"), "/api/patients"), false);
      assert.equal(hasVerifyBypass(request(), "/api/patients"), false);
      assert.equal(hasVerifyBypass(request("s3cr3t"), "/agenda"), false);
    });
  });

  it("nunca en producción, ni sin VERIFY_SECRET configurado", () => {
    withEnv({ NODE_ENV: "production", VERIFY_SECRET: "s3cr3t" }, () => {
      assert.equal(hasVerifyBypass(request("s3cr3t"), "/api/patients"), false);
    });
    withEnv({ NODE_ENV: "development", VERIFY_SECRET: undefined }, () => {
      assert.equal(hasVerifyBypass(request(""), "/api/patients"), false);
    });
  });
});
