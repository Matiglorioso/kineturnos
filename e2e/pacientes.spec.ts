import { expect, test } from "@playwright/test";
import { cuilCheckDigit } from "../src/lib/document-validation";
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
    await page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…").fill(tag);
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

test.describe("lista de pacientes: paginación", () => {
  test("muestra 10 por página, pasa de página y deja elegir la cantidad", async ({ page }) => {
    const tag = `Pag${Date.now().toString(36)}`;
    for (let index = 0; index < 12; index += 1) {
      await createPatient(uniqueName(tag));
    }

    await page.goto("/pacientes");
    await page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…").fill(tag);
    const rows = page.getByRole("table").getByRole("row").filter({ hasText: tag });
    const pages = page.getByRole("navigation", { name: "Páginas de pacientes" });
    await expect(pages.getByText("1–10 de 12 pacientes")).toBeVisible();
    await expect(rows).toHaveCount(10);

    await pages.getByRole("button", { name: "Página siguiente" }).click();
    await expect(pages.getByText("11–12 de 12 pacientes")).toBeVisible();
    await expect(rows).toHaveCount(2);

    await selectOption(pages, page, "Por página", "25");
    await expect(pages.getByText("1–12 de 12 pacientes")).toBeVisible();
    await expect(rows).toHaveCount(12);

    // La cantidad elegida se recuerda al volver a la lista.
    await page.reload();
    await page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…").fill(tag);
    await expect(rows).toHaveCount(12);
  });
});

test.describe("ficha del paciente: CUIL y fecha de nacimiento (RF08)", () => {
  test("se cargan al editar, se validan y se ven en la ficha", async ({ page }) => {
    const patient = await createPatient(uniqueName("Cuil"));
    const dni = patient.dni.padStart(8, "0");
    const prefix = ["20", "27", "23"].find((p) => cuilCheckDigit(p + dni) !== null)!;
    const cuil = `${prefix}-${dni}-${cuilCheckDigit(prefix + dni)}`;

    await page.goto("/pacientes");
    await page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…").fill(patient.nombre);
    await page.getByRole("row").filter({ hasText: patient.nombre }).getByRole("button", { name: "Ver detalle" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Editar paciente" }).click();

    const form = page.getByRole("dialog", { name: "Editar paciente" });
    await form.getByLabel("CUIL").fill("20-32456789-6");
    await form.getByLabel("Fecha de nacimiento").fill("31/02/1990");
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByText("El CUIL no corresponde al DNI")).toBeVisible();
    await expect(form.getByText("Ingresá la fecha con el formato dd-mm-aaaa")).toBeVisible();

    await form.getByLabel("CUIL").fill(cuil.replaceAll("-", ""));
    await form.getByLabel("Fecha de nacimiento").fill("5/3/1990");
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form).toBeHidden();

    const saved = await prisma.paciente.findUniqueOrThrow({ where: { id: patient.id } });
    expect(saved.cuil).toBe(cuil.replaceAll("-", ""));
    expect(saved.fechaNacimiento?.toISOString().slice(0, 10)).toBe("1990-03-05");

    await page.getByRole("row").filter({ hasText: patient.nombre }).getByRole("button", { name: "Ver detalle" }).click();
    const detail = page.getByRole("dialog", { name: patient.nombre });
    await expect(detail).toContainText(cuil);
    await expect(detail).toContainText(/05-03-1990 \(\d+ años\)/);
  });

  test("el buscador encuentra al paciente por CUIL, con o sin guiones", async ({ page }) => {
    const patient = await createPatient(uniqueName("BuscaCuil"));
    const dni = patient.dni.padStart(8, "0");
    const prefix = ["20", "27", "23"].find((p) => cuilCheckDigit(p + dni) !== null)!;
    const cuil = `${prefix}${dni}${cuilCheckDigit(prefix + dni)}`;
    await prisma.paciente.update({ where: { id: patient.id }, data: { cuil } });

    await page.goto("/pacientes");
    const search = page.getByPlaceholder("Buscar por nombre, DNI, CUIL, teléfono u obra social…");
    const row = page.getByRole("row").filter({ hasText: patient.nombre });

    await search.fill(`${cuil.slice(0, 2)}-${cuil.slice(2, 10)}-${cuil.slice(10)}`);
    await expect(row).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(2);

    await search.fill(cuil);
    await expect(row).toBeVisible();
  });
});
