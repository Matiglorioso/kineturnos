import {
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  History,
  SearchX,
  Stethoscope,
  UserPlus,
  Users,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

export type EmptyStatePreset = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const emptyStates = {
  patients: {
    none: {
      icon: Users,
      title: "Aún no hay pacientes",
      description:
        "Registrá el primer paciente para asignar turnos y llevar su historial de sesiones.",
    },
    noResults: {
      icon: SearchX,
      title: "Sin coincidencias",
      description:
        "Probá con otro nombre, DNI, teléfono u obra social, o limpiá la búsqueda para ver todos.",
    },
  },
  professionals: {
    none: {
      icon: Stethoscope,
      title: "Aún no hay profesionales",
      description:
        "Sumá kinesiólogos al equipo para asignarlos en la agenda y definir sus horarios.",
    },
  },
  agenda: {
    none: {
      icon: CalendarDays,
      title: "La agenda está vacía",
      description:
        "Agendá el primer turno para organizar las sesiones del consultorio día a día.",
    },
    noToday: {
      icon: Calendar,
      title: "Sin turnos para hoy",
      description:
        "No hay sesiones programadas para esta fecha. Podés agendar una nueva o revisar otra vista.",
    },
    noWeek: {
      icon: CalendarDays,
      title: "Semana sin turnos",
      description:
        "No hay turnos en esta semana con los filtros actuales. Navegá a otra semana o agendá uno nuevo.",
    },
    noFilterResults: {
      icon: CalendarX2,
      title: "Ningún turno con estos filtros",
      description:
        "Cambiá el estado o el profesional seleccionado, o limpiá los filtros para ver más resultados.",
    },
    dayInline: {
      icon: CalendarClock,
      title: "Sin turnos",
      description: "Este día no tiene sesiones programadas.",
    },
  },
  dashboard: {
    noUpcoming: {
      icon: CalendarClock,
      title: "Sin turnos próximos",
      description:
        "Cuando agendes sesiones a futuro, las verás aquí con fecha, horario y estado.",
    },
    noActivity: {
      icon: History,
      title: "Sin actividad reciente",
      description:
        "Altas de pacientes y cambios de estado en turnos aparecerán en este panel.",
    },
    noAppointments: {
      icon: CalendarDays,
      title: "Sin turnos registrados",
      description:
        "El resumen por estado se actualizará cuando haya turnos en la agenda.",
    },
  },
  patientDetail: {
    noUpcoming: {
      icon: CalendarClock,
      title: "Sin turnos próximos",
      description:
        "Este paciente no tiene sesiones programadas. Podés agendar una desde la agenda.",
    },
    noHistory: {
      icon: History,
      title: "Sin historial de turnos",
      description:
        "Aún no hay sesiones anteriores. El historial se completa al atender o cerrar turnos.",
    },
  },
  professionalDetail: {
    noUpcoming: {
      icon: CalendarClock,
      title: "Sin turnos próximos",
      description:
        "Este profesional no tiene sesiones asignadas. Podés agendar un turno desde la agenda.",
    },
  },
  global: {
    loadError: {
      icon: WifiOff,
      title: "No pudimos cargar los datos",
      description:
        "Revisá tu conexión o volvé a intentar. Si el problema continúa, la sesión puede haber expirado.",
    },
  },
} as const satisfies Record<string, Record<string, EmptyStatePreset>>;

/** Etiquetas de acción sugeridas para empty states */
export const emptyStateActions = {
  scheduleAppointment: "Agendar turno",
  registerPatient: "Registrar paciente",
  registerProfessional: "Registrar profesional",
  clearSearch: "Limpiar búsqueda",
  clearFilters: "Limpiar filtros",
  goToAgenda: "Ir a la agenda",
  goToPatients: "Ver pacientes",
} as const;
