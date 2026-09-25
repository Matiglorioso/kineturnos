import { expect, test } from "@playwright/test";
import {
  createUser,
  loginViaUi,
  SEED_PASSWORD,
  USERS,
  waitForLoginForm,
  type Role,
} from "./helpers";

// Sin sesión guardada: cada test hace su propio login.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login", () => {
  for (const role of Object.keys(USERS) as Role[]) {
    test(`${role} ingresa y llega al dashboard`, async ({ page }) => {
      await page.goto("/login");
      await waitForLoginForm(page);
      await loginViaUi(page, USERS[role].email, SEED_PASSWORD);

      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "Resumen del día" })).toBeVisible();
      await expect(page.getByText(USERS[role].roleLabel, { exact: true })).toBeVisible();
    });
  }

  test("una ruta protegida manda al login y después vuelve a esa ruta", async ({ page }) => {
    await page.goto("/pacientes");
    await expect(page).toHaveURL(/\/login\?.*callbackUrl=%2Fpacientes/);
    await waitForLoginForm(page);

    await loginViaUi(page, USERS.recepcionista.email, SEED_PASSWORD);
    await expect(page).toHaveURL("/pacientes");
  });

  test("con callbackUrl externo queda dentro de la app (A4)", async ({ page }) => {
    await page.goto("/login?callbackUrl=https://example.com");
    await waitForLoginForm(page);
    await loginViaUi(page, USERS.recepcionista.email, SEED_PASSWORD);

    await expect(page).toHaveURL("/");
    expect(new URL(page.url()).host).not.toBe("example.com");
  });

  test("con contraseña incorrecta muestra el error y no entra", async ({ page }) => {
    const user = await createUser({ rol: "admin" });
    await page.goto("/login");
    await waitForLoginForm(page);
    await loginViaUi(page, user.email, "incorrecta-123");

    await expect(page.getByText("Email o contraseña incorrectos").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("después de 5 intentos fallidos bloquea el login (rate limit)", async ({ page }) => {
    const user = await createUser({ rol: "admin" });
    await page.goto("/login");
    await waitForLoginForm(page);

    for (let attempt = 1; attempt <= 5; attempt++) {
      await loginViaUi(page, user.email, `incorrecta-${attempt}`);
      await expect(page.getByText("Email o contraseña incorrectos").first()).toBeVisible();
    }

    // Ni siquiera la contraseña correcta entra mientras dure el bloqueo.
    await loginViaUi(page, user.email, SEED_PASSWORD);
    await expect(page.getByText("Demasiados intentos fallidos").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
