import { expect, test } from "@playwright/test";
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
});
