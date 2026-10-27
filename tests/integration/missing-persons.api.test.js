import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

describe('API · módulo de personas extraviadas', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista los reportes más recientes primero', async () => {
    const res = await api.client.get('/api/v1/missing-persons');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(3);
    expect(data.pagination.total).toBe(3);
    expect(data.items.map((person) => person.name)).toEqual([
      'Sofía Ramos',
      'Matías Oliva',
      'Benjamín Soto',
    ]);
    expect(data.items[0]).toMatchObject({
      status: 'MISSING',
      found: false,
      foundAt: null,
      lastSeenPlace: 'Patio central',
      age: 13,
    });
  });

  it('filtra por estado', async () => {
    const missing = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ status: 'MISSING' }),
      200,
    );
    const found = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ status: 'FOUND' }),
      200,
    );

    expect(missing.items).toHaveLength(2);
    expect(found.items).toHaveLength(1);
    expect(found.items[0].name).toBe('Benjamín Soto');
    expect(found.items[0].found).toBe(true);
    expect(found.items[0].foundAt).toBeTruthy();
  });

  it('busca por nombre, lugar y contacto sin distinguir mayúsculas', async () => {
    // SQLite NOCASE solo pliega ASCII, por eso probamos mayúsculas en texto sin tildes.
    const byName = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ q: 'sofía' }),
      200,
    );
    expect(byName.items).toHaveLength(1);

    const byPlace = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ q: 'GIMNASIO' }),
      200,
    );
    expect(byPlace.items).toHaveLength(1);

    const byContact = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ q: 'inspectoría' }),
      200,
    );
    expect(byContact.items).toHaveLength(1);
  });

  it('combina búsqueda y estado', async () => {
    const data = expectSuccess(
      await api.client.get('/api/v1/missing-persons').query({ q: 'Sofía', status: 'FOUND' }),
      200,
    );
    expect(data.items).toEqual([]);
  });

  it('obtiene el detalle de un reporte', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/missing-persons'));
    const person = list.items[0];

    const data = expectSuccess(await api.client.get(`/api/v1/missing-persons/${person.id}`), 200);
    expect(data.id).toBe(person.id);
    expect(data.description.length).toBeGreaterThan(0);
  });

  it('crea un reporte (201) en estado MISSING', async () => {
    const res = await api.client.post('/api/v1/missing-persons').send({
      name: 'Niño Demo',
      age: 10,
      description: 'Polerón verde y pantalón gris.',
      lastSeenPlace: 'Comedor',
      contact: 'Apoderado: +56 9 1111 2222',
      exampleImageUrl: '/uploads/ejemplo.png',
    });

    const data = expectSuccess(res, 201);
    expect(data).toMatchObject({
      name: 'Niño Demo',
      age: 10,
      status: 'MISSING',
      found: false,
      foundAt: null,
      lastSeenPlace: 'Comedor',
      exampleImageUrl: '/uploads/ejemplo.png',
    });
    expect(data.id).toMatch(/^msp_/);
  });

  it('crea un reporte directamente como encontrado', async () => {
    const data = expectSuccess(
      await api.client.post('/api/v1/missing-persons').send({
        name: 'Caso Resuelto',
        description: 'Descripción',
        lastSeenPlace: 'Patio',
        contact: 'Contacto',
        status: 'FOUND',
      }),
      201,
    );

    expect(data.status).toBe('FOUND');
    expect(data.found).toBe(true);
    expect(data.foundAt).toBeTruthy();
    expect(data.age).toBeNull();
  });

  it('marca un reporte como encontrado y revierte el estado', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/missing-persons').send({
        name: 'Buscado',
        description: 'Descripción',
        lastSeenPlace: 'Patio',
        contact: 'Contacto',
      }),
      201,
    );

    const found = expectSuccess(
      await api.client.patch(`/api/v1/missing-persons/${created.id}/found`).send({ found: true }),
      200,
    );
    expect(found.status).toBe('FOUND');
    expect(found.found).toBe(true);
    expect(found.foundAt).toBeTruthy();

    const reverted = expectSuccess(
      await api.client.patch(`/api/v1/missing-persons/${created.id}/found`).send({ found: false }),
      200,
    );
    expect(reverted.status).toBe('MISSING');
    expect(reverted.found).toBe(false);
    expect(reverted.foundAt).toBeNull();
  });

  it('cambia el estado mediante el endpoint de estado', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/missing-persons').send({
        name: 'Estado',
        description: 'Descripción',
        lastSeenPlace: 'Patio',
        contact: 'Contacto',
      }),
      201,
    );

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/missing-persons/${created.id}/status`)
        .send({ status: 'found' }),
      200,
    );
    expect(data.status).toBe('FOUND');
  });

  it('actualiza los datos de un reporte', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/missing-persons').send({
        name: 'Original',
        description: 'Original',
        lastSeenPlace: 'Original',
        contact: 'Original',
      }),
      201,
    );

    const data = expectSuccess(
      await api.client.patch(`/api/v1/missing-persons/${created.id}`).send({
        name: 'Actualizado',
        lastSeenPlace: 'Biblioteca',
        age: 14,
      }),
      200,
    );
    expect(data).toMatchObject({ name: 'Actualizado', lastSeenPlace: 'Biblioteca', age: 14 });
  });

  it('elimina un reporte y luego devuelve 404', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/missing-persons').send({
        name: 'Temporal',
        description: 'Descripción',
        lastSeenPlace: 'Patio',
        contact: 'Contacto',
      }),
      201,
    );

    expect(
      expectSuccess(await api.client.delete(`/api/v1/missing-persons/${created.id}`), 200),
    ).toEqual({ id: created.id });
    expectError(await api.client.get(`/api/v1/missing-persons/${created.id}`), 404);
  });

  it.each([
    [{ description: 'x', lastSeenPlace: 'y', contact: 'z' }, ['name']],
    [{ name: 'x', lastSeenPlace: 'y', contact: 'z' }, ['description']],
    [{ name: 'x', description: 'y', contact: 'z' }, ['lastSeenPlace']],
    [{ name: 'x', description: 'y', lastSeenPlace: 'z' }, ['contact']],
    [{ name: 'x', age: 130, description: 'y', lastSeenPlace: 'z', contact: 'w' }, ['age']],
    [{ name: 'x', age: -1, description: 'y', lastSeenPlace: 'z', contact: 'w' }, ['age']],
    [{ name: 'x', description: 'y', lastSeenPlace: 'z', contact: 'w', status: 'OTRO' }, ['status']],
  ])('valida la creación de reportes %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/missing-persons').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('valida los parámetros de paginación', async () => {
    expectError(await api.client.get('/api/v1/missing-persons').query({ limit: 500 }), 422);
    expectError(await api.client.get('/api/v1/missing-persons').query({ page: 0 }), 422);
  });

  it('devuelve 404 para reportes inexistentes', async () => {
    const id = 'msp_inexistente';
    expectError(await api.client.get(`/api/v1/missing-persons/${id}`), 404);
    expectError(
      await api.client.patch(`/api/v1/missing-persons/${id}/found`).send({ found: true }),
      404,
    );
    expectError(await api.client.patch(`/api/v1/missing-persons/${id}`).send({ name: 'x' }), 404);
    expectError(await api.client.delete(`/api/v1/missing-persons/${id}`), 404);
  });
});
