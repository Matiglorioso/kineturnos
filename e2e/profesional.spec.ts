import { expect, test } from "@playwright/test";
import { addDays } from "date-fns";
import { getTodayAppDate, parseAppDate, toAppDate } from "../src/lib/date-utils";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  goToAgendaDate,
  prisma,
  storageStateFor,
  uniqueName,
} from "./helpers";

test.use({ storageState: storageStateFor("profesional") });
test.afterAll(cleanupTestData);

test.describe("rol profesional", () => {
  test("no ve Profesionales en el menú ni puede entrar a esa página", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("complementary");
    await expect(nav.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Profesionales" })).toHaveCount(0);

    await page.goto("/profesionales");
    await expect(page).toHaveURL("/");
  });

  test("en la agenda solo ve sus propios turnos", async ({ page }) => {
    const user = await prisma.usuario.findUniqueOrThrow({ where: { id: "u-profe" } });
    const own = await prisma.profesional.findUniqueOrThrow({
      where: { id: user.profesionalId! },
    });
    const other = await createProfessional(uniqueName("Otro"));
    const ownPatient = await createPatient(uniqueName("Propio"));
    const otherPatient = await createPatient(uniqueName("Ajeno"));
    const date = futureWorkday(22);
    // Turnos cargados directo en la base: la agenda los lista sin importar los días de atención.
    await createAppointmentInDb({ patient: ownPatient, professional: own, date, time: "09:00" });
    await createAppointmentInDb({ patient: otherPatient, professional: other, date, time: "09:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);

    await expect(page.getByRole("row").filter({ hasText: ownPatient.nombre })).toBeVisible();
    await expect(page.getByText(otherPatient.nombre)).toHaveCount(0);
  });

  test("desde la agenda abre la historia clínica y registra la sesión del turno (RF11/RF12)", async ({ page }) => {
    const user = await prisma.usuario.findUniqueOrThrow({ where: { id: "u-profe" } });
    const own = await prisma.profesional.findUniqueOrThrow({
      where: { id: user.profesionalId! },
    });
    const patient = await createPatient(uniqueName("Hc"));
    const date = recentWorkdayBefore();
    const turno = await createAppointmentInDb({
      patient,
      professional: own,
      date,
      time: "10:00",
      status: "atendido",
    });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await row.getByRole("button", { name: "Acciones del turno" }).click();
    await page.getByRole("menuitem", { name: "Historia clínica" }).click();

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/pacientes/${patient.id}/historia` &&
        url.searchParams.get("turno") === turno.id
    );
    await expect(
      page.getByRole("heading", { name: `Historia clínica · ${patient.nombre}` })
    ).toBeVisible();
    await expect(page.getByText("Sin registros todavía")).toBeVisible();

    await page.getByRole("textbox", { name: "Evolución de la sesión *" }).fill("Buena tolerancia al ejercicio.");
    await page.getByRole("textbox", { name: "Diagnóstico (si se carga o cambia)" }).fill("Tendinitis rotuliana");
    await page.getByRole("button", { name: "Guardar en la historia" }).click();

    await expect(page.getByText("Sesión registrada")).toBeVisible();
    const entry = page.getByRole("article");
    await expect(entry).toContainText("Buena tolerancia al ejercicio.");
    await expect(entry).toContainText("Sesión de un turno");
    await expect(entry.getByRole("button", { name: "Corregir" })).toBeVisible();
    await expect(page.getByText("Diagnóstico vigente")).toBeVisible();
    await expect(page.getByText("Tendinitis rotuliana").first()).toBeVisible();
    // El registro de accesos es solo para Administración.
    await expect(page.getByRole("heading", { name: "Registro de accesos" })).toHaveCount(0);
  });
});

/** Día hábil anterior a hoy (dd-MM-yyyy), para un turno ya atendido. */
function recentWorkdayBefore(): string {
  let date = addDays(parseAppDate(getTodayAppDate())!, -1);
  if (date.getDay() === 0) date = addDays(date, -1);
  return toAppDate(date);
}
