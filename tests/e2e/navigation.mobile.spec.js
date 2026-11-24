import { expect, test } from './fixtures.js';

/**
 * Smoke test responsive (proyecto `mobile` de playwright.config.js).
 *
 * Valida que el menú lateral colapsable funcione y que la vista de notas no
 * genere desbordes horizontales en un viewport de teléfono.
 */
test.describe('Navegación móvil', () => {
  test('abre el menú, navega a notas y no desborda horizontalmente', async ({ page }) => {
    const menuButton = page.locator('.topbar__menu');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú de navegación');

    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(menuButton).toHaveAttribute('aria-label', 'Cerrar menú de navegación');

    // El mismo botón debe cerrar el panel superpuesto en móvil.
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú de navegación');
    await expect(page.locator('#app')).not.toHaveClass(/is-nav-open/);

    await menuButton.click();
    const gradesLink = page.locator('a.nav-link[data-route="grades"]');
    await expect(gradesLink).toBeVisible();
    await gradesLink.click();

    await expect(page.locator('.view[data-route="grades"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Notas y promedios semestrales' }),
    ).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú de navegación');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('el horario semanal se apila sin desbordes en móvil', async ({ page }) => {
    await page.locator('.topbar__menu').click();
    const scheduleLink = page.locator('a.nav-link[data-route="schedule"]');
    await expect(scheduleLink).toBeVisible();
    await scheduleLink.click();

    await expect(page.locator('.view[data-route="schedule"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Horario semanal' })).toBeVisible();
    await expect(page.locator('.schedule-day')).toHaveCount(5);

    const gridColumns = await page
      .locator('.schedule-grid')
      .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    expect(gridColumns).toBe(1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
