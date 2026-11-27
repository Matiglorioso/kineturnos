import { expect, test } from "@playwright/test";
import { getTodayAppDate } from "../src/lib/date-utils";
import { cleanupTestData, createPatient, prisma, storageStateFor, uniqueName } from "./helpers";

test.use({ storageState: storageStateFor("admin") });
test.afterAll(cleanupTestData);

test.describe("historia clínica (Administración)", () => {
  test("acceso rápido desde la lista de pacientes; carga alertas, objetivos y una sesión", async ({ page }) => {
    const patient = await createPatient(uniqueName("Hc"));

    await page.goto("/pacientes");
    await page.getByRole("textbox", { name: "Buscar pacientes", exact: true }).fill(patient.dni);
    // Esperar a que la lista quede filtrada antes del click (si no, el enlace se re-renderiza en el medio).
    const row = page.getByRole("row").filter({ hasText: patient.nombre });
    await expect(row).toBeVisible();
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
    await row.getByRole("link", { name: "Historia clínica" }).click();

    await expect(page).toHaveURL(`/pacientes/${patient.id}/historia`);
    await expect(page.getByRole("heading", { name: patient.nombre, level: 1 })).toBeVisible();
    await expect(page.getByText("Empezá la historia clínica")).toBeVisible();

    // La historia muestra solo el paciente y su evolución: sin alertas, objetivos ni resumen.
    await expect(page.getByRole("region", { name: "Alertas y antecedentes" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Objetivos del tratamiento" })).toHaveCount(0);
    await expect(page.getByText("Sesiones registradas")).toHaveCount(0);
    await expect(page.getByText("Próximo turno")).toHaveCount(0);

    // "Nueva evolución" está en el encabezado del paciente; el panel lateral pide solo
    // fecha (hoy por defecto), profesional y evolución.
    await page.getByRole("region", { name: patient.nombre }).getByRole("button", { name: "Nueva evolución" }).click();
    const composer = page.getByRole("dialog", { name: "Nueva evolución" });
    await expect(composer.getByRole("textbox", { name: "Fecha *" })).toHaveValue(getTodayAppDate());
    await expect(composer.getByRole("textbox", { name: "Diagnóstico" })).toHaveCount(0);
    await expect(composer.getByRole("textbox", { name: "Plan de tratamiento" })).toHaveCount(0);
    await composer.getByRole("textbox", { name: "Evolución *" }).fill("Evaluación inicial.");
    // Administración no es profesional: sin turno, tiene que elegir quién atendió.
    await composer.getByRole("button", { name: "Guardar en la historia" }).click();
    await expect(composer.getByText("Elegí qué profesional atendió la sesión.")).toBeVisible();
    await composer.getByRole("combobox", { name: "Profesional *" }).click();
    const firstProfessional = page.getByRole("option").first();
    const professionalName = (await firstProfessional.textContent())?.trim() ?? "";
    await firstProfessional.click();
    await composer.getByRole("button", { name: "Guardar en la historia" }).click();
    const session = page.getByRole("article", { name: /Sesión 1/ });
    await expect(session).toContainText("Evaluación inicial.");
    await expect(session).toContainText(professionalName);

    // El registro de accesos ya no está en la historia: queda en la auditoría del Superadmin.
    await expect(page.getByRole("button", { name: "Ver accesos" })).toHaveCount(0);
  });

  test("muestra 8 evoluciones por página, de la más reciente a la más antigua", async ({ page }) => {
    const patient = await createPatient(uniqueName("Pag"));
    for (let day = 1; day <= 10; day++) {
      await prisma.historiaClinica.create({
        data: {
          id: `it-hc-${patient.id}-${day}`,
          pacienteId: patient.id,
          autorId: "u-admin",
          autorNombre: "Carolina Viera",
          fecha: new Date(Date.UTC(2026, 8, day)),
          evolucion: `Evolución del día ${day}`,
        },
      });
    }

    await page.goto(`/pacientes/${patient.id}/historia`);
    const sessions = page.getByRole("article");
    await expect(sessions).toHaveCount(8);
    await expect(sessions.first()).toContainText("Sesión 10");
    const pager = page.getByRole("navigation", { name: "Páginas de la evolución" });
    await expect(pager).toContainText("1–8 de 10");
    await expect(pager.getByRole("button", { name: "Más recientes" })).toBeDisabled();

    await pager.getByRole("button", { name: "Más antiguas" }).click();
    await expect(sessions).toHaveCount(2);
    await expect(sessions.first()).toContainText("Sesión 2");
    await expect(pager).toContainText("9–10 de 10");
  });
});
