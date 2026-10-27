import { activeModal, expect, goToModule, reloadApp, test } from './fixtures.js';

/**
 * Flujo E2E #2 — Calendario de pruebas.
 *
 * Un profesor programa una evaluación en un día concreto; el evento se refleja
 * en la cuadrícula, persiste tras recargar y sigue visible al cambiar el rol a
 * alumno y abrir el mismo día.
 */
test.describe('Calendario de pruebas', () => {
  test('el profesor programa una prueba y el alumno la ve', async ({ page }) => {
    const title = 'Prueba E2E de Física';
    const description = 'Contenidos de cinemática y dinámica. Traer calculadora.';

    await goToModule(page, 'calendar');
    await expect(
      page.getByRole('heading', { name: 'Calendario de pruebas y evaluaciones' }),
    ).toBeVisible();

    const year = (await page.locator('#calendar-year-value').textContent())?.trim();
    expect(year).toMatch(/^\d{4}$/);

    // Fecha fija no feriada (12 de marzo) del año que muestra el calendario.
    const date = `${year}-03-12`;
    const day = page.locator(`[data-date="${date}"]`);
    await expect(day).toBeVisible();

    // Identidad del profesor. Los cambios se guardan al salir del campo.
    await page.locator('#calendar-role').selectOption('profesor');
    await page.locator('#calendar-name').fill('Prof. E2E');
    await page.locator('#calendar-name').press('Tab');

    await day.click();
    let modal = activeModal(page);
    await expect(modal.locator('#event-title')).toBeVisible();

    await modal.locator('#event-title').fill(title);
    await modal.locator('#event-subject').fill('Física');
    await modal.locator('#event-description').fill(description);
    await modal.getByRole('button', { name: 'Programar prueba' }).click();

    await expect(modal).toHaveCount(0);

    // La cuadrícula muestra el título en el día seleccionado.
    await expect(page.locator(`[data-date="${date}"] .day-event`)).toHaveText(title);

    // Persistencia tras recargar.
    await reloadApp(page);
    await expect(page.locator(`[data-date="${date}"] .day-event`)).toHaveText(title);

    // Cambio a rol alumno: el evento debe seguir visible con su autoría.
    await page.locator('#calendar-role').selectOption('alumno');
    await page.locator('#calendar-name').fill('Alumno E2E');
    await page.locator('#calendar-name').press('Tab');

    await page.locator(`[data-date="${date}"]`).click();
    modal = activeModal(page);
    const eventItem = modal.locator('.day-event-item').filter({ hasText: title });
    await expect(eventItem).toBeVisible();
    await expect(eventItem.locator('.day-event-item__title')).toHaveText(title);
    await expect(eventItem.locator('.day-event-item__desc')).toHaveText(description);
    await expect(eventItem.locator('.day-event-item__author')).toContainText(
      'Publicado por profesor/a: Prof. E2E',
    );
  });
});
