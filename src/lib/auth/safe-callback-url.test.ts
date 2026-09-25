import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeCallbackUrl } from "./safe-callback-url";

describe("safeCallbackUrl (A4: open redirect)", () => {
  it("sin callbackUrl vuelve al inicio", () => {
    assert.equal(safeCallbackUrl(null), "/");
    assert.equal(safeCallbackUrl(undefined), "/");
    assert.equal(safeCallbackUrl(""), "/");
  });

  it("acepta rutas internas (con query y hash)", () => {
    assert.equal(safeCallbackUrl("/agenda"), "/agenda");
    assert.equal(safeCallbackUrl("/pacientes?q=juan"), "/pacientes?q=juan");
    assert.equal(safeCallbackUrl("/agenda#hoy"), "/agenda#hoy");
  });

  for (const value of [
    "https://sitio-falso.com",
    "http://example.com/agenda",
    "//sitio-falso.com",
    "/\\sitio-falso.com",
    "\\\\sitio-falso.com",
    "/\t/sitio-falso.com",
    "javascript:alert(1)",
    "agenda",
  ]) {
    it(`rechaza ${JSON.stringify(value)}`, () => {
      assert.equal(safeCallbackUrl(value), "/");
    });
  }
});
