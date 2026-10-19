import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createProfessional,
  loginViaUi,
  selectOption,
  storageStateFor,
  uniqueName,
  waitForLoginForm,
} from "./helpers";

test.use({ storageState: storageStateFor("recepcionista") });
test.afterAll(cleanupTestData);

test.describe("gestión de usuarios", () => {
  test("Administración crea el acceso de un profesional, que entra con la temporal y elige su contraseña", async ({
    page,
    browser,
  }) => {
    const professional = await createProfessional(uniqueName("Acceso"));
    const email = `it-${Date.now().toString(36)}@test.local`;

    await page.goto("/usuarios");
    await page.getByRole("button", { name: "Nuevo usuario" }).click();
    const dialog = page.getByRole("dialog", { name: "Nuevo usuario" });
    await selectOption(dialog, page, "Profesional", professional.nombre);
    // Elegir el profesional completa el nombre.
    await expect(dialog.getByLabel("Nombre")).toHaveValue(professional.nombre);
    await dialog.getByLabel("Email (para ingresar)").fill(email);
    await dialog.getByRole("button", { name: "Crear usuario" }).click();

    const credentials = page.getByRole("dialog", { name: "Usuario creado" });
    const temporaryPassword = (await credentials.getByLabel("Contraseña temporal").textContent())!.trim();
    expect(temporaryPassword).toMatch(/^Kine-/);
    await credentials.getByRole("button", { name: "Listo" }).click();

    const row = page.getByRole("row").filter({ hasText: email });
    await expect(row).toContainText("Profesional");
    await expect(row).toContainText(professional.nombre);
    await expect(row).toContainText("Contraseña temporal pendiente");

    // La persona entra en otro navegador (sin la sesión de Administración).
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const own = await context.newPage();
    await own.goto("/login");
    await waitForLoginForm(own);
    await loginViaUi(own, email, temporaryPassword);
    await expect(own).toHaveURL(/\/cambiar-contrasena$/);
    await expect(own.getByRole("heading", { name: "Elegí tu contraseña" })).toBeVisible();

    // No puede saltearse el cambio.
    await own.goto("/agenda");
    await expect(own).toHaveURL(/\/cambiar-contrasena$/);

    await own.getByLabel("Contraseña temporal").fill(temporaryPassword);
    await own.getByLabel("Nueva contraseña", { exact: true }).fill("corta");
    await own.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(own.getByText("La contraseña debe tener al menos 8 caracteres")).toBeVisible();

    await own.getByLabel("Nueva contraseña", { exact: true }).fill("MiClave2026");
    await own.getByLabel("Repetí la nueva contraseña").fill("MiClave2026");
    await own.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(own).toHaveURL("/");
    await expect(own.getByText("Profesional", { exact: true })).toBeVisible();

    await own.goto("/agenda");
    await expect(own).toHaveURL("/agenda");
    await context.close();

    await page.reload();
    await expect(page.getByRole("row").filter({ hasText: email })).not.toContainText("Contraseña temporal pendiente");
  });

  test("desactivar pide confirmación; el usuario propio no se puede desactivar", async ({ page }) => {
    await page.goto("/usuarios");
    const own = page.getByRole("row").filter({ hasText: "recepcion@kineturnos.local" });
    await expect(own).toContainText("(vos)");
    await expect(own.getByRole("button", { name: "No podés desactivar tu usuario" })).toBeDisabled();

    await page.getByLabel("Buscar usuarios").fill("profe@kineturnos.local");
    const profe = page.getByRole("row").filter({ hasText: "profe@kineturnos.local" });
    await profe.getByRole("button", { name: "Desactivar" }).click();
    await expect(page.getByRole("alertdialog", { name: "¿Desactivar el usuario?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(profe).toContainText("Activo");
  });
});
