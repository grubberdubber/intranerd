import { activeModal, expect, goToModule, reloadApp, test } from './fixtures.js';

test.describe('Horario semanal', () => {
  test('muestra la próxima clase en el panel general', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tu horario' })).toBeVisible();
    await expect(page.locator('.dashboard-next__subject')).toBeVisible();
    await expect(page.locator('.dashboard-next__meta')).toContainText('·');
  });

  test('agrega, edita y elimina un bloque con persistencia', async ({ page }) => {
    await goToModule(page, 'schedule');
    await expect(page.locator('.schedule-day')).toHaveCount(5);
    await expect(page.locator('.schedule-block')).toHaveCount(20);

    await page.getByRole('button', { name: 'Agregar bloque', exact: true }).click();
    let modal = activeModal(page);
    await modal.locator('#schedule-start').fill('16:00');
    await modal.locator('#schedule-end').fill('17:30');
    await modal.locator('#schedule-subject').fill('Taller E2E');
    await modal.locator('#schedule-teacher').fill('Prof. E2E');
    await modal.locator('#schedule-room').fill('Sala E2E');
    await modal.getByRole('button', { name: 'Agregar al horario' }).click();
    await expect(modal).toHaveCount(0);

    const block = page.locator('.schedule-block').filter({ hasText: 'Taller E2E' });
    await expect(block).toBeVisible();
    await expect(block).toContainText('Sala E2E');

    await reloadApp(page);
    await expect(page.locator('.schedule-block').filter({ hasText: 'Taller E2E' })).toBeVisible();

    await block.hover();
    await block.getByRole('button', { name: 'Editar Taller E2E del lunes' }).click();
    modal = activeModal(page);
    await modal.locator('#schedule-room').fill('Sala editada');
    await modal.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(modal).toHaveCount(0);
    await expect(block).toContainText('Sala editada');

    await block.hover();
    await block.getByRole('button', { name: 'Eliminar Taller E2E del lunes' }).click();
    const confirm = activeModal(page);
    await confirm.getByRole('button', { name: 'Eliminar bloque' }).click();
    await expect(page.locator('.schedule-block').filter({ hasText: 'Taller E2E' })).toHaveCount(0);
  });

  test('rechaza un bloque que se cruza con una clase existente', async ({ page }) => {
    await goToModule(page, 'schedule');
    await page.getByRole('button', { name: 'Agregar bloque', exact: true }).click();

    const modal = activeModal(page);
    await modal.locator('#schedule-start').fill('08:30');
    await modal.locator('#schedule-end').fill('09:00');
    await modal.locator('#schedule-subject').fill('Bloque cruzado');
    await modal.getByRole('button', { name: 'Agregar al horario' }).click();

    await expect(modal).toBeVisible();
    await expect(modal.locator('#schedule-start-error')).toContainText('Se cruza con');
  });
});
