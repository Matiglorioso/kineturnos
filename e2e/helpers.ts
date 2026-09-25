import { expect, type Locator, type Page } from "@playwright/test";
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
  admin: { email: "admin@kineturnos.local", roleLabel: "Administración" },
  recepcion: { email: "recepcion@kineturnos.local", roleLabel: "Recepción" },
  profesional: { email: "profe@kineturnos.local", roleLabel: "Profesional" },
} as const;

export type Role = keyof typeof USERS;

/** Sesión guardada por auth.setup.ts para cada rol. */
export const storageStateFor = (role: Role) => `e2e/.auth/${role}.json`;

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

/** Lleva la agenda (vista lista) a una fecha dd-MM-yyyy. */
export async function goToAgendaDate(page: Page, date: string) {
  const dateInput = page.getByRole("textbox", { name: "Fecha de la agenda" });
  await dateInput.fill(date);
  await dateInput.press("Tab");
  await expect(page.getByText(`Turnos del`)).toContainText(date);
}
