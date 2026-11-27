/**
 * Capturas de pantalla para el README y la tesis (escritorio 1920 × 1080 y celular 390 px).
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
/** Monitor de escritorio (1920 × 1080), con el doble de densidad para que se lean nítidas impresas. */
const DESKTOP = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 };

interface Shot {
  file: string;
  path: string;
  /** Espera a que la pantalla esté lista (datos cargados) y la deja como se quiere mostrar. */
  prepare: (page: Page) => Promise<void>;
  fullPage?: boolean;
  /** Captura solo este elemento (p. ej. un formulario) en lugar de la página. */
  element?: (page: Page) => Locator;
  /** Alto máximo (px) del elemento: para paneles laterales que ocupan toda la pantalla y quedarían vacíos abajo. */
  maxHeight?: number;
}

async function login(page: Page, baseUrl: string, email: string, password: string) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").waitFor();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(`${baseUrl}/`);
}

/** Cambios reales por la API (con la sesión de Administración) para que la auditoría tenga movimientos. */
async function recordDemoChanges(page: Page, baseUrl: string, patientId: string) {
  const api = page.request;
  const appointments = (await (await api.get(`${baseUrl}/api/appointments`)).json()).data as {
    id: string;
    status: string;
    date: string;
  }[];
  const today = format(new Date(), "dd-MM-yyyy");
  const pending = appointments.filter((item) => item.status === "pendiente" && item.date !== today).slice(0, 2);
  for (const item of pending) {
    await api.patch(`${baseUrl}/api/appointments/${item.id}`, { data: { status: "confirmado" } });
  }

  const patient = (await (await api.get(`${baseUrl}/api/patients/${patientId}`)).json()).data;
  await api.patch(`${baseUrl}/api/patients/${patientId}`, {
    data: { ...patient, phone: "+54 351 555-0199", notes: "Prefiere turnos por la mañana." },
  });
}

async function capture(page: Page, baseUrl: string, shot: Shot) {
  await page.goto(`${baseUrl}${shot.path}`);
  await shot.prepare(page);
  // Deja terminar animaciones y la carga de fuentes.
  await page.waitForTimeout(600);
  if (shot.element) {
    const target = shot.element(page);
    const box = shot.maxHeight ? await target.boundingBox() : null;
    if (box && shot.maxHeight) {
      await page.screenshot({
        path: join(OUTPUT_DIR, shot.file),
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, shot.maxHeight) },
      });
    } else {
      await target.screenshot({ path: join(OUTPUT_DIR, shot.file) });
    }
  }
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
          const date = dialog.getByRole("textbox", { name: /^Fecha/ });
          await date.fill(format(day, "dd-MM-yyyy"));
          await date.press("Tab");
          await dialog.getByRole("combobox", { name: "Horario" }).click();
          await p.getByRole("option").filter({ hasNotText: /Ocupado/i }).last().click();
          await dialog.getByRole("combobox", { name: "Tipo de sesión" }).click();
          await p.getByRole("option", { name: "Rehabilitación" }).click();
          await dialog.getByLabel(/^Observaciones/).fill("Control de rodilla. Traer estudios.");
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
        prepare: (p) => p.getByRole("article").first().waitFor(),
      },
      {
        // Nueva evolución: el panel lateral de la historia clínica.
        file: "historia-nueva-evolucion-desktop.png",
        path: historia,
        element: (p) => p.getByRole("dialog", { name: "Nueva evolución" }),
        maxHeight: 510,
        prepare: async (p) => {
          await p.getByRole("article").first().waitFor();
          await p.getByRole("button", { name: "Nueva evolución" }).filter({ visible: true }).first().click();
          const dialog = p.getByRole("dialog", { name: "Nueva evolución" });
          const professional = dialog.getByRole("combobox", { name: "Profesional" });
          if (await professional.isVisible().catch(() => false)) {
            await professional.click();
            await p.getByRole("option").first().click();
          }
          await dialog
            .getByLabel("Evolución")
            .fill("Buena respuesta al tratamiento. Mejora el rango de flexión de rodilla; sin dolor al caminar. Se indican ejercicios para el domicilio.");
        },
      },
      {
        file: "paciente-formulario-desktop.png",
        path: "/pacientes",
        element: (p) => p.getByRole("dialog", { name: "Nuevo paciente" }),
        prepare: async (p) => {
          await p.getByRole("table").getByRole("row").nth(1).waitFor();
          await p.getByRole("button", { name: "Nuevo paciente" }).filter({ visible: true }).first().click();
          const dialog = p.getByRole("dialog", { name: "Nuevo paciente" });
          await dialog.getByLabel(/^Nombre/).fill("Luciana");
          await dialog.getByLabel(/^Apellido/).fill("Paredes");
          await dialog.getByLabel(/^DNI/).fill("38123456");
          await dialog.getByLabel(/^Fecha de nacimiento/).fill("14-03-1992");
          await dialog.getByLabel(/^Teléfono/).fill("+54 351 555-0142");
          await dialog.getByLabel(/^Email/).fill("luciana.paredes@example.com");
          await dialog.getByLabel(/^Observaciones/).fill("Derivada por traumatología.");
        },
      },
      {
        file: "paciente-ficha-desktop.png",
        path: "/pacientes",
        element: (p) => p.getByRole("dialog"),
        prepare: async (p) => {
          await p.getByRole("table").getByRole("row").nth(1).waitFor();
          // La lista está paginada: se busca al paciente para que quede a la vista.
          await p.getByLabel("Buscar pacientes").filter({ visible: true }).first().fill(demo.featuredPatientName);
          await p.getByRole("button", { name: `Ver detalle de ${demo.featuredPatientName}` }).filter({ visible: true }).first().click();
          await p.getByRole("dialog").getByRole("heading", { name: demo.featuredPatientName }).waitFor();
        },
      },
      {
        file: "profesional-formulario-desktop.png",
        path: "/profesionales",
        element: (p) => p.getByRole("dialog", { name: "Nuevo profesional" }),
        prepare: async (p) => {
          await p.getByRole("button", { name: /^Ver detalle de/ }).filter({ visible: true }).first().waitFor();
          await p.getByRole("button", { name: "Nuevo profesional" }).filter({ visible: true }).first().click();
          const dialog = p.getByRole("dialog", { name: "Nuevo profesional" });
          await dialog.getByLabel(/^Nombre/).fill("Marcos");
          await dialog.getByLabel(/^Apellido/).fill("Villalba");
          await dialog.getByLabel(/^Matrícula/).fill("MP 4821");
          await dialog.getByLabel(/^Teléfono/).fill("+54 351 555-0177");
          await dialog.getByLabel(/^Email/).fill("marcos.villalba@example.com");
          await dialog.getByRole("combobox", { name: "Especialidad" }).click();
          await p.getByRole("option").first().click();
          for (const day of ["Lunes", "Miércoles", "Viernes"]) await dialog.getByRole("button", { name: day, exact: true }).click();
        },
      },
      {
        file: "autorizaciones-desktop.png",
        path: "/obras-sociales",
        prepare: (p) => p.getByRole("group", { name: "Situación" }).waitFor(),
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
        prepare: (p) => p.getByRole("button", { name: /^Ver detalle de/ }).filter({ visible: true }).first().waitFor(),
      },
      { file: "usuarios-desktop.png", path: "/usuarios", prepare: (p) => p.getByRole("table").getByRole("row").nth(1).waitFor() },
    ];

    const mobile: Shot[] = [
      // En el celular el panel muestra lo del día (los indicadores quedan para la computadora).
      { file: "dashboard.png", path: "/", prepare: (p) => p.getByRole("region", { name: "Para hacer" }).waitFor() },
      {
        file: "agenda.png",
        path: "/agenda",
        prepare: (p) => p.getByRole("group", { name: "Vista de la agenda" }).waitFor(),
      },
      {
        file: "agenda-profesionales.png",
        path: "/agenda",
        prepare: async (p) => {
          await view(p, "Profesionales");
          await p.getByRole("tablist", { name: "Profesionales del día" }).waitFor();
        },
      },
      { file: "pacientes.png", path: "/pacientes", prepare: (p) => p.getByRole("navigation", { name: "Páginas de pacientes" }).waitFor() },
      { file: "historia-clinica.png", path: historia, prepare: (p) => p.getByRole("article").first().waitFor() },
      {
        file: "profesionales.png",
        path: "/profesionales",
        prepare: (p) => p.getByRole("button", { name: /^Ver detalle de/ }).filter({ visible: true }).first().waitFor(),
      },
      { file: "usuarios.png", path: "/usuarios", prepare: (p) => p.getByRole("list", { name: "Usuarios" }).waitFor() },
    ];

    const browser = await chromium.launch();

    const loginPage = await browser.newPage(DESKTOP);
    await loginPage.goto(`${base}/login`);
    await loginPage.getByLabel("Email").waitFor();
    await loginPage.screenshot({ path: join(OUTPUT_DIR, "login-desktop.png") });
    console.log("OK login-desktop.png");
    await loginPage.close();

    const desktopPage = await browser.newPage(DESKTOP);
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

    // Auditoría (solo Superadmin): primero Administración hace algunos cambios para que haya movimientos.
    await recordDemoChanges(desktopPage, base, demo.featuredPatientId);
    const auditPage = await browser.newPage(DESKTOP);
    await login(auditPage, base, demo.superadminEmail, password);
    await capture(auditPage, base, {
      file: "auditoria-desktop.png",
      path: "/auditoria",
      prepare: async (p) => {
        await p.getByRole("button", { name: /Modificación/ }).first().click();
        await p.getByText("Antes", { exact: true }).waitFor();
      },
    });

    await browser.close();
  } finally {
    await app.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
