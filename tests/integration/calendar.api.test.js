import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

const YEAR = new Date().getFullYear();

describe('API · módulo de calendario escolar', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('devuelve los festivos chilenos del año solicitado', async () => {
    const res = await api.client.get('/api/v1/calendar/holidays').query({ year: 2026 });
    const data = expectSuccess(res, 200);

    expect(data.year).toBe(2026);
    const dates = data.holidays.map((holiday) => holiday.date);

    expect(dates).toEqual(expect.arrayContaining(['2026-01-01', '2026-09-18', '2026-12-25']));
    // Pascua 2026: domingo 5 de abril → Viernes Santo 3 y Sábado Santo 4.
    expect(dates).toEqual(expect.arrayContaining(['2026-04-03', '2026-04-04']));
    expect(data.holidays.every((holiday) => holiday.type === 'HOLIDAY')).toBe(true);
    expect(dates).toEqual([...dates].sort());
  });

  it('usa el año actual cuando no se indica', async () => {
    const data = expectSuccess(await api.client.get('/api/v1/calendar/holidays'), 200);
    expect(data.year).toBe(YEAR);
    expect(data.holidays.length).toBeGreaterThan(10);
  });

  it('valida el año fuera de rango', async () => {
    expectError(await api.client.get('/api/v1/calendar/holidays').query({ year: 1800 }), 422);
    expectError(await api.client.get('/api/v1/calendar/holidays').query({ year: 2200 }), 422);
  });

  it('devuelve el año completo con festivos y evaluaciones', async () => {
    const res = await api.client.get('/api/v1/calendar').query({ year: YEAR });
    const data = expectSuccess(res, 200);

    expect(data.year).toBe(YEAR);
    expect(data.holidays.length).toBeGreaterThan(10);
    expect(data.events).toHaveLength(4);
    expect(data.events[0]).toHaveProperty('title');
    expect(data.events[0]).toHaveProperty('date');
    expect(data.events[0]).toHaveProperty('role');
    expect(data.events[0]).toHaveProperty('authorName');
  });

  it('filtra las evaluaciones por mes', async () => {
    const october = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({ year: YEAR, month: 10 }),
      200,
    );
    const november = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({ year: YEAR, month: 11 }),
      200,
    );

    expect(october).toHaveLength(1);
    expect(november).toHaveLength(3);
  });

  it('filtra por rol y normaliza alias en español', async () => {
    const students = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({ year: YEAR, role: 'STUDENT' }),
      200,
    );
    const teachers = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({ year: YEAR, role: 'profesor' }),
      200,
    );

    expect(students).toHaveLength(2);
    expect(teachers).toHaveLength(2);
    expect(students.every((event) => event.role === 'STUDENT')).toBe(true);
    expect(teachers.every((event) => event.role === 'TEACHER')).toBe(true);
  });

  it('filtra por rango de fechas y autor', async () => {
    const range = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({
        from: `${YEAR}-11-01`,
        to: `${YEAR}-11-15`,
      }),
      200,
    );
    expect(range).toHaveLength(2);

    const byAuthor = expectSuccess(
      await api.client.get('/api/v1/calendar/events').query({ authorName: 'Prof. Sebastián Moya' }),
      200,
    );
    expect(byAuthor).toHaveLength(1);
    expect(byAuthor[0].title).toBe('Prueba de Matemáticas');
  });

  it('crea una evaluación (201) visible para alumnos', async () => {
    const res = await api.client.post('/api/v1/calendar/events').send({
      title: 'Control de lectura',
      description: 'Capítulos 1 al 4.',
      date: `${YEAR}-12-15`,
      role: 'STUDENT',
      authorName: 'Prof. Valentina Ortega',
    });

    const data = expectSuccess(res, 201);
    expect(data).toMatchObject({
      title: 'Control de lectura',
      description: 'Capítulos 1 al 4.',
      date: `${YEAR}-12-15`,
      role: 'STUDENT',
      authorName: 'Prof. Valentina Ortega',
    });
    expect(data.id).toMatch(/^evt_/);
  });

  it('crea una evaluación usando el alias ALUMNO', async () => {
    const data = expectSuccess(
      await api.client.post('/api/v1/calendar/events').send({
        title: 'Disertación',
        date: `${YEAR}-12-16`,
        role: 'ALUMNO',
        authorName: 'Alumno Demo',
      }),
      201,
    );
    expect(data.role).toBe('STUDENT');
    expect(data.description).toBeNull();
  });

  it('obtiene, actualiza y elimina una evaluación', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/calendar/events').send({
        title: 'Original',
        date: `${YEAR}-12-01`,
        role: 'TEACHER',
        authorName: 'Prof. Demo',
      }),
      201,
    );

    const fetched = expectSuccess(
      await api.client.get(`/api/v1/calendar/events/${created.id}`),
      200,
    );
    expect(fetched.title).toBe('Original');

    const updated = expectSuccess(
      await api.client
        .patch(`/api/v1/calendar/events/${created.id}`)
        .send({ title: 'Actualizada', date: `${YEAR}-12-02` }),
      200,
    );
    expect(updated).toMatchObject({ title: 'Actualizada', date: `${YEAR}-12-02` });

    expect(
      expectSuccess(await api.client.delete(`/api/v1/calendar/events/${created.id}`), 200),
    ).toEqual({ id: created.id });
    expectError(await api.client.get(`/api/v1/calendar/events/${created.id}`), 404);
  });

  it.each([
    [{ date: `${YEAR}-01-10`, role: 'STUDENT', authorName: 'A' }, ['title']],
    [{ title: 'X', role: 'STUDENT', authorName: 'A' }, ['date']],
    [{ title: 'X', date: `${YEAR}-01-10`, authorName: 'A' }, ['role']],
    [{ title: 'X', date: `${YEAR}-01-10`, role: 'STUDENT' }, ['authorName']],
    [{ title: 'X', date: `${YEAR}-02-30`, role: 'STUDENT', authorName: 'A' }, ['date']],
    [{ title: 'X', date: '10-01-2026', role: 'STUDENT', authorName: 'A' }, ['date']],
    [{ title: 'X', date: `${YEAR}-01-10`, role: 'APODERADO', authorName: 'A' }, ['role']],
  ])('valida la creación de evaluaciones %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/calendar/events').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('exige al menos un campo al actualizar', async () => {
    const events = expectSuccess(await api.client.get('/api/v1/calendar/events'), 200);
    expectError(await api.client.patch(`/api/v1/calendar/events/${events[0].id}`).send({}), 422);
  });

  it('devuelve 404 para evaluaciones inexistentes', async () => {
    const id = 'evt_inexistente';
    expectError(await api.client.get(`/api/v1/calendar/events/${id}`), 404);
    expectError(await api.client.patch(`/api/v1/calendar/events/${id}`).send({ title: 'X' }), 404);
    expectError(await api.client.delete(`/api/v1/calendar/events/${id}`), 404);
  });
});
