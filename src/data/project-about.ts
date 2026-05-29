import {
  CalendarDays,
  Database,
  LayoutDashboard,
  Shield,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export const projectMeta = {
  title: "KineTurnos",
  tagline: "Gestion de turnos para consultorios kinesiologicos",
  version: "Demo v0.2",
  year: "2026",
};

export const problemSolution = {
  problem: {
    title: "El problema",
    paragraphs: [
      "En consultorios de kinesiologia, coordinar pacientes, profesionales y horarios suele hacerse con planillas, WhatsApp o agendas genericas que no entienden sesiones, duraciones ni estados del turno.",
      "Eso genera solapamientos, poca visibilidad del dia y dificultad para ver el historial de un paciente o la carga de cada kinesiologo.",
    ],
  },
  solution: {
    title: "La solucion",
    paragraphs: [
      "KineTurnos centraliza la operacion diaria: agenda por dia o semana, fichas de pacientes, equipo de profesionales y un panel con metricas del dia.",
      "La demo prioriza claridad de flujo y feedback inmediato (toasts, estados vacios, confirmaciones) para que recepcion y profesionales trabajen con menos friccion.",
    ],
  },
};

export const mainFeatures: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard operativo",
    description:
      "Resumen del dia: turnos totales, confirmados, pendientes, cancelados y pacientes activos, con proximos turnos y actividad reciente.",
  },
  {
    icon: CalendarDays,
    title: "Agenda lista y semanal",
    description:
      "Vista por dia o semana laboral, filtros por estado y profesional, creacion y edicion de turnos con validacion de horarios.",
  },
  {
    icon: Users,
    title: "Gestion de pacientes",
    description:
      "Alta, edicion, busqueda, detalle con proximos turnos e historial, activacion/desactivacion y eliminacion con confirmacion.",
  },
  {
    icon: Stethoscope,
    title: "Profesionales y disponibilidad",
    description:
      "CRUD de kinesiologos con dias, horarios, duracion por defecto y validacion al asignar turnos dentro de su agenda.",
  },
  {
    icon: Shield,
    title: "Estados y confirmaciones",
    description:
      "Flujos para cancelar, marcar atendido o ausente, con dialogos de confirmacion y toasts de exito o error.",
  },
  {
    icon: Database,
    title: "PostgreSQL + API REST",
    description:
      "Persistencia en Neon con Prisma: CRUD de pacientes, profesionales y turnos via API Routes y hooks de dominio.",
  },
];

export const technologies = [
  { name: "Next.js 15", detail: "App Router, rutas por modulo, layout compartido" },
  { name: "React 19", detail: "Componentes client donde hace falta interactividad" },
  { name: "TypeScript", detail: "Tipos de dominio: paciente, turno, profesional" },
  { name: "Tailwind CSS", detail: "Sistema visual brand, responsive y animaciones" },
  { name: "shadcn/ui + Radix", detail: "Dialogos, selects, alertas accesibles" },
  { name: "date-fns", detail: "Fechas en espanol y logica de calendario" },
  { name: "Sonner", detail: "Toasts para feedback de acciones" },
  { name: "Neon + Prisma", detail: "PostgreSQL serverless, ORM y seed desde mocks" },
  { name: "API Routes", detail: "REST en Next.js: /api/patients, professionals, appointments" },
];

export const technicalDecisions: {
  title: string;
  rationale: string;
}[] = [
  {
    title: "App Router y paginas por dominio",
    rationale:
      "Separar Dashboard, Agenda, Pacientes y Profesionales facilita escalar el producto y que un reclutador navegue el alcance en minutos.",
  },
  {
    title: "Hooks de dominio + API REST",
    rationale:
      "usePatients, useProfessionals y useAppointments centralizan fetch, CRUD y toasts; la validacion se repite en cliente y servidor.",
  },
  {
    title: "Formato de fecha dd-MM-yyyy",
    rationale:
      "Convencion explicita en toda la app (utils + tipos) para evitar ambiguedad entre UI, filtros y calendario semanal.",
  },
  {
    title: "Validacion de turnos en capa de dominio",
    rationale:
      "Solapamientos, horario del profesional y fechas pasadas se resuelven en lib/ antes del submit, no solo en la UI.",
  },
  {
    title: "Patron closeDetailBeforeAction",
    rationale:
      "Cerrar modales de detalle antes de abrir confirmaciones evita overlays congelados con Radix Dialog + AlertDialog.",
  },
  {
    title: "Unicidad de DNI y matricula",
    rationale:
      "Normalizacion en document-validation.ts, constraints en Postgres (dni_normalizado, matricula_normalizada) y rechazo 409 en la API.",
  },
  {
    title: "Empty states y toasts centralizados",
    rationale:
      "Presets en empty-states.ts y appToasts en toast.ts mantienen mensajes coherentes en toda la experiencia.",
  },
];

export const demoLimitations: string[] = [
  "Sin autenticacion ni roles (recepcion vs profesional vs admin).",
  "Sin envio de recordatorios por email o WhatsApp.",
  "Sin facturacion, obras sociales avanzadas ni historial clinico detallado.",
  "Un solo consultorio; no hay multi-sede.",
  "Deploy en Vercel requiere configurar DATABASE_URL (ver docs/TU-PARTE-VERCEL.md).",
];

export const roadmap: {
  phase: string;
  items: string[];
}[] = [
  {
    phase: "Corto plazo",
    items: [
      "Autenticacion y permisos por rol.",
      "Actualizar ultimo_turno del paciente al atender sesiones.",
      "Migraciones Prisma formales en CI/CD.",
    ],
  },
  {
    phase: "Mediano plazo",
    items: [
      "Recordatorios automaticos y confirmacion por link.",
      "Reportes exportables (PDF / Excel) y metricas historicas.",
      "Bloqueo de agenda por feriados y sobreturnos.",
    ],
  },
  {
    phase: "Largo plazo",
    items: [
      "Multi-consultorio y turnos online.",
      "Integracion con obras sociales y fichas clinicas.",
      "App movil o PWA para profesionales en sala.",
    ],
  },
];

export const sectionNav = [
  { id: "overview", label: "Que es" },
  { id: "problem", label: "Problema" },
  { id: "features", label: "Funciones" },
  { id: "stack", label: "Stack" },
  { id: "decisions", label: "Decisiones" },
  { id: "limits", label: "Limites demo" },
  { id: "roadmap", label: "Roadmap" },
] as const;
