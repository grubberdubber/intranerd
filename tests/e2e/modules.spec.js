import { activeModal, expect, goToModule, reloadApp, test } from './fixtures.js';

test.describe('Módulos de comunidad', () => {
  test('personas extraviadas: reporta, marca encontrado y elimina', async ({ page }) => {
    const name = 'Persona E2E';
    await goToModule(page, 'missing');
    await page.getByRole('button', { name: 'Reportar persona' }).click();

    const modal = activeModal(page);
    await modal.locator('#missing-name').fill(name);
    await modal.locator('#missing-age').fill('14');
    await modal.locator('#missing-place').fill('Gimnasio E2E');
    await modal.locator('#missing-contact').fill('apoderado@e2e.cl');
    await modal.locator('#missing-desc').fill('Polerón azul y mochila negra.');
    await modal.getByRole('button', { name: 'Publicar reporte' }).click();
    await expect(modal).toHaveCount(0);

    const card = page.locator('.report-card').filter({ hasText: name });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Gimnasio E2E');

    await card.getByRole('button', { name: 'Marcar encontrado' }).click();
    await expect(card.getByRole('button', { name: 'Marcar activo' })).toBeVisible();

    await reloadApp(page);
    const persisted = page.locator('.report-card').filter({ hasText: name });
    await expect(persisted.getByRole('button', { name: 'Marcar activo' })).toBeVisible();

    await persisted.getByRole('button', { name: 'Eliminar' }).click();
    const confirm = activeModal(page);
    await confirm.getByRole('button', { name: 'Eliminar reporte' }).click();
    await expect(page.locator('.report-card').filter({ hasText: name })).toHaveCount(0);
  });

  test('profesores: agrega docente y publica una opinión', async ({ page }) => {
    const teacherName = 'Prof. E2E Smoke';
    const opinion = 'Explica con claridad y responde todas las dudas.';

    await goToModule(page, 'teachers');
    await page.getByRole('button', { name: 'Agregar profesor' }).click();

    let modal = activeModal(page);
    await modal.locator('#teacher-name').fill(teacherName);
    await modal.locator('#teacher-subject').fill('Robótica');
    await modal.getByRole('button', { name: 'Agregar profesor' }).click();
    await expect(modal).toHaveCount(0);

    const card = page.locator('.teacher-card').filter({ hasText: teacherName });
    await expect(card).toBeVisible();

    await page.getByRole('button', { name: 'Escribir opinión' }).first().click();
    modal = activeModal(page);
    await modal.locator('#review-student').fill('Alumno E2E');
    const teacherValue = await card.getAttribute('data-id');
    await modal.locator('#review-teacher').selectOption(teacherValue);
    await modal.locator('.stars--interactive .stars__star[data-value="5"]').click();
    await modal.locator('#review-opinion').fill(opinion);
    await modal.getByRole('button', { name: 'Publicar opinión' }).click();
    await expect(modal).toHaveCount(0);

    await expect(card).toContainText(opinion);
    await expect(card).toContainText('Alumno E2E');
  });

  test('talleres: crea un taller y matricula a un alumno', async ({ page }) => {
    const workshopName = 'Taller E2E';
    const student = 'Alumno Taller E2E';

    await goToModule(page, 'workshops');
    await page.getByRole('button', { name: 'Nuevo taller' }).click();

    let modal = activeModal(page);
    await modal.locator('#workshop-name').fill(workshopName);
    await modal.locator('#workshop-teacher').fill('Prof. E2E');
    await modal.locator('#workshop-schedule').fill('Miércoles · 16:00');
    await modal.locator('#workshop-location').fill('Laboratorio E2E');
    await modal.locator('#workshop-capacity').fill('2');
    await modal.locator('#workshop-category').selectOption({ index: 1 });
    await modal.locator('#workshop-description').fill('Taller de prueba automatizada.');
    await modal.getByRole('button', { name: 'Crear taller' }).click();
    await expect(modal).toHaveCount(0);

    const card = page.locator('.workshop-card').filter({ hasText: workshopName });
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: 'Inscribirme' }).click();
    modal = activeModal(page);
    await modal.locator('#enroll-name').fill(student);
    await modal.locator('#enroll-course').fill('2° medio E2E');
    await modal.getByRole('button', { name: 'Confirmar inscripción' }).click();
    await expect(modal).toHaveCount(0);

    await card.getByRole('button', { name: 'Ver inscritos' }).click();
    modal = activeModal(page);
    await expect(modal).toContainText(student);
  });

  test('comunicados: publica, fija y elimina un aviso', async ({ page }) => {
    const title = 'Comunicado E2E';

    await goToModule(page, 'announcements');
    await page.getByRole('button', { name: 'Nuevo comunicado' }).click();

    const modal = activeModal(page);
    await modal.locator('#announcement-title').fill(title);
    await modal.locator('#announcement-author').fill('Dirección E2E');
    await modal.locator('#announcement-body').fill('Contenido de prueba automatizada.');
    await modal.locator('#announcement-pinned').check();
    await modal.getByRole('button', { name: 'Publicar comunicado' }).click();
    await expect(modal).toHaveCount(0);

    const card = page.locator('.announcement-card').filter({ hasText: title });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Fijado');

    await card.getByRole('button', { name: 'Quitar fijado' }).click();
    await expect(card.getByRole('button', { name: 'Fijar', exact: true })).toBeVisible();

    await card.getByRole('button', { name: 'Eliminar' }).click();
    const confirm = activeModal(page);
    await confirm.getByRole('button', { name: 'Eliminar comunicado' }).click();
    await expect(page.locator('.announcement-card').filter({ hasText: title })).toHaveCount(0);
  });

  test('tareas: publica, completa y elimina una tarea', async ({ page }) => {
    const title = 'Tarea E2E';

    await goToModule(page, 'tasks');
    await page.getByRole('button', { name: 'Nueva tarea' }).click();

    const modal = activeModal(page);
    await modal.locator('#task-title').fill(title);
    await modal.locator('#task-subject-input').fill('Historia E2E');
    await modal.locator('#task-due').fill('2030-01-15');
    await modal.locator('#task-author').fill('Prof. E2E');
    await modal.locator('#task-description').fill('Leer el capítulo 3 y responder la guía.');
    await modal.getByRole('button', { name: 'Publicar tarea' }).click();
    await expect(modal).toHaveCount(0);

    const item = page.locator('.task-item').filter({ hasText: title });
    await expect(item).toBeVisible();

    await item.locator('input[type="checkbox"]').click();
    // El filtro por defecto es "Pendientes", así que la tarea completada desaparece.
    await expect(page.locator('.task-item').filter({ hasText: title })).toHaveCount(0);
    await page.locator('#tasks-status').selectOption('completed');
    await expect(item).toHaveClass(/is-completed/);

    await reloadApp(page);
    await page.locator('#tasks-status').selectOption('completed');
    const persisted = page.locator('.task-item').filter({ hasText: title });
    await expect(persisted).toHaveClass(/is-completed/);

    await persisted.getByRole('button', { name: /Eliminar tarea/ }).click();
    const confirm = activeModal(page);
    await confirm.getByRole('button', { name: 'Eliminar tarea' }).click();
    await expect(page.locator('.task-item').filter({ hasText: title })).toHaveCount(0);
  });
});
