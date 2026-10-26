import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProfessionalDayGrid } from "./agenda-professionals";
import type { Appointment, Professional } from "@/types";

const professional = (overrides: Partial<Professional>): Professional => ({
  id: "pr",
  name: "Profesional",
  firstName: "Pro",
  lastName: "Fesional",
  specialty: "Deportiva",
  days: ["Lunes", "Miércoles"],
  active: true,
  avatarColor: "bg-brand-500",
  ...overrides,
});

const appointment = (overrides: Partial<Appointment>): Appointment => ({
  id: "t",
  patientId: "p-1",
  patientName: "Ana Torres",
  professionalId: "pr-laura",
  professionalName: "Laura",
  date: "26-10-2026", // lunes
  time: "09:00",
  status: "confirmado",
  sessionType: "Rehabilitación",
  ...overrides,
});

const laura = professional({ id: "pr-laura", name: "Laura Fernández" });
const diego = professional({ id: "pr-diego", name: "Diego Martínez", days: ["Martes"] });
const inactiva = professional({ id: "pr-ina", name: "Inés Inactiva", active: false });
// Un día anterior al de los turnos: nada "ya empezó".
const now = new Date("2026-10-20T12:00:00.000Z");

describe("vista de agenda por profesional (RF03)", () => {
  it("una columna por profesional activo que atiende ese día, con los bloques de 1 h del consultorio", () => {
    const grid = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [diego, laura, inactiva],
      visibleAppointments: [],
      allAppointments: [],
      now,
    });

    assert.deepEqual(grid.slots, ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]);
    assert.deepEqual(grid.columns.map((column) => column.professional.name), ["Laura Fernández"]);
    assert.equal(grid.columns[0].freeCount, 10);
  });

  it("ubica los turnos en su bloque, cuenta los libres y no muestra los cancelados", () => {
    const turnos = [
      appointment({ id: "a", time: "09:00" }),
      appointment({ id: "b", time: "11:30", status: "pendiente" }),
      appointment({ id: "c", time: "15:00", status: "cancelado" }),
    ];
    const [column] = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [laura],
      visibleAppointments: turnos,
      allAppointments: turnos,
      now,
    }).columns;

    assert.equal(column.appointmentCount, 2);
    assert.equal(column.cells[1].kind, "turnos");
    assert.equal(column.cells[3].kind, "turnos"); // 11:30 cae en el bloque de 11:00
    assert.equal(column.cells[4].kind, "ocupado"); // 11:30 a 12:30 también toma el bloque de 12:00
    assert.equal(column.cells[7].kind, "libre"); // el cancelado libera las 15:00
    assert.equal(column.freeCount, 7);
  });

  it("con filtro por estado cancelado, los muestra", () => {
    const cancelado = appointment({ time: "15:00", status: "cancelado" });
    const [column] = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [laura],
      visibleAppointments: [cancelado],
      allAppointments: [cancelado],
      showCancelled: true,
      now,
    }).columns;
    assert.equal(column.cells[7].kind, "turnos");
  });

  it("un turno oculto por los filtros deja el bloque ocupado (no libre)", () => {
    const oculto = appointment({ time: "10:00", patientId: "otro" });
    const [column] = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [laura],
      visibleAppointments: [],
      allAppointments: [oculto],
      now,
    }).columns;
    assert.equal(column.cells[2].kind, "ocupado");
    assert.equal(column.freeCount, 9);
  });

  it("hoy, los bloques que ya empezaron no se ofrecen", () => {
    const [column] = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [laura],
      visibleAppointments: [],
      allAppointments: [],
      now: new Date("2026-10-26T13:30:00.000Z"), // 10:30 en Buenos Aires
    }).columns;
    assert.deepEqual(
      column.cells.slice(0, 4).map((cell) => cell.kind),
      ["pasado", "pasado", "pasado", "libre"]
    );
  });

  it("muestra a quien tiene turnos aunque ese día no atienda o esté inactivo, sin ofrecer horarios", () => {
    const turno = appointment({ professionalId: "pr-diego", time: "08:00" });
    const grid = buildProfessionalDayGrid({
      date: "26-10-2026",
      professionals: [laura, diego],
      visibleAppointments: [turno],
      allAppointments: [turno],
      now,
    });
    const column = grid.columns.find((item) => item.professional.id === "pr-diego")!;
    assert.equal(column.worksThatDay, false);
    assert.equal(column.cells[0].kind, "turnos");
    assert.equal(column.freeCount, 0);
  });

  it("el filtro de profesional deja una sola columna; un domingo no hay columnas", () => {
    assert.equal(
      buildProfessionalDayGrid({
        date: "28-10-2026",
        professionals: [laura, professional({ id: "pr-2", name: "Otra", days: ["Miércoles"] })],
        visibleAppointments: [],
        allAppointments: [],
        professionalFilter: "pr-laura",
        now,
      }).columns.length,
      1
    );
    assert.equal(
      buildProfessionalDayGrid({
        date: "25-10-2026",
        professionals: [laura, diego],
        visibleAppointments: [],
        allAppointments: [],
        now,
      }).columns.length,
      0
    );
  });
});
