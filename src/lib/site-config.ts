import type { Metadata } from "next";

export const siteConfig = {
  name: "KineTurnos",
  tagline: "Gestión kinesiológica",
  url: "https://kineturnos.vercel.app",
  repo: "https://github.com/Matiglorioso/kineturnos",
  description:
    "Sistema moderno para organizar turnos, pacientes y profesionales en consultorios de kinesiología.",
  shortDescription: "Turnos y pacientes para tu consultorio kinesiológico.",
  locale: "es_AR",
  keywords: [
    "kinesiología",
    "turnos",
    "consultorio",
    "pacientes",
    "agenda médica",
    "rehabilitación",
  ],
} as const;

export const pageMetadata = {
  dashboard: {
    title: "Panel",
    description:
      "Resumen diario de turnos, pacientes activos y actividad reciente del consultorio.",
  },
  agenda: {
    title: "Agenda",
    description:
      "Programá y gestioná turnos por día o semana, con filtros por profesional y estado.",
  },
  pacientes: {
    title: "Pacientes",
    description:
      "Registro, búsqueda y seguimiento de pacientes con historial de sesiones.",
  },
  profesionales: {
    title: "Profesionales",
    description:
      "Equipo de kinesiólogos, horarios de atención y turnos asignados por profesional.",
  },
  proyecto: {
    title: "Acerca del proyecto",
    description:
      "Case study de KineTurnos: stack técnico, decisiones de arquitectura y roadmap.",
  },
} as const;

export function createPageMetadata(
  page: keyof typeof pageMetadata
): Metadata {
  const { title, description } = pageMetadata[page];

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NODE_ENV === "production"
        ? siteConfig.url
        : "http://localhost:3000")
  ),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.shortDescription,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};
