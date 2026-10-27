import { expect, test } from './fixtures.js';

/**
 * Smoke test responsive (proyecto `mobile` de playwright.config.js).
 *
 * Valida que el menú lateral colapsable funcione y que la vista de notas no
 * genere desbordes horizontales en un viewport de teléfono.
 */
test.describe('Navegación móvil', () => {
  test('abre el menú, navega a notas y no desborda horizontalmente', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: 'Abrir menú de navegación' });
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const gradesLink = page.locator('a.nav-link[data-route="grades"]');
    await expect(gradesLink).toBeVisible();
    await gradesLink.click();

    await expect(page.locator('.view[data-route="grades"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Notas y promedios semestrales' }),
    ).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
