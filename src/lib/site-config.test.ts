import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSupportEmail } from "./site-config";

describe("mail de soporte", () => {
  it("usa el configurado", () => {
    assert.equal(resolveSupportEmail({ NEXT_PUBLIC_SUPPORT_EMAIL: " soporte@sanmarsalud.com " }), "soporte@sanmarsalud.com");
  });

  it("sin configurar no inventa uno (antes mostraba soporte@kineturnos.local)", () => {
    assert.equal(resolveSupportEmail({}), null);
    assert.equal(resolveSupportEmail({ NEXT_PUBLIC_SUPPORT_EMAIL: "  " }), null);
  });
});
