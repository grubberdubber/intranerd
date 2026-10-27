import { activeModal, expect, goToModule, reloadApp, test } from './fixtures.js';

/**
 * Flujo E2E #1 — Notas semestrales.
 *
 * Cubre el recorrido completo pedido: crear una asignatura, registrar notas en
 * ambos semestres, verificar promedios y estado de aprobación, recalcular el
 * promedio general y comprobar que todo persiste tras recargar el navegador.
 */
test.describe('Notas y promedios', () => {
  test('crea una asignatura, calcula promedios y conserva el resultado', async ({ page }) => {
    await goToModule(page, 'grades');
    await expect(
      page.getByRole('heading', { name: 'Notas y promedios semestrales' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Nueva asignatura' }).click();

    const modal = activeModal(page);
    await expect(modal.getByRole('heading', { name: 'Nueva asignatura' })).toBeVisible();

    await modal.locator('#new-subject-name').fill('Física E2E');
    await modal.locator('#new-subject-s1').fill('6.5, 5.5');
    await modal.locator('#new-subject-s2').fill('4.0');
    await modal.getByRole('button', { name: 'Crear asignatura' }).click();

    await expect(modal).toHaveCount(0);

    const subject = page.locator('.subject-card').filter({ hasText: 'Física E2E' });
    await expect(subject).toBeVisible();

    // Promedios por semestre: (6.5 + 5.5) / 2 = 6.0 y 4.0.
    await expect(subject.locator('.semester').nth(0).locator('.semester__average')).toHaveText(
      '6.0',
    );
    await expect(subject.locator('.semester').nth(1).locator('.semester__average')).toHaveText(
      '4.0',
    );

    // Promedio final: (6.0 + 4.0) / 2 = 5.0 → aprobado (escala 1.0–7.0, corte 4.0).
    await expect(subject.locator('.subject-card__final-value')).toHaveText('5.0');
    await expect(subject.locator('.subject-card__status')).toContainText('Aprobado');

    // El promedio general debe coincidir con la media de los promedios finales
    // visibles, sin depender de los datos demo que traiga la aplicación.
    const finals = (await page.locator('.subject-card__final-value').allTextContents())
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));
    const expectedGeneral = (
      finals.reduce((total, value) => total + value, 0) / finals.length
    ).toFixed(1);
    await expect(
      page.locator('.grades-summary .stat-card').first().locator('.stat-card__value'),
    ).toHaveText(expectedGeneral);

    // Persistencia real en localStorage: recargar conserva la asignatura.
    await reloadApp(page);
    const persisted = page.locator('.subject-card').filter({ hasText: 'Física E2E' });
    await expect(persisted).toBeVisible();
    await expect(persisted.locator('.subject-card__final-value')).toHaveText('5.0');
    await expect(persisted.locator('.subject-card__status')).toContainText('Aprobado');
  });

  test('rechaza notas fuera de la escala 1.0–7.0', async ({ page }) => {
    await goToModule(page, 'grades');
    await page.getByRole('button', { name: 'Nueva asignatura' }).click();

    const modal = activeModal(page);
    await modal.locator('#new-subject-name').fill('Química E2E');
    await modal.locator('#new-subject-s1').fill('8.5');
    await modal.getByRole('button', { name: 'Crear asignatura' }).click();

    // El modal sigue abierto y no se creó la asignatura.
    await expect(modal).toBeVisible();
    await expect(page.locator('.subject-card').filter({ hasText: 'Química E2E' })).toHaveCount(0);
    await expect(page.locator('.toast')).toContainText('fuera de la escala');
  });
});
