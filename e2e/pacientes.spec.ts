import { expect, test } from "@playwright/test";
import { cleanupTestData, createPatient, prisma, selectOption, storageStateFor, uniqueName } from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

test.describe("lista de pacientes: orden y filtro por obra social", () => {
  test("filtra por obra social y ordena por DNI", async ({ page }) => {
    const tag = `E2E${Date.now().toString(36)}`;
    const insurance = `Obra ${tag}`;
    const low = await createPatient(uniqueName(`${tag}A`));
    const high = await createPatient(uniqueName(`${tag}B`));
    const other = await createPatient(uniqueName(`${tag}C`));
    // DNI de 9 dígitos que empiezan con 1 y con 9: el orden entre ellos es seguro.
    await prisma.paciente.update({
      where: { id: low.id },
      data: { obraSocial: insurance, dni: `1${low.dni}`, dniNormalizado: `1${low.dni}` },
    });
    await prisma.paciente.update({
      where: { id: high.id },
      data: { obraSocial: insurance, dni: `9${high.dni}`, dniNormalizado: `9${high.dni}` },
    });

    await page.goto("/pacientes");
    await page.getByPlaceholder("Buscar por nombre, DNI, teléfono u obra social…").fill(tag);
    const table = page.getByRole("table");
    await expect(table.getByRole("row").filter({ hasText: other.nombre })).toBeVisible();

    const controls = page.getByRole("group", { name: "Orden y filtros de pacientes" });
    await selectOption(controls, page, "Obra social", insurance);
    await expect(table.getByRole("row").filter({ hasText: other.nombre })).toHaveCount(0);

    const rows = table.getByRole("row").filter({ hasText: tag });
    await selectOption(controls, page, "Ordenar por", "DNI (mayor a menor)");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText(high.nombre);

    await selectOption(controls, page, "Ordenar por", "DNI (menor a mayor)");
    await expect(rows.first()).toContainText(low.nombre);

    await controls.getByRole("button", { name: "Quitar filtro de obra social" }).click();
    await expect(table.getByRole("row").filter({ hasText: other.nombre })).toBeVisible();
  });
});
