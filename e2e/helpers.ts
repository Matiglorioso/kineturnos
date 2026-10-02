import { expect, type Locator, type Page } from "@playwright/test";
import { dayAriaLabel, getCalendarMonth } from "../src/lib/agenda-calendar";
import { uniqueDigits } from "../tests/integration/helpers";

// Fixtures de base compartidos con los tests de integración (ids con prefijo `it-`).
export {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  createUser,
  futureWorkday,
  prisma,
  SEED_PASSWORD,
  uniqueDigits,
} from "../tests/integration/helpers";

export const USERS = {
  superadmin: { email: "superadmin@kineturnos.local", roleLabel: "Superadmin" },
  admin: { email: "admin@kineturnos.local", roleLabel: "Administración" },
  // La recepcionista tiene perfil Administrador (como en la tesis).
  recepcionista: { email: "recepcion@kineturnos.local", roleLabel: "Administración" },
  profesional: { email: "profe@kineturnos.local", roleLabel: "Profesional" },
} as const;

export type Role = keyof typeof USERS;

/** Sesión guardada por auth.setup.ts para cada rol. */
export const storageStateFor = (role: Role) => `e2e/.auth/${role}.json`;

/**
 * Espera a que el formulario de login esté hidratado. Antes de eso, un click en
 * "Ingresar" hace un submit nativo (GET /login?) en vez del login: pasa en CI
 * cuando next dev compila la página en frío. El form enfoca el email al montar.
 */
export async function waitForLoginForm(page: Page) {
  await expect(page.getByLabel("Email")).toBeFocused({ timeout: 60_000 });
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/** Nombre único y legible para no chocar con el seed ni con otros tests. */
export function uniqueName(prefix: string): { nombrePila: string; apellido: string; nombre: string } {
  const apellido = `${prefix}${uniqueDigits(5)}`;
  return { nombrePila: "E2E", apellido, nombre: `E2E ${apellido}` };
}

/** Elige una opción de un Select (Radix) identificado por su label. */
export async function selectOption(scope: Page | Locator, page: Page, label: string, option: string | RegExp) {
  await scope.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}

/** Lleva la agenda (vista lista) a una fecha dd-MM-yyyy, eligiéndola en "Ver calendario". */
export async function goToAgendaDate(page: Page, date: string) {
  await page.getByRole("button", { name: "Ver calendario" }).click();
  const dialog = page.getByRole("dialog", { name: "Elegir fecha" });
  const grid = dialog.getByRole("grid");
  const target = getCalendarMonth(date);

  for (let step = 0; step < 36; step += 1) {
    const shown = parseCalendarMonthLabel((await grid.getAttribute("aria-label")) ?? "");
    const diff = target.year * 12 + target.month - (shown.year * 12 + shown.month);
    if (diff === 0) break;
    await dialog.getByRole("button", { name: diff > 0 ? "Mes siguiente" : "Mes anterior" }).click();
  }

  const label = dayAriaLabel(date, 0).replace(", sin turnos", "");
  await dialog.getByRole("button", { name: new RegExp(`^${label},`) }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`Turnos del`)).toContainText(date);
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "Octubre 2026" → { year: 2026, month: 9 } */
function parseCalendarMonthLabel(label: string): { year: number; month: number } {
  const [name, year] = label.toLowerCase().split(" ");
  return { year: Number(year), month: MONTHS.indexOf(name) };
}
