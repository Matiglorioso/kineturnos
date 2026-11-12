import { expect, test } from "@playwright/test";
import { addDays, startOfMonth, subMonths } from "date-fns";
import { getNextWorkday } from "../src/lib/dashboard-today";
import { getTodayAppDate, parseAppDate, toAppDate } from "../src/lib/date-utils";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  storageStateFor,
  uniqueName,
} from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

const today = () => parseAppDate(getTodayAppDate())!;

test.describe("panel del consultorio", () => {
  test("atajos con datos a la agenda, las autorizaciones y la planilla; un solo Agendar turno", async ({ page }) => {
    await page.goto("/");
    // "Agendar turno" está una sola vez: en la barra superior.
    await expect(page.getByRole("link", { name: "Agendar turno" })).toHaveCount(1);
    await page.getByRole("banner").getByRole("link", { name: "Agendar turno" }).click();
    await expect(page.getByRole("dialog", { name: "Agendar turno" })).toBeVisible();
    await expect(page).toHaveURL("/agenda");

    await page.goto("/");
    const shortcuts = page.getByRole("navigation", { name: "Atajos" });
    await expect(shortcuts.getByRole("link", { name: /Agenda de hoy.*turnos?/ })).toBeVisible();
    await expect(shortcuts.getByRole("link", { name: /^Autorizaciones/ })).toBeVisible();

    await shortcuts.getByRole("link", { name: /^Planilla de / }).click();
    await expect(page).toHaveURL("/obras-sociales");
    await expect(page.getByRole("tab", { name: /Planilla/ })).toHaveAttribute("aria-selected", "true");
  });

  test("Para hacer: registra la asistencia y confirma turnos sin salir del panel", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Hacer"));
    const attended = await createPatient(uniqueName("Vino"));
    const toConfirm = await createPatient(uniqueName("Confirma"));
    let yesterday = addDays(today(), -1);
    if (yesterday.getDay() === 0) yesterday = addDays(yesterday, -1);
    await createAppointmentInDb({
      patient: attended,
      professional,
      date: toAppDate(yesterday),
      time: "09:00",
      status: "confirmado",
    });
    await createAppointmentInDb({
      patient: toConfirm,
      professional,
      date: getNextWorkday(getTodayAppDate()),
      time: "10:00",
    });

    await page.goto("/");
    const todo = page.getByRole("region", { name: "Para hacer" });
    await todo.getByRole("button", { name: `Marcar atendido: ${attended.nombre}` }).click();
    await expect(todo.getByText(attended.nombre)).toHaveCount(0);

    await todo.getByRole("button", { name: `Confirmar turno: ${toConfirm.nombre}` }).click();
    await expect(todo.getByText(toConfirm.nombre)).toHaveCount(0);
  });

  test("indicadores (RF16): turnos por profesional del mes anterior", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Ind"));
    const patient = await createPatient(uniqueName("Ind"));
    const lastMonth = startOfMonth(subMonths(today(), 1));
    const day = (offset: number) => toAppDate(addDays(lastMonth, offset));
    await createAppointmentInDb({ patient, professional, date: day(1), time: "09:00", status: "atendido" });
    await createAppointmentInDb({ patient, professional, date: day(2), time: "09:00", status: "atendido" });
    await createAppointmentInDb({ patient, professional, date: day(3), time: "09:00", status: "ausente" });
    await createAppointmentInDb({ patient, professional, date: day(4), time: "09:00", status: "cancelado" });

    await page.goto("/");
    const section = page.getByRole("region", { name: "Indicadores" });
    await expect(section.getByRole("tab", { name: "Este mes" })).toHaveAttribute("aria-selected", "true");
    await section.getByRole("tab", { name: "Mes anterior" }).click();

    const row = section.getByRole("listitem").filter({ hasText: professional.nombre });
    await expect(row).toContainText("4 turnos · ausentismo 33%");
    await expect(row.getByRole("img")).toHaveAccessibleName("2 atendidos, 1 ausentes, 1 cancelados, 0 pendientes");
  });
});
