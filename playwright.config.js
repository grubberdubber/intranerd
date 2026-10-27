import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E de IntraNerd.
 *
 * Por defecto sirve la SPA estática en el puerto 8080 (modo localStorage, sin
 * backend) y usa Chromium. Se puede apuntar a otro origen/start command:
 *
 *   E2E_BASE_URL=http://localhost:5173 npm run test:e2e
 *   E2E_START_COMMAND="npm run dev" npm run test:e2e
 *
 * Si la SPA no está construida todavía, las specs se marcan como skipped con
 * un mensaje claro (ver tests/e2e/fixtures.js) en lugar de fallar en cadena.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8080';
const startCommand =
  process.env.E2E_START_COMMAND ?? 'python3 -m http.server 8080 --bind 127.0.0.1';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL,
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Las specs `*.mobile.spec.js` se ejecutan solo en el proyecto móvil.
      testIgnore: /.*\.mobile\.spec\.js/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // Los flujos críticos deben funcionar también en móvil; se ejecuta en CI
      // con un worker para mantener el tiempo total bajo control.
      testMatch: /.*\.mobile\.spec\.js/,
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: startCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
