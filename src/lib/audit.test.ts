import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  auditPeriodStart,
  diffAuditSnapshots,
  filterAuditEntries,
  formatAuditValue,
  parseAuditPeriodDays,
  resolveAuditAction,
  shouldRecordAudit,
} from "./audit";

describe("auditoría: formato de valores", () => {
  it("DATE y TIME se leen en UTC, como los devuelve Prisma", () => {
    assert.equal(formatAuditValue(new Date("2026-11-03T00:00:00Z"), "date"), "03-11-2026");
    assert.equal(formatAuditValue(new Date("1970-01-01T09:00:00Z"), "time"), "09:00");
  });

  it("booleanos, listas y vacíos", () => {
    assert.equal(formatAuditValue(true, "bool"), "Sí");
    assert.equal(formatAuditValue(false), "No");
    assert.equal(formatAuditValue(["lunes", "martes"], "list"), "lunes, martes");
    assert.equal(formatAuditValue([], "list"), null);
    assert.equal(formatAuditValue("  "), null);
    assert.equal(formatAuditValue(undefined), null);
  });
});

describe("auditoría: diferencias", () => {
  const turno = {
    pacienteNombre: "Ana Gómez",
    profesionalNombre: "Julieta Paz",
    fecha: new Date("2026-11-03T00:00:00Z"),
    hora: new Date("1970-01-01T09:00:00Z"),
    estado: "pendiente",
    tipoSesion: "Kinesiología",
    observaciones: null,
  };

  it("guarda solo lo que cambió, con el valor anterior y el nuevo", () => {
    const changes = diffAuditSnapshots("turno", turno, {
      ...turno,
      hora: new Date("1970-01-01T10:00:00Z"),
    });
    assert.deepEqual(changes, [{ field: "hora", label: "Hora", before: "09:00", after: "10:00" }]);
  });

  it("en un alta registra los datos cargados y en una baja los que tenía", () => {
    const alta = diffAuditSnapshots("turno", null, turno);
    assert.equal(alta.length, 6);
    assert.ok(alta.every((change) => change.before === null));

    const baja = diffAuditSnapshots("turno", turno, null);
    assert.equal(baja.length, 6);
    assert.ok(baja.every((change) => change.after === null));
  });

  it("ignora campos fuera de la lista blanca (nunca guarda contraseñas)", () => {
    const changes = diffAuditSnapshots(
      "usuario",
      { nombre: "Ana", passwordHash: "viejo" },
      { nombre: "Ana", passwordHash: "nuevo" }
    );
    assert.deepEqual(changes, []);
  });

  it("un cambio que solo toca el estado es un cambio de estado", () => {
    const soloEstado = diffAuditSnapshots("turno", turno, { ...turno, estado: "atendido" });
    assert.equal(resolveAuditAction("modificacion", soloEstado), "cambio_estado");

    const estadoYHora = diffAuditSnapshots("turno", turno, {
      ...turno,
      estado: "confirmado",
      hora: new Date("1970-01-01T11:00:00Z"),
    });
    assert.equal(resolveAuditAction("modificacion", estadoYHora), "modificacion");
    assert.equal(resolveAuditAction("alta", soloEstado), "alta");
  });

  it("una modificación sin cambios no se registra; un ingreso sí", () => {
    assert.equal(shouldRecordAudit("modificacion", []), false);
    assert.equal(shouldRecordAudit("cambio_estado", []), false);
    assert.equal(shouldRecordAudit("ingreso", []), true);
    assert.equal(shouldRecordAudit("baja", []), true);
  });
});

describe("auditoría: período y filtros", () => {
  it("el período arranca a las 00:00 de Buenos Aires", () => {
    // 13-11-2026 01:00 en Buenos Aires = 04:00 UTC.
    const now = new Date("2026-11-13T04:00:00Z");
    assert.equal(auditPeriodStart(1, now).toISOString(), "2026-11-13T03:00:00.000Z");
    assert.equal(auditPeriodStart(7, now).toISOString(), "2026-11-07T03:00:00.000Z");

    // 13-11-2026 22:00 en Buenos Aires = 14-11 01:00 UTC: sigue siendo el 13.
    const late = new Date("2026-11-14T01:00:00Z");
    assert.equal(auditPeriodStart(1, late).toISOString(), "2026-11-13T03:00:00.000Z");
  });

  it("solo acepta los períodos de la pantalla", () => {
    assert.equal(parseAuditPeriodDays("30"), 30);
    assert.equal(parseAuditPeriodDays("12"), 7);
    assert.equal(parseAuditPeriodDays(null), 7);
  });

  it("filtra por usuario (o nombre, si no es usuario) y por tipo de registro", () => {
    const entries = [
      { id: "1", userId: "u1", userName: "Ana", entity: "turno" as const },
      { id: "2", userId: null, userName: "Paciente Pérez", entity: "turno" as const },
      { id: "3", userId: "u1", userName: "Ana", entity: "paciente" as const },
    ];
    const ids = (list: typeof entries) => list.map((entry) => entry.id);

    assert.deepEqual(ids(filterAuditEntries(entries, { userKey: "u1", entity: "todas" })), ["1", "3"]);
    assert.deepEqual(
      ids(filterAuditEntries(entries, { userKey: "nombre:Paciente Pérez", entity: "todas" })),
      ["2"]
    );
    assert.deepEqual(ids(filterAuditEntries(entries, { userKey: "todos", entity: "paciente" })), ["3"]);
  });
});

describe("auditoría: navegador", () => {
  it("resume el user agent", async () => {
    const { describeUserAgent } = await import("./audit");
    assert.equal(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36"
      ),
      "Chrome en Windows"
    );
    assert.equal(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
      ),
      "Safari en iPhone"
    );
    assert.equal(describeUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120"), "Edge en Windows");
    assert.equal(describeUserAgent("curl/8.0"), null);
    assert.equal(describeUserAgent(null), null);
  });
});
