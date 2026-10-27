import { activeModal, expect, goToModule, reloadApp, test } from './fixtures.js';

/**
 * Flujo E2E #3 — Objetos perdidos y encontrados.
 *
 * Publica un aviso de objeto perdido, lo marca como resuelto, comprueba la
 * persistencia y finalmente lo elimina con la confirmación de la interfaz.
 */
test.describe('Objetos perdidos y encontrados', () => {
  test('publica un aviso, lo resuelve y lo elimina', async ({ page }) => {
    const description = 'Mochila E2E con cinta reflectante y candado naranja';

    await goToModule(page, 'lostfound');
    await expect(
      page.getByRole('heading', { name: 'Objetos perdidos y encontrados' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Publicar perdido' }).click();

    const modal = activeModal(page);
    await expect(
      modal.getByRole('heading', { name: 'Publicar aviso de objeto perdido' }),
    ).toBeVisible();

    await modal.locator('#item-by').fill('Estudiante E2E');
    await modal.locator('#item-contact').fill('e2e@colegio.cl');
    await modal.locator('#item-category').selectOption('tecnologia');
    await modal.locator('#item-desc').fill(description);
    await modal.locator('#item-place').fill('Laboratorio E2E');
    await modal.getByRole('button', { name: 'Publicar aviso' }).click();

    await expect(modal).toHaveCount(0);

    const card = page.locator('#lost-list .item-card').filter({ hasText: description });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Estudiante E2E');
    await expect(card).toContainText('Laboratorio E2E');

    // Marcar como resuelto: aparece el badge y el botón cambia a "Reabrir".
    await card.getByRole('button', { name: 'Resuelto', exact: true }).click();
    await expect(card.locator('.badge--success')).toHaveText('Resuelto');
    await expect(card.getByRole('button', { name: 'Reabrir' })).toBeVisible();

    // Persistencia: al recargar, el aviso sigue resuelto.
    await reloadApp(page);
    const persisted = page.locator('#lost-list .item-card').filter({ hasText: description });
    await expect(persisted).toBeVisible();
    await expect(persisted.locator('.badge--success')).toHaveText('Resuelto');
    await expect(persisted.getByRole('button', { name: 'Reabrir' })).toBeVisible();

    // Eliminar con confirmación explícita.
    await persisted.getByRole('button', { name: 'Eliminar publicación' }).click();

    const confirm = activeModal(page);
    await expect(confirm.getByRole('heading', { name: 'Eliminar publicación' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Eliminar', exact: true }).click();

    await expect(
      page.locator('#lost-list .item-card').filter({ hasText: description }),
    ).toHaveCount(0);

    // Persistencia del borrado.
    await reloadApp(page);
    await expect(
      page.locator('#lost-list .item-card').filter({ hasText: description }),
    ).toHaveCount(0);
  });
});
