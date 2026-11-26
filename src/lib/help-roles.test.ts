import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roleGuides } from "@/data/help-content";
import { getRoleLabel } from "@/lib/auth/roles";

describe("Ayuda: perfiles", () => {
  it("explica todos los perfiles del sistema, también el Superadmin", () => {
    const explained = roleGuides.map((guide) => guide.name);
    for (const role of ["superadmin", "admin", "profesional"] as const) {
      assert.ok(explained.includes(getRoleLabel(role)), `falta ${getRoleLabel(role)}`);
    }
  });
});
