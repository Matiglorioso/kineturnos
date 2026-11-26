import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { newAppointmentId } from "./appointment-write";

describe("id de un turno nuevo", () => {
  it("lo genera el servidor, único aunque se pidan muchos en el mismo milisegundo", () => {
    const ids = Array.from({ length: 1000 }, () => newAppointmentId());
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^a-[0-9a-f-]{36}$/);
  });
});
