import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

/**
 * Módulo 9 · Contacto y soporte.
 *
 * El endpoint es solo de escritura: confirma la recepción sin devolver el
 * contenido del mensaje y no expone un listado público con datos personales.
 */
describe('API · contacto y soporte', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('registra una consulta y devuelve solo el comprobante', async () => {
    const res = await api.client.post('/api/v1/contact').send({
      name: 'Camila Rojas',
      email: 'Camila.Rojas@Colegio.CL',
      role: 'student',
      topic: 'accessibility',
      subject: 'Contraste en el calendario',
      message: 'El texto del día feriado se pierde sobre el fondo azul claro.',
      consent: true,
    });

    const data = expectSuccess(res, 201);
    expect(data).toMatchObject({ status: 'NEW', received: true });
    expect(data.id).toMatch(/^msg_/);
    expect(data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // La respuesta no reexpone datos personales ni el cuerpo del mensaje.
    expect(data).not.toHaveProperty('email');
    expect(data).not.toHaveProperty('message');
    expect(data).not.toHaveProperty('name');

    const row = api.modules.connection.db
      .prepare('SELECT * FROM contact_messages WHERE id = ?')
      .get(data.id);
    expect(row).toMatchObject({
      name: 'Camila Rojas',
      email: 'camila.rojas@colegio.cl',
      role: 'STUDENT',
      topic: 'ACCESSIBILITY',
      status: 'NEW',
      consent: 1,
    });
  });

  it('exige consentimiento y datos válidos', async () => {
    const res = await api.client.post('/api/v1/contact').send({
      name: 'A',
      email: 'correo-invalido',
      role: 'desconocido',
      topic: 'otro',
      subject: '',
      message: 'corto',
      consent: false,
    });

    const body = expectError(res, 422);
    expect(body.details.map((detail) => detail.field)).toEqual(
      expect.arrayContaining(['email', 'consent']),
    );
  });

  it('no publica un listado de mensajes', async () => {
    expectError(await api.client.get('/api/v1/contact'), 404);
  });
});
