import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeBelongsToOpenList } from "./escape-key";

/** Elemento mínimo: lo único que usa la función es closest(). */
const element = (insideOpenList: boolean) => ({
  closest: (selector: string) =>
    insideOpenList && selector.includes('aria-expanded="true"') ? {} : null,
});

describe("Escape dentro de un diálogo", () => {
  it("con la lista de un buscador abierta, Escape es para la lista y no cierra el diálogo", () => {
    assert.equal(escapeBelongsToOpenList(element(true)), true);
  });

  it("sin lista abierta, Escape cierra el diálogo como siempre", () => {
    assert.equal(escapeBelongsToOpenList(element(false)), false);
    assert.equal(escapeBelongsToOpenList(null), false);
  });
});
