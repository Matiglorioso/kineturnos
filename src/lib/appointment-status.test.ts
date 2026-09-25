import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_FILTERS,
  APPOINTMENT_STATUS_FORM_OPTIONS,
  APPOINTMENT_STATUS_LABELS,
  canTransitionAppointmentStatus,
  FINAL_APPOINTMENT_STATUSES,
  getAppointmentStatusLabel,
  getNextAppointmentStatuses,
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
