import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

describe('API · módulo de anuncios y comunicados', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista el feed con los fijados primero', async () => {
    const res = await api.client.get('/api/v1/announcements');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(4);
    expect(data.items.map((item) => item.title)).toEqual([
      'Bienvenida al segundo semestre',
      'Suspensión de clases por emergencia',
      'Feria científica abierta',
      'Calendario de evaluaciones',
    ]);
    expect(data.items.slice(0, 2).every((item) => item.pinned)).toBe(true);
    expect(data.items.slice(2).every((item) => item.pinned === false)).toBe(true);
  });

  it('filtra por categoría, fijados y texto', async () => {
    const suspensions = expectSuccess(
      await api.client.get('/api/v1/announcements').query({ category: 'SUSPENSION' }),
      200,
    );
    expect(suspensions.items).toHaveLength(1);

    const pinned = expectSuccess(
      await api.client.get('/api/v1/announcements').query({ pinned: true }),
      200,
    );
    expect(pinned.items).toHaveLength(2);

    const search = expectSuccess(
      await api.client.get('/api/v1/announcements').query({ q: 'feria' }),
      200,
    );
    expect(search.items).toHaveLength(1);
    expect(search.items[0].category).toBe('EVENT');
  });

  it('devuelve una lista vacía para una categoría sin anuncios', async () => {
    const data = expectSuccess(
      await api.client.get('/api/v1/announcements').query({ category: 'URGENT' }),
      200,
    );
    expect(data.items).toEqual([]);
    expect(data.pagination.total).toBe(0);
    expect(data.pagination.totalPages).toBe(0);
  });

  it('pagina el feed', async () => {
    const page2 = expectSuccess(
      await api.client.get('/api/v1/announcements').query({ page: 2, limit: 3 }),
      200,
    );
    expect(page2.items).toHaveLength(1);
    expect(page2.pagination).toMatchObject({
      page: 2,
      total: 4,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it('obtiene el detalle de un comunicado', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/announcements'));
    const data = expectSuccess(
      await api.client.get(`/api/v1/announcements/${list.items[0].id}`),
      200,
    );

    expect(data.id).toBe(list.items[0].id);
    expect(data.content.length).toBeGreaterThan(10);
    expect(data.authorName).toBeTruthy();
  });

  it('crea un comunicado (201) con valores por defecto', async () => {
    const res = await api.client.post('/api/v1/announcements').send({
      title: 'Nuevo comunicado',
      content: 'Contenido del comunicado.',
      authorName: 'Dirección',
    });
    const data = expectSuccess(res, 201);

    expect(data).toMatchObject({
      title: 'Nuevo comunicado',
      content: 'Contenido del comunicado.',
      authorName: 'Dirección',
      category: 'GENERAL',
      authorRole: 'DIRECTION',
      pinned: false,
    });
    expect(data.id).toMatch(/^ann_/);
  });

  it('crea un comunicado fijado y urgente', async () => {
    const data = expectSuccess(
      await api.client.post('/api/v1/announcements').send({
        title: 'Urgente',
        content: 'Contenido urgente.',
        category: 'urgent',
        authorName: 'Rectoría',
        authorRole: 'admin',
        pinned: 'true',
      }),
      201,
    );

    expect(data).toMatchObject({ category: 'URGENT', authorRole: 'ADMIN', pinned: true });
  });

  it('fija y desfija un comunicado', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/announcements').send({
        title: 'Para fijar',
        content: 'Contenido.',
        authorName: 'Dirección',
      }),
      201,
    );

    const pinned = expectSuccess(
      await api.client.patch(`/api/v1/announcements/${created.id}/pin`).send({ pinned: true }),
      200,
    );
    expect(pinned.pinned).toBe(true);

    const unpinned = expectSuccess(
      await api.client.patch(`/api/v1/announcements/${created.id}/pin`).send({ pinned: false }),
      200,
    );
    expect(unpinned.pinned).toBe(false);
  });

  it('actualiza un comunicado', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/announcements').send({
        title: 'Original',
        content: 'Contenido original.',
        authorName: 'Dirección',
      }),
      201,
    );

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/announcements/${created.id}`)
        .send({ title: 'Actualizado', category: 'ACADEMIC', pinned: true }),
      200,
    );
    expect(data).toMatchObject({ title: 'Actualizado', category: 'ACADEMIC', pinned: true });
  });

  it('elimina un comunicado y luego devuelve 404', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/announcements').send({
        title: 'Temporal',
        content: 'Contenido temporal.',
        authorName: 'Dirección',
      }),
      201,
    );

    expect(
      expectSuccess(await api.client.delete(`/api/v1/announcements/${created.id}`), 200),
    ).toEqual({ id: created.id });
    expectError(await api.client.get(`/api/v1/announcements/${created.id}`), 404);
  });

  it.each([
    [{ content: 'x', authorName: 'A' }, ['title']],
    [{ title: 'x', authorName: 'A' }, ['content']],
    [{ title: 'x', content: 'y' }, ['authorName']],
    [{ title: 'x', content: 'y', authorName: 'A', category: 'OTRA' }, ['category']],
    [{ title: 'x', content: 'y', authorName: 'A', authorRole: 'OTRO' }, ['authorRole']],
    [{ title: 'x', content: 'y', authorName: 'A', pinned: 'quizás' }, ['pinned']],
  ])('valida la creación de comunicados %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/announcements').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('exige al menos un campo al actualizar', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/announcements'));
    expectError(await api.client.patch(`/api/v1/announcements/${list.items[0].id}`).send({}), 422);
  });

  it('valida los parámetros de paginación', async () => {
    expectError(await api.client.get('/api/v1/announcements').query({ limit: 0 }), 422);
  });

  it('devuelve 404 para comunicados inexistentes', async () => {
    const id = 'ann_inexistente';
    expectError(await api.client.get(`/api/v1/announcements/${id}`), 404);
    expectError(await api.client.patch(`/api/v1/announcements/${id}`).send({ title: 'x' }), 404);
    expectError(
      await api.client.patch(`/api/v1/announcements/${id}/pin`).send({ pinned: true }),
      404,
    );
    expectError(await api.client.delete(`/api/v1/announcements/${id}`), 404);
  });
});
