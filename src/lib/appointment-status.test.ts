import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_FILTERS,
  APPOINTMENT_STATUS_FORM_OPTIONS,
  APPOINTMENT_STATUS_LABELS,
  canRegisterAttendance,
  canTransitionAppointmentStatus,
  FINAL_APPOINTMENT_STATUSES,
  getAppointmentStatusLabel,
  getNextAppointmentStatuses,
  getQuickStatusAction,
  isActiveAppointmentStatus,
  isFinalAppointmentStatus,
} from "@/lib/appointment-status";
import type { AppointmentStatus } from "@/types";

const ALL_STATUSES = Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[];

describe("estados de turno: clasificación", () => {
  it("pendiente y confirmado son activos", () => {
    assert.equal(isActiveAppointmentStatus("pendiente"), true);
    assert.equal(isActiveAppointmentStatus("confirmado"), true);
    assert.equal(isFinalAppointmentStatus("pendiente"), false);
    assert.equal(isFinalAppointmentStatus("confirmado"), false);
  });

  it("atendido, cancelado y ausente son finales", () => {
    for (const status of ["atendido", "cancelado", "ausente"] as const) {
      assert.equal(isFinalAppointmentStatus(status), true, status);
      assert.equal(isActiveAppointmentStatus(status), false, status);
    }
  });

  it("solo los estados finales habilitan eliminar un turno", () => {
    // db/appointments.ts rechaza el delete si !isFinalAppointmentStatus.
    const deletable = ALL_STATUSES.filter(isFinalAppointmentStatus);
    assert.deepEqual(deletable.sort(), ["atendido", "ausente", "cancelado"]);
  });

  it("activos y finales particionan todos los estados", () => {
    const union = [...ACTIVE_APPOINTMENT_STATUSES, ...FINAL_APPOINTMENT_STATUSES];

    assert.equal(new Set(union).size, union.length, "sin solapamiento");
    assert.deepEqual([...union].sort(), [...ALL_STATUSES].sort());
  });
});

describe("estados de turno: etiquetas y opciones", () => {
  it("cada estado tiene etiqueta", () => {
    assert.equal(getAppointmentStatusLabel("pendiente"), "Pendiente");
    assert.equal(getAppointmentStatusLabel("ausente"), "Ausente");
    for (const status of ALL_STATUSES) {
      assert.ok(getAppointmentStatusLabel(status), status);
    }
  });

  it("los filtros empiezan con 'todos' y luego listan cada estado", () => {
    assert.deepEqual(APPOINTMENT_STATUS_FILTERS[0], {
      value: "todos",
      label: "Todos",
    });
    assert.deepEqual(
      APPOINTMENT_STATUS_FILTERS.slice(1).map((filter) => filter.value),
      ALL_STATUSES
    );
  });

  it("las opciones del formulario no incluyen 'todos'", () => {
    assert.deepEqual(
      APPOINTMENT_STATUS_FORM_OPTIONS.map((option) => option.value),
      ALL_STATUSES
    );
  });
});

describe("máquina de estados (diagrama de estados de la tesis)", () => {
  // Activo (pendiente, confirmado) → confirmar / cancelar / registrar asistencia.
  // Cancelado, atendido y ausente son finales: solo se eliminan.
  const NEXT: Record<AppointmentStatus, AppointmentStatus[]> = {
    pendiente: ["confirmado", "cancelado", "atendido", "ausente"],
    confirmado: ["cancelado", "atendido", "ausente"],
    atendido: [],
    cancelado: [],
    ausente: [],
  };

  for (const from of ALL_STATUSES) {
    it(`desde ${from}: ${NEXT[from].join(", ") || "ninguna transición"}`, () => {
      assert.deepEqual(getNextAppointmentStatuses(from), NEXT[from]);
      for (const to of ALL_STATUSES) {
        assert.equal(
          canTransitionAppointmentStatus(from, to),
          from === to || NEXT[from].includes(to),
          `${from} → ${to}`
        );
      }
    });
  }
});

describe("acción rápida de la agenda", () => {
  const today = "28-10-2026";
  const at = (date: string, time: string, status: AppointmentStatus) => ({ date, time, status });

  it("pendiente que todavía no empezó: confirmar", () => {
    assert.equal(getQuickStatusAction(at("29-10-2026", "09:00", "pendiente"), today, 600), "confirmado");
    assert.equal(getQuickStatusAction(at(today, "15:00", "pendiente"), today, 600), "confirmado");
  });

  it("confirmado que todavía no empezó: nada", () => {
    assert.equal(getQuickStatusAction(at("29-10-2026", "09:00", "confirmado"), today, 600), null);
  });

  it("ya empezó (hoy o antes): registrar que vino", () => {
    assert.equal(getQuickStatusAction(at(today, "10:00", "confirmado"), today, 600), "atendido");
    assert.equal(getQuickStatusAction(at("27-10-2026", "17:00", "pendiente"), today, 0), "atendido");
  });

  it("estados finales: nada", () => {
    for (const status of FINAL_APPOINTMENT_STATUSES) {
      assert.equal(getQuickStatusAction(at("27-10-2026", "09:00", status), today, 600), null);
    }
  });
});

describe("canRegisterAttendance", () => {
  it("hoy y días pasados sí; días futuros no", () => {
    assert.equal(canRegisterAttendance("28-10-2026", "28-10-2026"), true);
    assert.equal(canRegisterAttendance("01-10-2026", "28-10-2026"), true);
    assert.equal(canRegisterAttendance("29-10-2026", "28-10-2026"), false);
  });
});
