import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAppointmentLinkUrls,
  createAppointmentLinkToken,
  evaluatePatientLink,
  getAppointmentLinkSecret,
  minutesUntilAppointment,
  verifyAppointmentLinkToken,
} from "@/lib/appointment-links";

const SECRET = "secreto-de-prueba";
const slot = { appointmentId: "trn_1", date: "17-11-2026", time: "10:00" };
// 16-11-2026 12:00 en Buenos Aires (UTC-3).
const NOW = new Date("2026-11-16T15:00:00Z");

describe("enlaces firmados de turno", () => {
  it("el enlace vuelve con el mismo turno, fecha y hora", () => {
    const token = createAppointmentLinkToken(slot, SECRET);
    assert.deepEqual(verifyAppointmentLinkToken(token, SECRET), slot);
  });

  it("no se puede modificar ni usar con otro secreto", () => {
    const token = createAppointmentLinkToken(slot, SECRET);
    const [payload, signature] = token.split(".");
    const otherPayload = Buffer.from(JSON.stringify({ a: "trn_2", d: slot.date, t: slot.time })).toString("base64url");
    assert.equal(verifyAppointmentLinkToken(`${otherPayload}.${signature}`, SECRET), null);
    assert.equal(verifyAppointmentLinkToken(token, "otro-secreto"), null);
    assert.equal(verifyAppointmentLinkToken(`${payload}`, SECRET), null);
    assert.equal(verifyAppointmentLinkToken("basura.basura", SECRET), null);
  });

  it("el secreto deriva de AUTH_SECRET; sin él no hay enlaces", () => {
    assert.equal(getAppointmentLinkSecret({ AUTH_SECRET: "abc" }), "abc:enlaces-de-turno");
    assert.equal(getAppointmentLinkSecret({}), null);
  });

  it("un turno pendiente ofrece confirmar y cancelar; uno confirmado, solo cancelar", () => {
    assert.deepEqual(buildAppointmentLinkUrls("https://kt.app/", "tok", "pendiente"), {
      confirmUrl: "https://kt.app/turno/tok/confirmar",
      cancelUrl: "https://kt.app/turno/tok/cancelar",
    });
    assert.deepEqual(buildAppointmentLinkUrls("https://kt.app", "tok", "confirmado"), {
      cancelUrl: "https://kt.app/turno/tok/cancelar",
    });
  });
});

describe("qué puede hacer el paciente con el enlace", () => {
  const pending = { date: "17-11-2026", time: "10:00", status: "pendiente" as const };

  it("calcula los minutos que faltan con la hora del consultorio", () => {
    assert.equal(minutesUntilAppointment("17-11-2026", "10:00", NOW), 22 * 60);
    assert.equal(minutesUntilAppointment("16-11-2026", "11:00", NOW), -60);
  });

  it("confirma un turno pendiente que todavía no empezó", () => {
    assert.equal(evaluatePatientLink(pending, slot, "confirmar", NOW), "disponible");
    assert.equal(evaluatePatientLink({ ...pending, status: "confirmado" }, slot, "confirmar", NOW), "ya-confirmado");
  });

  it("cancela hasta 2 horas antes; después, fuera de plazo", () => {
    assert.equal(evaluatePatientLink(pending, slot, "cancelar", NOW), "disponible");
    // 17-11 08:30 en Buenos Aires: falta 1 h 30.
    const late = new Date("2026-11-17T11:30:00Z");
    assert.equal(evaluatePatientLink(pending, slot, "cancelar", late), "fuera-de-plazo");
    // Confirmar todavía se puede.
    assert.equal(evaluatePatientLink(pending, slot, "confirmar", late), "disponible");
  });

  it("turno cancelado, terminado, pasado o reprogramado", () => {
    assert.equal(evaluatePatientLink({ ...pending, status: "cancelado" }, slot, "confirmar", NOW), "cancelado");
    assert.equal(evaluatePatientLink({ ...pending, status: "atendido" }, slot, "cancelar", NOW), "finalizado");
    const after = new Date("2026-11-17T13:30:00Z");
    assert.equal(evaluatePatientLink(pending, slot, "confirmar", after), "finalizado");
    assert.equal(evaluatePatientLink({ ...pending, time: "11:00" }, slot, "cancelar", NOW), "turno-modificado");
  });
});
