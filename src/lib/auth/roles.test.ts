import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRoleLabel, roleFromLabel } from "@/lib/auth/roles";

describe("Perfiles: etiquetas", () => {
  it("los perfiles del consultorio son Administrador y Profesional", () => {
    assert.equal(getRoleLabel("admin"), "Administrador");
    assert.equal(getRoleLabel("profesional"), "Profesional");
  });

  it("el Superadmin conserva su etiqueta técnica", () => {
    assert.equal(getRoleLabel("superadmin"), "Superadmin");
  });

  it("roleFromLabel vuelve del texto al código", () => {
    assert.equal(roleFromLabel("Administrador"), "admin");
    assert.equal(roleFromLabel("Profesional"), "profesional");
    assert.equal(roleFromLabel("Superadmin"), "superadmin");
  });

  it("los registros anteriores que guardaron «Administración» siguen leyéndose como admin", () => {
    assert.equal(roleFromLabel("Administración"), "admin");
  });

  it("una etiqueta desconocida no se asigna a ningún perfil", () => {
    assert.equal(roleFromLabel("Otro"), null);
  });
});
