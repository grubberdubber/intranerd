import { test as base, expect } from '@playwright/test';

/**
 * Fixtures compartidos por las pruebas E2E de IntraNerd.
 *
 * - Fuerza el modo localStorage (desactiva la API) para que los flujos sean
 *   deterministas y no dependan de un backend levantado. La integración con la
 *   API se cubre en `tests/integration`; aquí se prueba la SPA real.
 * - Limpia `localStorage` una sola vez por contexto (no en cada recarga) para
 *   que las pruebas puedan verificar la persistencia tras `page.reload()`.
 * - Espera a que la aplicación marque `#app[data-ready="true"]`. Si el arranque
 *   falla, la prueba se marca como omitida con un mensaje accionable en lugar
 *   de fallar en cascada.
 *
 * Variables de entorno:
 *   E2E_USE_API=1  Usa la API real (por ejemplo, contra docker compose).
 */

const READY_SELECTOR = '#app[data-ready="true"]';
const READY_TIMEOUT = 15_000;

const NOT_READY_MESSAGE = [
  'La SPA no marcó #app[data-ready="true"].',
  'Verifica que `npm run dev` (o el servidor configurado en playwright.config.js)',
  'esté sirviendo index.html y que la consola del navegador no muestre errores de arranque.',
].join(' ');

/**
 * Prepara cada página: configuración de runtime, limpieza única de datos y
 * espera de disponibilidad de la aplicación.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
export async function prepareApp(page, testInfo) {
  const useApi = process.env.E2E_USE_API === '1';

  await page.addInitScript(
    ({ useApi }) => {
      if (!useApi) {
        // `src/config.js` lee esta configuración al importarse.
        window.INTRANERD_CONFIG = {
          api: { enabled: false },
          ui: { toastDuration: 1200 },
        };
      }

      try {
        if (!window.sessionStorage.getItem('intranerd.e2e.cleaned')) {
          window.localStorage.clear();
          window.sessionStorage.setItem('intranerd.e2e.cleaned', '1');
        }
      } catch {
        // Si el navegador bloquea el almacenamiento, la app usa su fallback en memoria.
      }
    },
    { useApi },
  );

  await page.goto('/');

  let ready = false;
  try {
    await page.waitForSelector(READY_SELECTOR, { timeout: READY_TIMEOUT });
    ready = true;
  } catch {
    ready = false;
  }

  testInfo.skip(
    !ready && (!process.env.CI || process.env.E2E_SKIP_IF_UNAVAILABLE === '1'),
    `${NOT_READY_MESSAGE} URL actual: ${page.url()}`,
  );

  if (!ready) {
    // En CI un arranque roto debe fallar, no producir un verde falso.
    throw new Error(`${NOT_READY_MESSAGE} URL actual: ${page.url()}`);
  }

  // Espera a que el router monte la primera vista y desaparezcan los skeletons.
  await expect(page.locator('.view')).toBeVisible({ timeout: READY_TIMEOUT });
}

/**
 * Navega usando la barra lateral. Es la misma interacción que usa una persona,
 * así que también valida que los enlaces del menú apunten a rutas válidas.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} routeId identificador usado en `data-route` (grades, lostfound, calendar…)
 */
export async function goToModule(page, routeId) {
  const link = page.locator(`a.nav-link[data-route="${routeId}"]`);
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.locator(`.view[data-route="${routeId}"]`)).toBeVisible();
}

/**
 * Espera a que el modal activo esté visible y devuelve su locator.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {import('@playwright/test').Locator}
 */
export function activeModal(page) {
  return page.locator('.modal[role="dialog"]').last();
}

/**
 * Recarga la página conservando el hash y espera a que la SPA vuelva a estar
 * lista. Útil para comprobar la persistencia en localStorage.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function reloadApp(page) {
  await page.reload();
  await page.waitForSelector(READY_SELECTOR, { timeout: READY_TIMEOUT });
  await expect(page.locator('.view')).toBeVisible({ timeout: READY_TIMEOUT });
}

export const test = base.extend({
  /**
   * Fixture automático: garantiza que cada prueba arranca con la app lista y
   * con un localStorage limpio, sin repetir el código en cada spec.
   */
  appReady: [
    async ({ page }, use, testInfo) => {
      await prepareApp(page, testInfo);
      await use(true);
    },
    { auto: true },
  ],
});

export { expect };
