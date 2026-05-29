import { siteConfig } from "@/lib/site-config";

export const publicHelpIntro = {
  title: "Ayuda para ingresar",
  description:
    "Respuestas rápidas antes de acceder al sistema. Una vez dentro, encontrás la guía completa en el menú Ayuda.",
};

export const publicHelpFaqs: { question: string; answer: string }[] = [
  {
    question: "¿Quién me da usuario y contraseña?",
    answer:
      "El administrador del consultorio crea las cuentas del equipo. Si no tenés acceso, contactá soporte.",
  },
  {
    question: "Olvidé mi contraseña, ¿qué hago?",
    answer:
      "Por ahora la recuperación la gestiona el administrador del sistema. Escribinos y te ayudamos a restablecerla.",
  },
  {
    question: "¿Qué puedo hacer dentro de KineTurnos?",
    answer:
      "Gestionar agenda, pacientes y profesionales: agendar turnos, confirmar, marcar atendidos y ver el resumen del día.",
  },
  {
    question: "¿Funciona en el celular?",
    answer:
      "Sí. La interfaz es responsive y podés usarla desde recepción o consultorio en mobile, tablet o desktop.",
  },
];

export function getSupportMailto(): string {
  return `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(
    `Soporte ${siteConfig.name} - ${siteConfig.clinicName}`
  )}`;
}
