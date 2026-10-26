import { listHourlySlotOptions, getHourlySlotStarts } from "@/lib/appointment-slots";
import { areSameAppDay, getNowAppMinutes, isTodayAppDate } from "@/lib/date-utils";
import { professionalWorksOnDay } from "@/lib/professional-schedule";
import { minutesToTime, normalizeTime, timeToMinutes } from "@/lib/time-utils";
import { sortAppointmentsByTime } from "@/lib/week-calendar";
import type { Appointment, Professional } from "@/types";

/**
 * Celda de la vista "Profesionales" (RF03): un bloque de 1 h de un profesional.
 * - turnos: los turnos que se muestran (con los filtros de la agenda aplicados);
 * - libre: se puede agendar;
 * - ocupado: lo ocupa un turno que los filtros ocultan;
 * - pasado: ya empezó (hoy) y no tiene turnos.
 */
export type ProfessionalDayCell =
  | { time: string; kind: "turnos"; appointments: Appointment[] }
  | { time: string; kind: "libre" }
  | { time: string; kind: "ocupado" }
  | { time: string; kind: "pasado" };

export interface ProfessionalDayColumn {
  professional: Professional;
  /** Atiende ese día de la semana (si no, aparece solo porque tiene turnos). */
  worksThatDay: boolean;
  appointmentCount: number;
  freeCount: number;
  cells: ProfessionalDayCell[];
}

export interface ProfessionalDayGrid {
  slots: string[];
  columns: ProfessionalDayColumn[];
}

/** Bloque de 1 h al que pertenece un horario (un turno a las 08:30 cae en el de 08:00). */
function slotOf(time: string): string {
  return minutesToTime(Math.floor(timeToMinutes(normalizeTime(time)) / 60) * 60);
}

/**
 * Agenda de un día con una columna por profesional: los activos que atienden
 * ese día, más cualquiera que tenga turnos visibles ese día (para no ocultarlos).
 *
 * @param visibleAppointments turnos con los filtros de la agenda aplicados (se muestran).
 * @param allAppointments todos los turnos (definen qué horarios están libres).
 */
export function buildProfessionalDayGrid(options: {
  date: string;
  professionals: Professional[];
  visibleAppointments: Appointment[];
  allAppointments: Appointment[];
  /** Solo esta columna (filtro "Profesional" de la agenda), o "todos". */
  professionalFilter?: string;
  /** Los cancelados liberan el horario: solo se muestran si se filtra por ese estado. */
  showCancelled?: boolean;
  now?: Date;
}): ProfessionalDayGrid {
  const { date, professionals, visibleAppointments, allAppointments, now } = options;
  const slots = getHourlySlotStarts();
  const nowMinutes = isTodayAppDate(date, now ?? new Date()) ? getNowAppMinutes(now ?? new Date()) : null;
  const dayAppointments = visibleAppointments.filter(
    (appointment) =>
      areSameAppDay(appointment.date, date) && (options.showCancelled || appointment.status !== "cancelado")
  );
  const withAppointments = new Set(dayAppointments.map((appointment) => appointment.professionalId));

  const columns = professionals
    .filter(
      (professional) =>
        (options.professionalFilter ?? "todos") === "todos" || professional.id === options.professionalFilter
    )
    .map((professional) => ({
      professional,
      worksThatDay: professional.active && professionalWorksOnDay(professional, date),
    }))
    .filter(({ professional, worksThatDay }) => worksThatDay || withAppointments.has(professional.id))
    .sort((a, b) => a.professional.name.localeCompare(b.professional.name, "es"))
    .map(({ professional, worksThatDay }): ProfessionalDayColumn => {
      const own = sortAppointmentsByTime(
        dayAppointments.filter((appointment) => appointment.professionalId === professional.id)
      );
      const availability = new Map(
        (worksThatDay ? listHourlySlotOptions(professional, date, allAppointments, undefined, { now }) : []).map(
          (slot) => [slot.startTime, slot.available]
        )
      );

      const cells = slots.map((time): ProfessionalDayCell => {
        const inSlot = own.filter((appointment) => slotOf(appointment.time) === time);
        if (inSlot.length > 0) return { time, kind: "turnos", appointments: inSlot };
        if (availability.get(time)) return { time, kind: "libre" };
        if (!worksThatDay) return { time, kind: "pasado" };
        // No está libre: o ya empezó, o lo ocupa un turno (oculto por los filtros, o uno
        // fuera de hora como 11:30, que también toma parte del bloque de 12:00).
        const started = nowMinutes !== null && timeToMinutes(time) < nowMinutes;
        return { time, kind: started ? "pasado" : "ocupado" };
      });

      return {
        professional,
        worksThatDay,
        appointmentCount: own.length,
        freeCount: cells.filter((cell) => cell.kind === "libre").length,
        cells,
      };
    });

  return { slots, columns };
}
