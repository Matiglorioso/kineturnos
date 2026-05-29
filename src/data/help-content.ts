import {
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const helpMeta = {
  title: "Ayuda",
  productName: siteConfig.name,
  clinicName: siteConfig.clinicName,
  version: "v1.0",
};

export const helpIntro = {
  title: "Guía de uso",
  description:
    "KineTurnos centraliza turnos, pacientes y profesionales del consultorio. Esta página resume los flujos principales para el equipo de recepción y kinesiólogos.",
};

export const quickStartSteps: string[] = [
  "Ingresá con el email y contraseña provistos por el administrador.",
  "Revisá el panel para ver la carga del día y los próximos turnos.",
  "Desde Agenda podés crear, editar o cambiar el estado de cada sesión.",
  "Registrá pacientes y profesionales desde sus módulos cuando haga falta.",
];

export const moduleGuides: {
  icon: LucideIcon;
  title: string;
  summary: string;
  tips: string[];
}[] = [
  {
    icon: LayoutDashboard,
    title: "Panel",
    summary: "Resumen operativo del día: turnos totales, confirmados, pendientes y actividad reciente.",
    tips: [
      "Usalo al iniciar la jornada para detectar pendientes o cancelaciones.",
      "Los próximos turnos muestran las sesiones más cercanas en el tiempo.",
    ],
  },
  {
    icon: CalendarDays,
    title: "Agenda",
    summary: "Programación por lista o vista semanal, con filtros por profesional y estado.",
    tips: [
      "Agendar turno valida horarios del profesional y evita solapamientos.",
      "Podés marcar confirmado, atendido, cancelado o ausente desde el detalle del turno.",
      "La vista Semana ayuda a distribuir la carga entre kinesiólogos.",
    ],
  },
  {
    icon: Users,
    title: "Pacientes",
    summary: "Alta, búsqueda, ficha con historial y próximos turnos de cada paciente.",
    tips: [
      "El DNI debe ser único; el sistema avisa si ya existe.",
      "Desactivar un paciente lo oculta de altas nuevas sin borrar su historial.",
    ],
  },
  {
    icon: Stethoscope,
    title: "Profesionales",
    summary: "Equipo de kinesiólogos con días, horario de atención y duración habitual de sesión.",
    tips: [
      "La matrícula es única por profesional.",
      "Solo se pueden agendar turnos dentro del horario configurado.",
    ],
  },
];

export const appointmentStatuses: {
  name: string;
  description: string;
}[] = [
  {
    name: "Pendiente",
    description: "Turno registrado; aún no confirmado con el paciente.",
  },
  {
    name: "Confirmado",
    description: "El paciente confirmó asistencia.",
  },
  {
    name: "Atendido",
    description: "Sesión realizada. Actualiza el último turno del paciente.",
  },
  {
    name: "Cancelado",
    description: "Turno anulado antes de la sesión.",
  },
  {
    name: "Ausente",
    description: "El paciente no asistió sin cancelar previamente.",
  },
];

export const systemScope: string[] = [
  "Un consultorio por instalación (Centro Kine Norte en esta instancia).",
  "Todos los usuarios con acceso ven los mismos módulos operativos.",
  "Sin recordatorios automáticos por email o WhatsApp por el momento.",
  "Sin facturación, obras sociales avanzadas ni historial clínico detallado.",
];

export const supportInfo = {
  title: "Soporte",
  lines: [
    "Ante dudas de acceso o configuración, contactá al administrador del sistema.",
    "Para incidencias técnicas del producto KineTurnos, comunicate con quien gestiona la plataforma.",
  ],
};

export const helpSectionNav = [
  { id: "inicio", label: "Inicio" },
  { id: "inicio-rapido", label: "Primeros pasos" },
  { id: "modulos", label: "Módulos" },
  { id: "estados", label: "Estados" },
  { id: "alcance", label: "Alcance" },
  { id: "soporte", label: "Soporte" },
] as const;
