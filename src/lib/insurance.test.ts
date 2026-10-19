import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCoverageStatus,
  normalizeInsuranceName,
  parseAuthorizationInput,
  parseInsuranceInput,
  pickAuthorizationForSession,
  summarizeCoverage,
  type AuthorizationUsage,
} from "./insurance";

function auth(overrides: Partial<AuthorizationUsage>): AuthorizationUsage {
  return {
    id: "a",
    number: "123",
    state: "aprobada",
    sessions: 10,
    used: 0,
    validFrom: "01-10-2026",
    validUntil: "31-12-2026",
    ...overrides,
  };
}

const TODAY = "19-10-2026";

describe("catálogo de obras sociales", () => {
  it("normaliza el nombre para no duplicar", () => {
    assert.equal(normalizeInsuranceName("  OSDE   210 "), "osde 210");
    assert.equal(normalizeInsuranceName("Swiss Medical"), normalizeInsuranceName("swiss  medical"));
  });

  it("valida el nombre y rechaza 'Particular'", () => {
    assert.deepEqual(parseInsuranceInput({ name: " APROSS  SAID " }), {
      input: { name: "APROSS SAID", active: true, notes: null },
    });
    assert.equal(parseInsuranceInput({ name: "" }).field, "name");
    assert.equal(parseInsuranceInput({ name: "particular" }).field, "name");
    assert.equal(parseInsuranceInput({ name: "Galeno", active: false }).input?.active, false);
  });
});

describe("qué autorización consume una sesión atendida", () => {
  it("una aprobada, vigente en la fecha y con sesiones disponibles", () => {
    assert.equal(pickAuthorizationForSession([auth({ id: "a" })], "15-10-2026")?.id, "a");
  });

  it("no usa autorizaciones en trámite, rechazadas, agotadas ni fuera de fecha", () => {
    const date = "15-10-2026";
    assert.equal(pickAuthorizationForSession([auth({ state: "pendiente" })], date), null);
    assert.equal(pickAuthorizationForSession([auth({ state: "rechazada" })], date), null);
    assert.equal(pickAuthorizationForSession([auth({ used: 10 })], date), null);
    assert.equal(pickAuthorizationForSession([auth({ validFrom: "16-10-2026" })], date), null);
    assert.equal(pickAuthorizationForSession([auth({ validUntil: "14-10-2026" })], date), null);
  });

  it("si hay varias, la que vence primero (las sin vencimiento al final)", () => {
    const picked = pickAuthorizationForSession(
      [
        auth({ id: "sin-vencimiento", validUntil: null }),
        auth({ id: "diciembre", validUntil: "31-12-2026" }),
        auth({ id: "noviembre", validUntil: "30-11-2026" }),
      ],
      "15-10-2026"
    );
    assert.equal(picked?.id, "noviembre");
  });
});

describe("estado de la cobertura del paciente", () => {
  it("sin obra social es particular", () => {
    assert.deepEqual(getCoverageStatus(false, [auth({})], TODAY), { kind: "particular" });
  });

  it("vigente con las sesiones que quedan", () => {
    const status = getCoverageStatus(true, [auth({ used: 4 })], TODAY);
    assert.equal(status.kind, "vigente");
    assert.equal(status.kind === "vigente" && status.remaining, 6);
    assert.deepEqual(summarizeCoverage(status, TODAY), {
      tone: "ok",
      label: "6 de 10 sesiones disponibles · vence 31/12/2026",
    });
  });

  it("avisa cuando quedan pocas sesiones o vence pronto", () => {
    assert.equal(summarizeCoverage(getCoverageStatus(true, [auth({ used: 8 })], TODAY), TODAY).tone, "warning");
    assert.equal(
      summarizeCoverage(getCoverageStatus(true, [auth({ validUntil: "24-10-2026" })], TODAY), TODAY).tone,
      "warning"
    );
  });

  it("en trámite, agotada, vencida o sin autorización", () => {
    assert.equal(getCoverageStatus(true, [auth({ state: "pendiente" })], TODAY).kind, "pendiente");
    const agotada = getCoverageStatus(true, [auth({ used: 10 })], TODAY);
    assert.equal(agotada.kind, "agotada");
    assert.equal(summarizeCoverage(agotada, TODAY).label, "Autorización agotada (10 de 10 sesiones)");
    const vencida = getCoverageStatus(true, [auth({ validUntil: "30-09-2026", validFrom: "01-09-2026" })], TODAY);
    assert.equal(vencida.kind, "vencida");
    assert.equal(summarizeCoverage(vencida, TODAY).label, "Autorización vencida el 30/09/2026");
    assert.equal(getCoverageStatus(true, [auth({ state: "rechazada" })], TODAY).kind, "sin-autorizacion");
    assert.equal(summarizeCoverage(getCoverageStatus(true, [], TODAY), TODAY).tone, "alert");
  });

  it("una vigente tiene prioridad sobre una vieja agotada", () => {
    const status = getCoverageStatus(
      true,
      [auth({ id: "vieja", used: 10, validFrom: "01-08-2026" }), auth({ id: "nueva", used: 1 })],
      TODAY
    );
    assert.equal(status.kind === "vigente" && status.authorization.id, "nueva");
  });
});

describe("validación de la autorización", () => {
  it("acepta una autorización completa", () => {
    assert.deepEqual(
      parseAuthorizationInput({
        number: " 4521 ",
        state: "aprobada",
        sessions: "10",
        validFrom: "01-10-2026",
        validUntil: "31-12-2026",
        notes: "",
      }),
      {
        input: {
          number: "4521",
          state: "aprobada",
          sessions: 10,
          validFrom: "01-10-2026",
          validUntil: "31-12-2026",
          notes: null,
        },
      }
    );
  });

  it("exige sesiones y fecha de inicio, y que el vencimiento no sea anterior", () => {
    const base = { sessions: 10, validFrom: "01-10-2026" };
    assert.equal(parseAuthorizationInput({ ...base, sessions: 0 }).field, "sessions");
    assert.equal(parseAuthorizationInput({ ...base, sessions: 2.5 }).field, "sessions");
    assert.equal(parseAuthorizationInput({ ...base, validFrom: "" }).field, "validFrom");
    assert.equal(parseAuthorizationInput({ ...base, validUntil: "30-09-2026" }).field, "validUntil");
    assert.equal(parseAuthorizationInput({ ...base, state: "otra" }).field, "state");
    assert.equal(parseAuthorizationInput(base).input?.state, "pendiente");
  });
});
