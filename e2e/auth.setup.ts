import { expect, test as setup } from "@playwright/test";
import { loginViaUi, SEED_PASSWORD, storageStateFor, USERS, type Role } from "./helpers";

// Login real por la UI de cada rol; los demás tests reutilizan la sesión.
// Margen amplio: en CI el primer login compila las páginas en frío (next dev).
const COLD_START_TIMEOUT = 60_000;

for (const role of Object.keys(USERS) as Role[]) {
  setup(`sesión de ${role}`, async ({ page }) => {
    await page.goto("/login", { timeout: COLD_START_TIMEOUT });
    await loginViaUi(page, USERS[role].email, SEED_PASSWORD);
    await expect(page).toHaveURL("/", { timeout: COLD_START_TIMEOUT });
    await expect(page.getByText(USERS[role].roleLabel, { exact: true })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });
    await page.context().storageState({ path: storageStateFor(role) });
  });
}
