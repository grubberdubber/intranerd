import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

describe('API · módulo de objetos perdidos y encontrados', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista los objetos del seed con paginación', async () => {
    const res = await api.client.get('/api/v1/lost-found');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(4);
    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 4,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(data.items.every((item) => item.status === 'OPEN')).toBe(true);
  });

  it('filtra por tipo FOUND y LOST', async () => {
    const found = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ type: 'FOUND' }),
      200,
    );
    const lost = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ type: 'LOST' }),
      200,
    );

    expect(found.items).toHaveLength(2);
    expect(lost.items).toHaveLength(2);
    expect(found.items.every((item) => item.type === 'FOUND')).toBe(true);
    expect(lost.items.every((item) => item.type === 'LOST')).toBe(true);
  });

  it('acepta el tipo en minúsculas', async () => {
    const data = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ type: 'found' }),
      200,
    );
    expect(data.pagination.total).toBe(2);
  });

  it('busca por descripción, ubicación y reportante', async () => {
    const byDescription = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ q: 'mochila' }),
      200,
    );
    expect(byDescription.items).toHaveLength(1);
    expect(byDescription.items[0].description).toContain('Mochila');

    const byLocation = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ q: 'biblioteca' }),
      200,
    );
    expect(byLocation.items).toHaveLength(1);

    const byReporter = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ q: 'Antonia' }),
      200,
    );
    expect(byReporter.items).toHaveLength(1);
    expect(byReporter.items[0].type).toBe('LOST');
  });

  it('filtra por estado y combina filtros', async () => {
    const returned = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ status: 'RETURNED' }),
      200,
    );
    expect(returned.items).toEqual([]);

    const combined = expectSuccess(
      await api.client
        .get('/api/v1/lost-found')
        .query({ type: 'LOST', status: 'OPEN', q: 'cuaderno' }),
      200,
    );
    expect(combined.items).toHaveLength(1);
  });

  it('pagina los resultados', async () => {
    const page1 = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ page: 1, limit: 2 }),
      200,
    );
    const page2 = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ page: 2, limit: 2 }),
      200,
    );

    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(page1.pagination).toMatchObject({
      total: 4,
      totalPages: 2,
      hasNextPage: true,
    });
    expect(page2.pagination).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
    expect(page1.items.map((item) => item.id)).not.toEqual(page2.items.map((item) => item.id));
  });

  it('obtiene el detalle de un objeto', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/lost-found'));
    const item = list.items[0];

    const data = expectSuccess(await api.client.get(`/api/v1/lost-found/${item.id}`), 200);
    expect(data.id).toBe(item.id);
    expect(data).toHaveProperty('exampleImageUrl');
  });

  it('crea un objeto encontrado (201) con estado OPEN por defecto', async () => {
    const res = await api.client.post('/api/v1/lost-found').send({
      type: 'FOUND',
      reportedBy: 'Inspectoría',
      contact: 'inspectoria@intranerd.cl',
      description: 'Paraguas azul con mango de madera.',
      location: 'Hall de entrada',
      exampleImageUrl: 'https://example.com/paraguas.jpg',
    });

    const data = expectSuccess(res, 201);
    expect(data).toMatchObject({
      type: 'FOUND',
      reportedBy: 'Inspectoría',
      contact: 'inspectoria@intranerd.cl',
      location: 'Hall de entrada',
      exampleImageUrl: 'https://example.com/paraguas.jpg',
      status: 'OPEN',
      photoUrl: null,
    });
    expect(data.id).toMatch(/^lfi_/);
  });

  it('crea un aviso de objeto perdido', async () => {
    const data = expectSuccess(
      await api.client.post('/api/v1/lost-found').send({
        type: 'LOST',
        reportedBy: 'Estudiante',
        contact: '+56 9 0000 0000',
        description: 'Calculadora científica negra.',
        status: 'CLAIMED',
      }),
      201,
    );
    expect(data.type).toBe('LOST');
    expect(data.status).toBe('CLAIMED');
    expect(data.location).toBeNull();
  });

  it('actualiza un objeto existente', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/lost-found').send({
        type: 'FOUND',
        reportedBy: 'A',
        contact: 'a@a.cl',
        description: 'Descripción original',
      }),
      201,
    );

    const res = await api.client.patch(`/api/v1/lost-found/${created.id}`).send({
      description: 'Descripción corregida',
      location: 'Patio trasero',
    });
    const data = expectSuccess(res, 200);

    expect(data.description).toBe('Descripción corregida');
    expect(data.location).toBe('Patio trasero');
  });

  it('marca un objeto como devuelto y permite filtrarlo', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/lost-found').send({
        type: 'FOUND',
        reportedBy: 'Conserjería',
        contact: 'meson@intranerd.cl',
        description: 'Bufanda roja.',
      }),
      201,
    );

    const res = await api.client
      .patch(`/api/v1/lost-found/${created.id}/status`)
      .send({ status: 'returned' });
    const data = expectSuccess(res, 200);

    expect(data.status).toBe('RETURNED');

    const filtered = expectSuccess(
      await api.client.get('/api/v1/lost-found').query({ status: 'RETURNED' }),
      200,
    );
    expect(filtered.items.map((item) => item.id)).toContain(created.id);
  });

  it('elimina un objeto y luego devuelve 404', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/lost-found').send({
        type: 'FOUND',
        reportedBy: 'Temporal',
        contact: 'temp@intranerd.cl',
        description: 'Objeto temporal para eliminar.',
      }),
      201,
    );

    expect(expectSuccess(await api.client.delete(`/api/v1/lost-found/${created.id}`), 200)).toEqual(
      {
        id: created.id,
      },
    );
    expectError(await api.client.get(`/api/v1/lost-found/${created.id}`), 404);
    expectError(await api.client.delete(`/api/v1/lost-found/${created.id}`), 404);
  });

  it.each([
    [{ type: 'FOUND', contact: 'x', description: 'y' }, ['reportedBy']],
    [{ type: 'FOUND', reportedBy: 'x', description: 'y' }, ['contact']],
    [{ type: 'FOUND', reportedBy: 'x', contact: 'y' }, ['description']],
    [{ type: 'OTRO', reportedBy: 'x', contact: 'y', description: 'z' }, ['type']],
    [
      { type: 'FOUND', reportedBy: 'x', contact: 'y', description: 'z', photoUrl: 'ftp://x' },
      ['photoUrl'],
    ],
  ])('valida la creación de objetos %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/lost-found').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('valida el estado al cambiar de estado', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/lost-found'));
    const res = await api.client
      .patch(`/api/v1/lost-found/${list.items[0].id}/status`)
      .send({ status: 'PERDIDO' });
    expectError(res, 422);
  });

  it('devuelve 404 para recursos inexistentes', async () => {
    expectError(await api.client.get('/api/v1/lost-found/lfi_inexistente'), 404);
    expectError(
      await api.client.patch('/api/v1/lost-found/lfi_inexistente').send({ description: 'x' }),
      404,
    );
    expectError(
      await api.client
        .patch('/api/v1/lost-found/lfi_inexistente/status')
        .send({ status: 'RETURNED' }),
      404,
    );
  });
});
