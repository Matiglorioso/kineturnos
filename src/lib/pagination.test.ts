import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPageNumbers, isPageSize, paginate } from "./pagination";

const items = Array.from({ length: 57 }, (_, index) => index + 1);

describe("paginate", () => {
  it("muestra los primeros 10 en la página 1", () => {
    const slice = paginate(items, 1, 10);
    assert.deepEqual(slice.items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(slice.pageCount, 6);
    assert.equal(slice.from, 1);
    assert.equal(slice.to, 10);
    assert.equal(slice.total, 57);
  });

  it("la última página trae solo lo que queda", () => {
    const slice = paginate(items, 6, 10);
    assert.deepEqual(slice.items, [51, 52, 53, 54, 55, 56, 57]);
    assert.equal(slice.from, 51);
    assert.equal(slice.to, 57);
  });

  it("una página fuera de rango (por un filtro o un borrado) muestra la última", () => {
    const slice = paginate(items, 9, 25);
    assert.equal(slice.page, 3);
    assert.deepEqual(slice.items, items.slice(50));
  });

  it("acota páginas inválidas a la primera", () => {
    assert.equal(paginate(items, 0, 10).page, 1);
    assert.equal(paginate(items, Number.NaN, 10).page, 1);
  });

  it("sin elementos: una sola página vacía", () => {
    const slice = paginate([], 1, 10);
    assert.deepEqual(slice.items, []);
    assert.equal(slice.pageCount, 1);
    assert.equal(slice.from, 0);
    assert.equal(slice.to, 0);
  });
});

describe("getPageNumbers", () => {
  it("con pocas páginas las muestra todas", () => {
    assert.deepEqual(getPageNumbers(2, 5), [1, 2, 3, 4, 5]);
  });

  it("en el medio: primera, vecinas y última", () => {
    assert.deepEqual(getPageNumbers(6, 12), [1, "…", 5, 6, 7, "…", 12]);
  });

  it("cerca del principio y del final no deja saltos de una sola página", () => {
    assert.deepEqual(getPageNumbers(1, 12), [1, 2, 3, 4, "…", 12]);
    assert.deepEqual(getPageNumbers(12, 12), [1, "…", 9, 10, 11, 12]);
  });
});

describe("isPageSize", () => {
  it("solo acepta las cantidades del selector", () => {
    assert.equal(isPageSize(25), true);
    assert.equal(isPageSize(30), false);
    assert.equal(isPageSize("10"), false);
  });
});
