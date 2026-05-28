import { ActivityItem } from "@/types";

export const mockActivity: ActivityItem[] = [
  {
    id: "act1",
    type: "confirmation",
    message: "Turno confirmado para Maria Gonzalez - Rehabilitacion a las 08:00",
    timestamp: "2026-05-27T07:45:00",
  },
  {
    id: "act2",
    type: "appointment",
    message: "Roberto Mendez fue atendido por Dra. Camila Vargas",
    timestamp: "2026-05-27T10:15:00",
  },
  {
    id: "act3",
    type: "patient",
    message: "Nuevo paciente registrado: Valentina Castro",
    timestamp: "2026-05-26T16:30:00",
  },
  {
    id: "act4",
    type: "cancellation",
    message: "Ana Torres cancelo su turno de las 11:00",
    timestamp: "2026-05-27T08:20:00",
  },
  {
    id: "act5",
    type: "confirmation",
    message: "Diego Herrera confirmo turno de Traumatologia",
    timestamp: "2026-05-26T18:00:00",
  },
  {
    id: "act6",
    type: "appointment",
    message: "Martin Acosta marcado como ausente",
    timestamp: "2026-05-27T11:45:00",
  },
];
