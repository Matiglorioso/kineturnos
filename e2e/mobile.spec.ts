import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createAppointmentInDb,
  createPatient,
  createProfessional,
  futureWorkday,
  goToAgendaDate,
  storageStateFor,
  uniqueName,
} from "./helpers";

// Corre en el proyecto "mobile" (390 × 844).
test.use({ storageState: storageStateFor("recepcion") });
test.afterAll(cleanupTestData);

test.describe("mobile (390 px)", () => {
  test("la agenda muestra tarjetas en lugar de tabla", async ({ page }) => {
    const professional = await createProfessional(uniqueName("Prof"));
    const patient = await createPatient(uniqueName("Pac"));
    const date = futureWorkday(23);
    await createAppointmentInDb({ patient, professional, date, time: "10:00" });

    await page.goto("/agenda");
    await goToAgendaDate(page, date);

    await expect(page.getByRole("table")).toBeHidden();
    // La tabla sigue en el DOM (oculta): se busca el texto visible, el de la tarjeta.
    const card = page.getByText(patient.nombre).filter({ visible: true });
    await expect(card).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Acciones/ }).filter({ visible: true })
    ).toBeVisible();
  });

  test("el menú lateral está colapsado y se abre con el botón", async ({ page }) => {
    await page.goto("/");
    const agendaLink = page.getByRole("link", { name: "Agenda", exact: true });
    await expect(agendaLink).toBeHidden();

    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(agendaLink).toBeVisible();

    await agendaLink.click();
    await expect(page).toHaveURL("/agenda");
    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  });
});
