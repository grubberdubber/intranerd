import { test, expect, activeModal, goToModule, reloadApp } from './fixtures.js';

test.describe('Menú semanal y barra lateral', () => {
  test('consulta el menú, publica una sugerencia y la conserva', async ({ page }) => {
    await goToModule(page, 'menu');
    await expect(page.getByRole('heading', { name: 'Menú semanal' })).toBeVisible();
    await expect(page.locator('.menu-day')).toHaveCount(5);
    await expect(page.locator('.menu-rotation__title')).not.toHaveText('Menú de la semana');

    await page.locator('.menu-day').first().getByRole('button').click();
    const modal = activeModal(page);
    await expect(modal.locator('.menu-modal__summary')).toBeVisible();
    await expect(modal.locator('.menu-comment')).toHaveCount(1);

    await modal.locator('#menu-comment-type').selectOption('sugerencia');
    await modal.locator('#menu-comment-body').fill('Sugiero agregar una fruta extra los viernes.');
    await modal.getByRole('button', { name: 'Publicar' }).click();

    await expect(modal.locator('.menu-comment')).toHaveCount(2);
    await expect(modal.locator('.menu-comment').first()).toContainText('fruta extra');
    await modal.getByRole('button', { name: 'Cerrar', exact: true }).click();

    await expect(page.locator('.menu-day').first().locator('.menu-day__count')).toHaveText(
      '2 comentarios',
    );

    await reloadApp(page);
    await expect(page.locator('.menu-day').first().locator('.menu-day__count')).toHaveText(
      '2 comentarios',
    );
  });

  test('cambia de semana y pliega la barra lateral en escritorio', async ({ page }) => {
    await goToModule(page, 'menu');
    const firstDish = await page.locator('.menu-day__dish').first().innerText();

    await page.getByRole('button', { name: 'Ver la semana siguiente' }).click();
    await expect(page.locator('.menu-day__dish').first()).not.toHaveText(firstDish);
    await page.getByRole('button', { name: 'Esta semana' }).click();
    await expect(page.locator('.menu-day__dish').first()).toHaveText(firstDish);

    const menuButton = page.locator('.topbar__menu');
    await expect(menuButton).toHaveAttribute('aria-label', 'Ocultar menú lateral');
    await menuButton.click();
    await expect(page.locator('#app')).toHaveClass(/is-sidebar-collapsed/);
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-label', 'Mostrar menú lateral');
    await expect(page.locator('.sidebar')).toBeHidden();

    // El contenido debe ocupar todo el ancho, no la columna de 0 px del sidebar.
    const pageBox = await page.locator('.page').boundingBox();
    expect(pageBox.width).toBeGreaterThan(1000);
    expect(pageBox.x).toBeLessThan(5);

    await menuButton.click();
    await expect(page.locator('#app')).not.toHaveClass(/is-sidebar-collapsed/);
    await expect(page.locator('.sidebar')).toBeVisible();
  });
});
