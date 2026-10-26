/**
 * Capturas de pantalla para el README y la tesis (escritorio 1440 px y celular 390 px).
 *
 *   npm run screenshots                  # base descartable con datos de demostración, build y capturas
 *   npm run screenshots -- --sin-build   # reutiliza la compilación anterior (.next-perf)
 *
 * Guarda los PNG en docs/screenshots. Usa la rama de pruebas de Neon (DATABASE_URL
 * de .env.local), nunca la de producción: crea y borra su propia base.
 */
import { createScratchApp } from "../lib/scratch-app";
import { seedDemo } from "./demo-data";
import { chromium, type Locator, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 3200;
const OUTPUT_DIR = join(process.cwd(), "docs", "screenshots");

interface Shot {
  file: string;
  path: string;
  /** Espera a que la pantalla esté lista (datos cargados) y la deja como se quiere mostrar. */
  prepare: (page: Page) => Promise<void>;
  fullPage?: boolean;
  /** Captura solo este elemento (p. ej. un formulario) en lugar de la página. */
  element?: (page: Page) => Locator;
}

async function login(page: Page, baseUrl: string, email: string, password: string) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").waitFor();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(`${baseUrl}/`);
}

async function capture(page: Page, baseUrl: string, shot: Shot) {
  await page.goto(`${baseUrl}${shot.path}`);
  await shot.prepare(page);
  // Deja terminar animaciones y la carga de fuentes.
  await page.waitForTimeout(600);
  if (shot.element) await shot.element(page).screenshot({ path: join(OUTPUT_DIR, shot.file) });
  else await page.screenshot({ path: join(OUTPUT_DIR, shot.file), fullPage: shot.fullPage ?? true });
  console.log(`OK ${shot.file}`);
}

const view = (page: Page, name: string) =>
  page.getByRole("group", { name: "Vista de la agenda" }).getByRole("button", { name }).click();

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const app = await createScratchApp("kineturnos_capturas", PORT);
  const password = randomBytes(12).toString("base64url") + "9a";

  try {
    const demo = await seedDemo(app.db, password);
    await app.start({ skipBuild: process.argv.includes("--sin-build") });
    const base = app.baseUrl;
    const historia = `/pacientes/${demo.featuredPatientId}/historia`;

    const desktop: Shot[] = [
      { file: "dashboard-desktop.png", path: "/", prepare: (p) => p.getByRole("region", { name: "Indicadores" }).waitFor() },
      {
        file: "agenda-dia-desktop.png",
        path: "/agenda",
        prepare: (p) => p.getByRole("group", { name: "Vista de la agenda" }).waitFor(),
      },
      {
        file: "agenda-semana-desktop.png",
        path: "/agenda",
        prepare: async (p) => {
          await view(p, "Semana");
          await p.getByText("Vista semanal").waitFor();
        },
      },
      {
        file: "agenda-profesionales-desktop.png",
        path: "/agenda",
        prepare: async (p) => {
          await view(p, "Profesionales");
          await p.getByRole("table", { name: "Turnos por profesional" }).waitFor();
        },
      },
      {
        // Prototipo "Formulario Turno": un turno completo, con el aviso de cobertura del paciente.
        file: "turno-formulario-desktop.png",
        path: "/agenda",
        element: (p) => p.getByRole("dialog", { name: "Agendar turno" }),
        prepare: async (p) => {
          await p.getByRole("main").getByRole("button", { name: "Agendar turno" }).first().click();
          const dialog = p.getByRole("dialog", { name: "Agendar turno" });
          await dialog.getByRole("combobox", { name: "Paciente" }).click();
          await p.getByRole("option", { name: new RegExp(demo.featuredPatientName) }).click();
          await dialog.getByRole("combobox", { name: "Profesional" }).click();
          await p.getByRole("option", { name: /Laura Méndez/ }).click();
          // Próximo día hábil de lunes a viernes (Laura Méndez no atiende sábados).
          let day = addDays(new Date(), 1);
          while (day.getDay() === 0 || day.getDay() === 6) day = addDays(day, 1);
          const date = dialog.getByLabel("Fecha");
          await date.fill(format(day, "dd-MM-yyyy"));
          await date.press("Tab");
          await dialog.getByRole("combobox", { name: "Horario" }).click();
          await p.getByRole("option").filter({ hasNotText: /Ocupado/i }).last().click();
          await dialog.getByRole("combobox", { name: "Tipo de sesión" }).click();
          await p.getByRole("option", { name: "Rehabilitación" }).click();
          await dialog.getByLabel("Observaciones").fill("Control de rodilla. Traer estudios.");
        },
      },
      {
        file: "pacientes-desktop.png",
        path: "/pacientes",
        prepare: (p) => p.getByRole("table").getByRole("row").nth(1).waitFor(),
        fullPage: false,
      },
      {
        file: "historia-clinica-desktop.png",
        path: historia,
        prepare: (p) => p.getByRole("list", { name: "Alertas clínicas" }).waitFor(),
      },
      {
        file: "autorizaciones-desktop.png",
        path: "/obras-sociales",
        prepare: (p) => p.getByRole("group", { name: "Resumen de autorizaciones" }).waitFor(),
        fullPage: false,
      },
      {
        file: "planilla-desktop.png",
        path: "/obras-sociales",
        prepare: async (p) => {
          await p.getByRole("tab", { name: /Planilla/ }).click();
          await p.getByRole("combobox", { name: "Obra social" }).click();
          await p.getByRole("option", { name: "OSDE" }).click();
          await p.getByRole("region", { name: "Planilla de asistencia" }).waitFor();
        },
      },
      {
        file: "profesionales-desktop.png",
        path: "/profesionales",
        prepare: (p) => p.getByText(/kinesiólogos · \d+ activos/).waitFor(),
      },
      { file: "usuarios-desktop.png", path: "/usuarios", prepare: (p) => p.getByRole("table").getByRole("row").nth(1).waitFor() },
    ];

    const mobile: Shot[] = [
      { file: "dashboard.png", path: "/", prepare: (p) => p.getByRole("region", { name: "Indicadores" }).waitFor() },
      {
        file: "agenda.png",
        path: "/agenda",
        prepare: (p) => p.getByRole("group", { name: "Vista de la agenda" }).waitFor(),
      },
      {
        file: "agenda-semana.png",
        path: "/agenda",
        prepare: async (p) => {
          await view(p, "Semana");
          await p.getByText("Vista semanal").waitFor();
        },
      },
      {
        file: "agenda-profesionales.png",
        path: "/agenda",
        prepare: async (p) => {
          await view(p, "Profesionales");
          await p.getByRole("tablist", { name: "Profesionales del día" }).waitFor();
        },
      },
      { file: "pacientes.png", path: "/pacientes", prepare: (p) => p.getByText(/registrados · \d+ activos/).waitFor() },
      { file: "historia-clinica.png", path: historia, prepare: (p) => p.getByRole("list", { name: "Alertas clínicas" }).waitFor() },
      {
        file: "profesionales.png",
        path: "/profesionales",
        prepare: (p) => p.getByText(/kinesiólogos · \d+ activos/).waitFor(),
      },
      { file: "usuarios.png", path: "/usuarios", prepare: (p) => p.getByRole("list", { name: "Usuarios" }).waitFor() },
    ];

    const browser = await chromium.launch();

    const loginPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginPage.goto(`${base}/login`);
    await loginPage.getByLabel("Email").waitFor();
    await loginPage.screenshot({ path: join(OUTPUT_DIR, "login-desktop.png") });
    console.log("OK login-desktop.png");
    await loginPage.close();

    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await login(desktopPage, base, demo.adminEmail, password);
    for (const shot of desktop) await capture(desktopPage, base, shot);

    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await login(mobilePage, base, demo.adminEmail, password);
    for (const shot of mobile) await capture(mobilePage, base, { ...shot, fullPage: false });

    await browser.close();
  } finally {
    await app.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
