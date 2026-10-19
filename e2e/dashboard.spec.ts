import { expect, test } from "@playwright/test";
import { addDays, startOfMonth, subMonths } from "date-fns";
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

test.describe("indicadores del panel (RF16)", () => {
  test("muestra los turnos de cada profesional y cambia de período", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Ind"));
    const patient = await createPatient(uniqueName("Ind"));
    // Turnos del mes anterior (días 2 a 5, que siempre existen).
    const lastMonth = startOfMonth(subMonths(parseAppDate(getTodayAppDate())!, 1));
    const day = (offset: number) => toAppDate(addDays(lastMonth, offset));
    await createAppointmentInDb({ patient, professional, date: day(1), time: "09:00", status: "atendido" });
    await createAppointmentInDb({ patient, professional, date: day(2), time: "09:00", status: "atendido" });
    await createAppointmentInDb({ patient, professional, date: day(3), time: "09:00", status: "ausente" });
    await createAppointmentInDb({ patient, professional, date: day(4), time: "09:00", status: "cancelado" });

    await page.goto("/");
    const section = page.getByRole("region", { name: "Indicadores" });
    await expect(section).toBeVisible();
    await expect(section.getByRole("tab", { name: "Este mes" })).toHaveAttribute("aria-selected", "true");

    await section.getByRole("tab", { name: "Mes anterior" }).click();
    const row = section.getByRole("listitem").filter({ hasText: professional.nombre });
    await expect(row).toContainText("4 turnos");
    await expect(row).toContainText("2 atendidos · 1 ausentes · 1 cancelados · 0 pendientes · Ausentismo 33%");

    await expect(section.getByText("Autorizaciones para gestionar")).toBeVisible();
  });
});
