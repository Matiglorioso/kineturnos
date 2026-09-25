import { defineConfig, devices } from "@playwright/test";

/**
 * Tests E2E (npm run test:e2e). Levantan `npm run dev` contra la base de
 * DATABASE_URL, que tiene que estar migrada y sembrada con `db:seed`
 * (usuarios demo). Nunca contra producción: crean y borran datos `it-…`.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Comparten la base: de a un test por vez.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      dependencies: ["setup"],
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${baseURL}/api/health/db`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
