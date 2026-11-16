/**
 * Captura del correo de alta de turno (con los botones para confirmar o cancelar),
 * para la tesis. No necesita base de datos: arma el correo con datos de demostración.
 *
 *   npx tsx scripts/screenshots/correo.ts   # guarda docs/screenshots/correo-turno.png
 */
import { buildAppointmentEmail } from "@/lib/notifications/templates";
import { chromium } from "@playwright/test";
import { join } from "node:path";

async function main() {
  const { html } = buildAppointmentEmail(
    "creacion",
    {
      patientName: "Federico Ledesma",
      professionalName: "Laura Méndez",
      date: "18-11-2026",
      time: "10:00",
      sessionType: "Rehabilitación",
      status: "pendiente",
    },
    { confirmUrl: "https://example.com/confirmar", cancelUrl: "https://example.com/cancelar" }
  );

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: join(process.cwd(), "docs", "screenshots", "correo-turno.png"), fullPage: true });
  await browser.close();
  console.log("OK correo-turno.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
