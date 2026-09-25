import { after } from "next/server";
import { dispatchNotifications } from "@/lib/db/notifications";

function dispatchNow(ids: string[]) {
  return dispatchNotifications({ ids }).catch((error) => {
    console.error("No se pudieron enviar las notificaciones", ids, error);
  });
}

/**
 * Envía los correos recién encolados después de responder, sin demorar la
 * respuesta de la API. Si falla, el cron horario los reintenta.
 * Fuera de un request (scripts, tests) `after` no está disponible: se envían en el momento.
 */
export function scheduleNotificationDispatch(ids: string[]): void {
  if (ids.length === 0) return;

  try {
    after(() => dispatchNow(ids));
  } catch {
    void dispatchNow(ids);
  }
}
