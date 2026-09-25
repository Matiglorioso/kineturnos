import { dispatchNotifications, enqueueDueReminders } from "@/lib/db/notifications";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Cron horario (GitHub Actions, `.github/workflows/recordatorios.yml`):
 * encola los recordatorios de los turnos de las próximas 24 h y envía todo lo
 * pendiente, incluidos los reintentos de correos que fallaron.
 */
async function run(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const recordatorios = await enqueueDueReminders();
    const envio = await dispatchNotifications({ limit: 200 });
    return NextResponse.json({ data: { recordatorios, ...envio } });
  } catch (error) {
    console.error("/api/cron/notificaciones", error);
    return NextResponse.json(
      { error: "No se pudieron procesar las notificaciones." },
      { status: 503 }
    );
  }
}

export const GET = run;
export const POST = run;
