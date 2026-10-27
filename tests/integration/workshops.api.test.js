import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

function findWorkshop(workshops, name) {
  const workshop = workshops.find((item) => item.name === name);
  if (!workshop) throw new Error(`No se encontró el taller ${name}`);
  return workshop;
}

describe('API · módulo de talleres e inscripciones', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista los talleres con cupos calculados', async () => {
    const res = await api.client.get('/api/v1/workshops');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(5);
    expect(data.items.map((workshop) => workshop.name)).toEqual([
      'Arte y Muralismo',
      'Banda escolar',
      'Ciencia y Experimentos',
      'Fútbol formativo',
      'Programación y Robótica',
    ]);

    const robotica = findWorkshop(data.items, 'Programación y Robótica');
    expect(robotica).toMatchObject({
      capacity: 20,
      enrolledCount: 2,
      availableSpots: 18,
      isFull: false,
      category: 'Tecnología',
    });

    const futbol = findWorkshop(data.items, 'Fútbol formativo');
    expect(futbol).toMatchObject({ capacity: 25, enrolledCount: 1, availableSpots: 24 });
  });

  it('filtra por categoría, texto y disponibilidad', async () => {
    const deportes = expectSuccess(
      await api.client.get('/api/v1/workshops').query({ category: 'deportes' }),
      200,
    );
    expect(deportes.items).toHaveLength(1);

    const search = expectSuccess(
      await api.client.get('/api/v1/workshops').query({ q: 'robot' }),
      200,
    );
    expect(search.items).toHaveLength(1);

    const available = expectSuccess(
      await api.client.get('/api/v1/workshops').query({ available: true }),
      200,
    );
    expect(available.items).toHaveLength(5);
  });

  it('obtiene el detalle con sus inscripciones', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    const robotica = findWorkshop(list.items, 'Programación y Robótica');

    const data = expectSuccess(await api.client.get(`/api/v1/workshops/${robotica.id}`), 200);
    expect(data.id).toBe(robotica.id);
    expect(data.enrollments).toHaveLength(2);
    expect(data.enrollments.map((enrollment) => enrollment.studentName)).toContain('Alumno Demo');
  });

  it('crea un taller (201)', async () => {
    const res = await api.client.post('/api/v1/workshops').send({
      name: 'Taller Nuevo',
      description: 'Descripción del taller.',
      category: 'Ciencia',
      schedule: 'Lunes 15:00',
      location: 'Lab 3',
      teacherName: 'Prof. Demo',
      capacity: 10,
    });
    const data = expectSuccess(res, 201);

    expect(data).toMatchObject({
      name: 'Taller Nuevo',
      description: 'Descripción del taller.',
      category: 'Ciencia',
      schedule: 'Lunes 15:00',
      location: 'Lab 3',
      teacherName: 'Prof. Demo',
      capacity: 10,
      enrolledCount: 0,
      availableSpots: 10,
      isFull: false,
    });
    expect(data.id).toMatch(/^wsp_/);
  });

  it('inscribe a un alumno y actualiza los cupos', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/workshops').send({ name: 'Inscripción', capacity: 2 }),
      201,
    );

    const res = await api.client
      .post(`/api/v1/workshops/${created.id}/enrollments`)
      .send({ studentName: 'Alumno Uno', studentEmail: 'uno@intranerd.cl' });
    const data = expectSuccess(res, 201);

    expect(data.enrollment).toMatchObject({
      workshopId: created.id,
      studentName: 'Alumno Uno',
      studentEmail: 'uno@intranerd.cl',
    });
    expect(data.enrollment.id).toMatch(/^enr_/);
    expect(data.workshop).toMatchObject({
      enrolledCount: 1,
      availableSpots: 1,
      isFull: false,
    });

    const enrollments = expectSuccess(
      await api.client.get(`/api/v1/workshops/${created.id}/enrollments`),
      200,
    );
    expect(enrollments).toHaveLength(1);
  });

  it('rechaza inscribir dos veces al mismo alumno (409)', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    const robotica = findWorkshop(list.items, 'Programación y Robótica');

    const res = await api.client
      .post(`/api/v1/workshops/${robotica.id}/enrollments`)
      .send({ studentName: 'Alumno Demo' });

    const body = expectError(res, 409);
    expect(body.error).toMatch(/ya está inscrito/i);
  });

  it('compara el nombre del alumno sin distinguir mayúsculas (409)', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    const robotica = findWorkshop(list.items, 'Programación y Robótica');

    const body = expectError(
      await api.client
        .post(`/api/v1/workshops/${robotica.id}/enrollments`)
        .send({ studentName: 'alumno demo' }),
      409,
    );
    expect(body.error).toMatch(/ya está inscrito/i);
  });

  it('rechaza inscripciones cuando el taller está lleno (409)', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/workshops').send({ name: 'Cupo único', capacity: 1 }),
      201,
    );

    expectSuccess(
      await api.client
        .post(`/api/v1/workshops/${created.id}/enrollments`)
        .send({ studentName: 'Primero' }),
      201,
    );

    const body = expectError(
      await api.client
        .post(`/api/v1/workshops/${created.id}/enrollments`)
        .send({ studentName: 'Segundo' }),
      409,
    );
    expect(body.error).toMatch(/cupos disponibles/i);
  });

  it('elimina una inscripción y libera el cupo', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/workshops').send({ name: 'Baja', capacity: 5 }),
      201,
    );
    const enrolled = expectSuccess(
      await api.client
        .post(`/api/v1/workshops/${created.id}/enrollments`)
        .send({ studentName: 'Alumno Baja' }),
      201,
    );

    const workshop = expectSuccess(
      await api.client.delete(
        `/api/v1/workshops/${created.id}/enrollments/${enrolled.enrollment.id}`,
      ),
      200,
    );
    expect(workshop.enrolledCount).toBe(0);
    expect(workshop.availableSpots).toBe(5);

    expectError(
      await api.client.delete(
        `/api/v1/workshops/${created.id}/enrollments/${enrolled.enrollment.id}`,
      ),
      404,
    );
  });

  it('no permite reducir el cupo por debajo de los inscritos (409)', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    const robotica = findWorkshop(list.items, 'Programación y Robótica');

    const body = expectError(
      await api.client.patch(`/api/v1/workshops/${robotica.id}`).send({ capacity: 1 }),
      409,
    );
    expect(body.error).toMatch(/reducir el cupo/i);
  });

  it('actualiza un taller', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/workshops').send({ name: 'Editable', capacity: 8 }),
      201,
    );

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/workshops/${created.id}`)
        .send({ name: 'Actualizado', capacity: 12, location: 'Patio' }),
      200,
    );
    expect(data).toMatchObject({ name: 'Actualizado', capacity: 12, location: 'Patio' });
  });

  it('elimina un taller y sus inscripciones en cascada', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/workshops').send({ name: 'Temporal', capacity: 3 }),
      201,
    );
    expectSuccess(
      await api.client
        .post(`/api/v1/workshops/${created.id}/enrollments`)
        .send({ studentName: 'Alumno Temporal' }),
      201,
    );

    expect(expectSuccess(await api.client.delete(`/api/v1/workshops/${created.id}`), 200)).toEqual({
      id: created.id,
    });
    expectError(await api.client.get(`/api/v1/workshops/${created.id}`), 404);
    expectError(await api.client.get(`/api/v1/workshops/${created.id}/enrollments`), 404);
  });

  it.each([
    [{ capacity: 10 }, ['name']],
    [{ name: 'X' }, ['capacity']],
    [{ name: 'X', capacity: 0 }, ['capacity']],
    [{ name: 'X', capacity: 501 }, ['capacity']],
    [{ name: 'X', capacity: 2.5 }, ['capacity']],
    [{ name: 'X', capacity: 'muchos' }, ['capacity']],
  ])('valida la creación de talleres %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/workshops').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('valida la inscripción', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    const workshop = list.items[0];

    const missing = expectError(
      await api.client.post(`/api/v1/workshops/${workshop.id}/enrollments`).send({}),
      422,
    );
    expect(missing.details.map((detail) => detail.field)).toContain('studentName');

    const badEmail = expectError(
      await api.client
        .post(`/api/v1/workshops/${workshop.id}/enrollments`)
        .send({ studentName: 'Alumno', studentEmail: 'no-es-correo' }),
      422,
    );
    expect(badEmail.details.map((detail) => detail.field)).toContain('studentEmail');
  });

  it('exige al menos un campo al actualizar', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/workshops'));
    expectError(await api.client.patch(`/api/v1/workshops/${list.items[0].id}`).send({}), 422);
  });

  it('devuelve 404 para talleres e inscripciones inexistentes', async () => {
    const id = 'wsp_inexistente';
    expectError(await api.client.get(`/api/v1/workshops/${id}`), 404);
    expectError(await api.client.get(`/api/v1/workshops/${id}/enrollments`), 404);
    expectError(
      await api.client.post(`/api/v1/workshops/${id}/enrollments`).send({
        studentName: 'Alumno',
      }),
      404,
    );
    expectError(await api.client.patch(`/api/v1/workshops/${id}`).send({ name: 'X' }), 404);
    expectError(await api.client.delete(`/api/v1/workshops/${id}`), 404);
    expectError(
      await api.client.delete(`/api/v1/workshops/${id}/enrollments/enr_inexistente`),
      404,
    );
  });
});
