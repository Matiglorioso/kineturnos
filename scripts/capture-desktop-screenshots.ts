import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "https://kineturnos.vercel.app";
const OUTPUT_DIR = join(process.cwd(), "docs", "screenshots");
const VIEWPORT = { width: 1440, height: 900 };
const DEMO_EMAIL = "recepcion@kineturnos.local";
const DEMO_PASSWORD = "demo1234";

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(DEMO_EMAIL);
  await page.locator("#password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 30_000 });
}

async function waitForDashboard(page: Page) {
  await page.getByRole("heading", { name: "Resumen del día" }).waitFor();
  await page.getByText("Turnos de hoy").waitFor();
}

async function capture(page: Page, filename: string) {
  const path = join(OUTPUT_DIR, filename);
  await page.screenshot({ path, fullPage: true });
  console.log(`OK ${filename}`);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await login(page);
    await waitForDashboard(page);
    await capture(page, "dashboard-desktop.png");

    await page.goto(`${BASE_URL}/agenda`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Agenda" }).waitFor();
    await page.getByRole("button", { name: "Semana" }).click();
    await page.getByText("Vista semanal").waitFor();
    await capture(page, "agenda-semana-desktop.png");

    await page.goto(`${BASE_URL}/pacientes`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Pacientes" }).waitFor();
    await page.getByText(/registrados · \d+ activos/).waitFor();
    await capture(page, "pacientes-desktop.png");

    await page.goto(`${BASE_URL}/profesionales`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Profesionales" }).waitFor();
    await page.getByText(/kinesiólogos · \d+ activos/).waitFor();
    await capture(page, "profesionales-desktop.png");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
