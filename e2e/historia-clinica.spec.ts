import { expect, test } from "@playwright/test";
import { cleanupTestData, createPatient, prisma, storageStateFor, uniqueName } from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

test.describe("historia clínica (Administración)", () => {
  test("acceso rápido desde la lista de pacientes; carga alertas, objetivos y una sesión", async ({ page }) => {
    const patient = await createPatient(uniqueName("Hc"));

    await page.goto("/pacientes");
    await page.getByPlaceholder("Buscar por nombre, DNI, teléfono u obra social…").fill(patient.dni);
    await page.getByRole("link", { name: "Historia clínica" }).filter({ visible: true }).first().click();

    await expect(page).toHaveURL(`/pacientes/${patient.id}/historia`);
    await expect(page.getByRole("heading", { name: patient.nombre, level: 1 })).toBeVisible();
    await expect(page.getByText("Empezá la historia clínica")).toBeVisible();

    // Alertas: una por renglón, se muestran arriba como etiquetas.
    const profile = page.getByRole("region", { name: "Alertas y antecedentes" });
    await profile.getByRole("button", { name: "Editar" }).click();
    await profile.getByRole("textbox", { name: "Alertas clínicas (una por renglón)" }).fill(
      "Alergia al ibuprofeno\nMarcapasos"
    );
    await profile.getByRole("textbox", { name: "Antecedentes" }).fill("Hernia de disco L4-L5");
    await profile.getByRole("button", { name: "Guardar" }).click();
    const alerts = page.getByRole("list", { name: "Alertas clínicas" });
    await expect(alerts.getByRole("listitem")).toHaveText(["Alergia al ibuprofeno", "Marcapasos"]);
    await expect(profile).toContainText("Hernia de disco L4-L5");

    // Objetivos: se agregan y se marcan como cumplidos.
    const goals = page.getByRole("region", { name: "Objetivos del tratamiento" });
    await goals.getByRole("textbox", { name: "Agregar un objetivo" }).fill("Volver a correr");
    await goals.getByRole("button", { name: "Agregar" }).click();
    const goal = goals.getByRole("checkbox", { name: "Volver a correr" });
    await expect(goal).not.toBeChecked();
    await goal.check();
    await expect(goals).toContainText("1 de 1 cumplidos");

    // Nueva evolución en el panel lateral.
    await page.getByRole("button", { name: "Nueva evolución" }).first().click();
    const composer = page.getByRole("dialog", { name: "Nueva evolución" });
    await composer.getByRole("textbox", { name: "Evolución de la sesión *" }).fill("Evaluación inicial.");
    await composer.getByRole("button", { name: "Guardar en la historia" }).click();
    await expect(page.getByRole("article", { name: /Sesión 1/ })).toContainText("Evaluación inicial.");

    // Trazabilidad visible para Administración.
    await page.getByRole("button", { name: "Ver accesos" }).click();
    await expect(page.getByText("Registró una sesión").first()).toBeVisible();
  });

  test("muestra 3 evoluciones por página, de la más reciente a la más antigua", async ({ page }) => {
    const patient = await createPatient(uniqueName("Pag"));
    for (let day = 1; day <= 4; day++) {
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
    await expect(sessions).toHaveCount(3);
    await expect(sessions.first()).toContainText("Sesión 4");
    const pager = page.getByRole("navigation", { name: "Páginas de la evolución" });
    await expect(pager).toContainText("1–3 de 4");
    await expect(pager.getByRole("button", { name: "Más recientes" })).toBeDisabled();

    await pager.getByRole("button", { name: "Más antiguas" }).click();
    await expect(sessions).toHaveCount(1);
    await expect(sessions.first()).toContainText("Sesión 1");
    await expect(pager).toContainText("4–4 de 4");
  });
});
