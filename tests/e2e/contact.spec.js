import { expect, goToModule, reloadApp, test } from './fixtures.js';

/**
 * Módulo 9 · Contacto y soporte.
 *
 * La API está desactivada en E2E, así que el formulario ejercita el respaldo en
 * localStorage: validación accesible, confirmación con folio y persistencia
 * tras recargar la SPA.
 */
test.describe('Contacto y soporte', () => {
  test('valida, registra y conserva la consulta en el respaldo local', async ({ page }) => {
    const name = 'Camila E2E';
    const email = 'camila.e2e@colegio.cl';
    const subject = 'Barrera de accesibilidad E2E';
    const message =
      'Al navegar con teclado por el calendario, el foco se pierde al cambiar de mes.';

    await goToModule(page, 'contact');
    await expect(page.getByRole('heading', { name: 'Hablemos de IntraNerd' })).toBeVisible();

    // Envío vacío: el primer campo inválido recibe el foco y un error asociado.
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(page.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#contact-name')).toBeFocused();
    await expect(page.locator('#contact-name-error')).toBeVisible();

    await page.locator('#contact-name').fill(name);
    await page.locator('#contact-email').fill(email);
    await page.locator('#contact-role').selectOption('student');
    await page.locator('#contact-topic').selectOption('accessibility');
    await page.locator('#contact-subject').fill(subject);
    await page.locator('#contact-message').fill(message);
    await page.locator('#contact-consent').check();

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    const success = page.locator('.contact-success');
    await expect(success).toContainText('¡Mensaje registrado!');
    await expect(success).toContainText('guardamos tu consulta en este navegador');
    await expect(success).toBeFocused();

    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('intranerd.v2:contact.messages') || '[]'),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      name,
      email,
      subject,
      message,
      role: 'STUDENT',
      topic: 'ACCESSIBILITY',
    });

    // El respaldo local sobrevive a una recarga completa de la SPA.
    await reloadApp(page);
    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('intranerd.v2:contact.messages') || '[]'),
    );
    expect(persisted).toHaveLength(1);
    expect(persisted[0].message).toBe(message);
  });
});
