import { expect, test as setup } from "@playwright/test";
import { loginViaUi, SEED_PASSWORD, storageStateFor, USERS, type Role } from "./helpers";

// Login real por la UI de cada rol; los demás tests reutilizan la sesión.
for (const role of Object.keys(USERS) as Role[]) {
  setup(`sesión de ${role}`, async ({ page }) => {
    await page.goto("/login");
    await loginViaUi(page, USERS[role].email, SEED_PASSWORD);
    await expect(page).toHaveURL("/");
    await expect(page.getByText(USERS[role].roleLabel, { exact: true })).toBeVisible();
    await page.context().storageState({ path: storageStateFor(role) });
  });
}
