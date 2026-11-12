import { test, expect, activeModal, goToModule, reloadApp } from './fixtures.js';

test.describe('Mensajes internos y páginas legales', () => {
  test('agrega un contacto, envía un mensaje y conserva la conversación', async ({ page }) => {
    await goToModule(page, 'chat');
    await expect(page.locator('.chat-layout')).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo contacto' }).first().click();
    const modal = activeModal(page);
    await expect(modal.getByRole('heading', { name: 'Nuevo contacto' })).toBeVisible();

    await modal.locator('#chat-contact-name').fill('Inspectora de prueba');
    await modal.locator('#chat-contact-role').selectOption('inspector');
    await modal.locator('#chat-contact-detail').fill('Inspectoría · Patio norte');
    await modal.locator('#chat-contact-email').fill('inspectoria.prueba@colegio.cl');
    await modal.getByRole('button', { name: 'Agregar contacto' }).click();

    await expect(page.locator('.chat-panel__name')).toHaveText('Inspectora de prueba');
    await expect(page.locator('.chat-panel__notice')).toContainText('no se envían a otras personas');

    await page.locator('#chat-input').fill('Hola, necesito apoyo en el patio durante el recreo.');
    await page.locator('#chat-form').getByRole('button', { name: 'Enviar' }).click();
    await expect(page.locator('.chat-message--me .chat-message__text')).toContainText(
      'necesito apoyo en el patio',
    );

    await reloadApp(page);
    const savedContact = page
      .locator('.chat-contact')
      .filter({ hasText: 'Inspectora de prueba' });
    await expect(savedContact).toBeVisible();
    await savedContact.click();
    await expect(page.locator('.chat-message--me .chat-message__text')).toContainText(
      'necesito apoyo en el patio',
    );
  });

  test('abre el aviso legal y la política de seguridad desde el footer', async ({ page }) => {
    await goToModule(page, 'chat');

    await page.getByRole('button', { name: 'Aviso legal' }).click();
    const legalModal = activeModal(page);
    await expect(legalModal.getByRole('heading', { name: 'Aviso legal' })).toBeVisible();
    await expect(legalModal).toContainText('Titularidad del proyecto');
    await legalModal.getByRole('button', { name: 'Entendido' }).click();

    await page.getByRole('button', { name: 'Política de seguridad' }).click();
    const securityModal = activeModal(page);
    await expect(securityModal.getByRole('heading', { name: 'Política de seguridad' })).toBeVisible();
    await expect(securityModal).toContainText('Reporte responsable de vulnerabilidades');
  });
});
