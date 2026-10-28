import {
  CalendarDays,
  FileHeart,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CLINIC_CLOSING_TIME, CLINIC_OPENING_TIME } from "@/lib/appointment-constants";
import { EXPIRING_SOON_DAYS, FEW_SESSIONS_LEFT } from "@/lib/insurance";
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
    "KineTurnos reúne la agenda, los pacientes y su historia clínica, los profesionales y las obras sociales del consultorio. Esta página resume cómo se usa cada sección.",
};

export const quickStartSteps: string[] = [
  "Ingresá con el email y la contraseña temporal que te dio Administración; la primera vez el sistema te pide elegir una propia.",
  "Empezá el día en el Panel: en «Para hacer» registrás la asistencia de los turnos que ya pasaron y confirmás los del día siguiente.",
  "Agendá desde «Agendar turno» (arriba a la derecha o en la Agenda): buscá al paciente por nombre o DNI y elegí profesional, fecha y horario libre.",
  "Después de cada sesión, el profesional carga la evolución en la historia clínica del paciente.",
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
    summary: "Lo que hay que hacer hoy, la agenda del día y los indicadores del consultorio.",
    tips: [
      "«Para hacer»: registrar asistencia (Atendido o Ausente), confirmar los turnos del día siguiente con el teléfono a mano y revisar coberturas.",
      "Indicadores: sesiones atendidas, pacientes, cancelación y ausentismo de la semana, el mes o el mes anterior.",
    ],
  },
  {
    icon: CalendarDays,
    title: "Agenda",
    summary: "Turnos por día, por semana o por profesional, con filtros por estado, paciente y profesional.",
    tips: [
      `Los turnos duran 1 hora, entre las ${CLINIC_OPENING_TIME} y las ${CLINIC_CLOSING_TIME}, en los días que atiende cada profesional; el sistema no deja superponer turnos.`,
      "Cada turno tiene a mano la acción más probable: Confirmar si está pendiente, Atendido si ya empezó. El resto (ausente, cancelar, editar, historia clínica) está en el menú «⋯».",
      "La vista Profesionales muestra una columna por profesional: un horario libre abre el alta con profesional y hora ya elegidos.",
    ],
  },
  {
    icon: Users,
    title: "Pacientes",
    summary: "Alta, búsqueda por nombre, DNI, CUIL o teléfono, y ficha con datos, cobertura y turnos.",
    tips: [
      "El DNI es obligatorio y único; el CUIL y la fecha de nacimiento son opcionales.",
      "Desde la ficha podés agendarle un turno, cargar una autorización o abrir su historia clínica.",
      "Un paciente con historia clínica no se elimina: se desactiva y deja de aparecer al agendar.",
    ],
  },
  {
    icon: FileHeart,
    title: "Historia clínica",
    summary: "Una evolución por sesión, con diagnóstico y plan vigentes, objetivos del tratamiento, alertas y antecedentes.",
    tips: [
      "La ven Administración y los profesionales que atendieron o atienden al paciente.",
      "Solo quien cargó una evolución puede corregirla, y dentro de las 24 horas; después queda cerrada.",
      "Cada consulta y cada cambio quedan registrados en «Ver accesos».",
    ],
  },
  {
    icon: Stethoscope,
    title: "Profesionales",
    summary: "El equipo de kinesiólogos, con especialidad, matrícula y días de atención.",
    tips: [
      "La matrícula es única por profesional.",
      "Un profesional con turnos por venir no se puede eliminar: se desactiva.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Obras sociales",
    summary: "Autorizaciones de sesiones, catálogo de obras sociales y planilla mensual de asistencia para facturar.",
    tips: [
      "Cada sesión atendida se descuenta de la autorización vigente del paciente.",
      "La planilla mensual lista, por obra social, los pacientes, las sesiones atendidas y su autorización, lista para imprimir.",
    ],
  },
  {
    icon: UserCog,
    title: "Usuarios",
    summary: "Accesos del personal (solo Administración).",
    tips: [
      "Al crear un usuario o restablecer su contraseña, el sistema genera una contraseña temporal que se muestra una sola vez.",
      "Los usuarios no se borran: se desactivan.",
    ],
  },
];

export const appointmentStatuses: {
  name: string;
  description: string;
}[] = [
  {
    name: "Pendiente",
    description: "Turno agendado; todavía no se confirmó con el paciente.",
  },
  {
    name: "Confirmado",
    description: "El paciente confirmó que viene.",
  },
  {
    name: "Atendido",
    description: "La sesión se hizo: cuenta para la autorización y habilita cargar la evolución.",
  },
  {
    name: "Cancelado",
    description: "El turno se anuló antes de la sesión y el horario queda libre.",
  },
  {
    name: "Ausente",
    description: "El paciente no vino y no avisó.",
  },
];

/** Situación de las autorizaciones, con los mismos nombres que en Obras sociales y en la lista de pacientes. */
export const authorizationStatuses: {
  name: string;
  description: string;
}[] = [
  { name: "Vigente", description: "Aprobada, con sesiones disponibles y dentro de su vigencia." },
  {
    name: "Por renovar",
    description: `Vigente, pero le quedan ${FEW_SESSIONS_LEFT} sesiones o menos, o vence en ${EXPIRING_SOON_DAYS} días o menos.`,
  },
  { name: "En trámite", description: "Pedida a la obra social y todavía sin aprobar." },
  { name: "Agotada", description: "Ya se usaron todas las sesiones autorizadas." },
  { name: "Vencida", description: "Pasó su fecha de vencimiento." },
  { name: "Sin autorización", description: "El paciente tiene obra social pero no hay ninguna autorización cargada." },
];

export const roleGuides: {
  name: string;
  description: string;
}[] = [
  {
    name: "Administración",
    description:
      "Dueños y recepción: agenda de todos los profesionales, pacientes, historias clínicas, profesionales, obras sociales y usuarios.",
  },
  {
    name: "Profesional",
    description:
      "Su propia agenda, la asistencia de sus turnos y la historia clínica de sus pacientes.",
  },
];

export const systemScope: string[] = [
  "Un consultorio por instalación (SANMAR SALUD en esta instancia).",
  "Correos automáticos al paciente cuando se agenda, confirma, reprograma o cancela un turno, y un recordatorio entre 2 y 24 horas antes del turno.",
  "Sin recordatorios por WhatsApp ni facturación electrónica: la planilla mensual se presenta a la obra social.",
];

export const supportInfo = {
  title: "Soporte",
  lines: [
    "Ante dudas de acceso o de configuración, consultá a Administración.",
    "Para problemas técnicos del sistema, comunicate con quien gestiona KineTurnos.",
  ],
};

export const helpSectionNav = [
  { id: "inicio", label: "Inicio" },
  { id: "inicio-rapido", label: "Primeros pasos" },
  { id: "modulos", label: "Módulos" },
  { id: "estados", label: "Estados" },
  { id: "perfiles", label: "Perfiles" },
  { id: "alcance", label: "Alcance" },
  { id: "soporte", label: "Soporte" },
] as const;
