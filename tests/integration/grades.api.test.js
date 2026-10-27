import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

const STUDENT = 'Alumno Demo';

/** Localiza una asignatura del seed por nombre. */
function subjectByName(subjects, name) {
  const subject = subjects.find((item) => item.name === name);
  if (!subject) throw new Error(`No se encontró la asignatura ${name}`);
  return subject;
}

describe('API · módulo de notas (semestral)', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista las asignaturas del alumno con promedios y estado', async () => {
    const res = await api.client.get('/api/v1/grades').query({ studentName: STUDENT });
    const data = expectSuccess(res, 200);

    expect(data.studentName).toBe(STUDENT);
    expect(data.subjects).toHaveLength(5);
    expect(data.summary).toMatchObject({
      subjectCount: 5,
      gradedSubjectCount: 4,
      approvedCount: 4,
      failedCount: 0,
      pendingCount: 1,
      generalAverage: 5.7,
      passingGrade: 4,
    });
  });

  it('calcula el promedio semestral y final de cada asignatura', async () => {
    const data = expectSuccess(
      await api.client.get('/api/v1/grades').query({ studentName: STUDENT }),
      200,
    );

    const matematicas = subjectByName(data.subjects, 'Matemáticas');
    expect(matematicas.semesterAverages).toEqual({ semester1: 6.2, semester2: 6.2 });
    expect(matematicas.finalAverage).toBe(6.2);
    expect(matematicas.approved).toBe(true);
    expect(matematicas.status).toBe('APROBADO');
    expect(matematicas.grades.semester1).toHaveLength(3);
    expect(matematicas.grades.semester2).toHaveLength(2);

    const ingles = subjectByName(data.subjects, 'Inglés');
    expect(ingles.finalAverage).toBeNull();
    expect(ingles.approved).toBeNull();
    expect(ingles.status).toBe('SIN_NOTAS');
  });

  it('filtra por alumno y devuelve una lista vacía si no existe', async () => {
    const res = await api.client.get('/api/v1/grades').query({ studentName: 'Nadie' });
    const data = expectSuccess(res, 200);

    expect(data.subjects).toEqual([]);
    expect(data.summary.generalAverage).toBeNull();
    expect(data.summary.subjectCount).toBe(0);
  });

  it('crea una asignatura (201) con promedio pendiente', async () => {
    const res = await api.client.post('/api/v1/grades/subjects').send({
      name: 'Filosofía',
      studentName: STUDENT,
      teacherName: 'Prof. Nueva',
      color: '#123ABC',
    });

    const subject = expectSuccess(res, 201);
    expect(subject).toMatchObject({
      name: 'Filosofía',
      studentName: STUDENT,
      teacherName: 'Prof. Nueva',
      color: '#123ABC',
      finalAverage: null,
      approved: null,
      status: 'SIN_NOTAS',
    });
    expect(subject.id).toMatch(/^sub_/);
  });

  it('agrega notas a ambos semestres y recalcula el resumen', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/grades/subjects').send({
        name: 'Música',
        studentName: STUDENT,
      }),
      201,
    );

    const first = await api.client
      .post(`/api/v1/grades/subjects/${created.id}/grades`)
      .send({ semester: 1, value: 6.0, label: 'Prueba 1' });
    const firstData = expectSuccess(first, 201);
    expect(firstData.grade).toMatchObject({ semester: 1, value: 6, label: 'Prueba 1' });
    expect(firstData.subject.semesterAverages.semester1).toBe(6);

    const second = await api.client
      .post(`/api/v1/grades/subjects/${created.id}/grades`)
      .send({ semester: 2, value: 5.0 });
    const secondData = expectSuccess(second, 201);

    expect(secondData.grade.semester).toBe(2);
    expect(secondData.subject.semesterAverages).toEqual({
      semester1: 6,
      semester2: 5,
    });
    expect(secondData.subject.finalAverage).toBe(5.5);
    expect(secondData.subject.approved).toBe(true);
  });

  it('actualiza una nota y recalcula el promedio', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/grades/subjects').send({ name: 'Arte', studentName: STUDENT }),
      201,
    );
    const added = expectSuccess(
      await api.client
        .post(`/api/v1/grades/subjects/${created.id}/grades`)
        .send({ semester: 1, value: 3.5 }),
      201,
    );

    const res = await api.client
      .patch(`/api/v1/grades/entries/${added.grade.id}`)
      .send({ value: 6.5 });
    const data = expectSuccess(res, 200);

    expect(data.grade.value).toBe(6.5);
    expect(data.subject.finalAverage).toBe(6.5);
    expect(data.subject.approved).toBe(true);
  });

  it('elimina una nota y devuelve la asignatura actualizada', async () => {
    const created = expectSuccess(
      await api.client
        .post('/api/v1/grades/subjects')
        .send({ name: 'Tecnología', studentName: STUDENT }),
      201,
    );
    const added = expectSuccess(
      await api.client
        .post(`/api/v1/grades/subjects/${created.id}/grades`)
        .send({ semester: 2, value: 5.8 }),
      201,
    );

    const res = await api.client.delete(`/api/v1/grades/entries/${added.grade.id}`);
    const data = expectSuccess(res, 200);

    expect(data.deletedGradeId).toBe(added.grade.id);
    expect(data.subject.finalAverage).toBeNull();
  });

  it('actualiza una asignatura', async () => {
    const subject = expectSuccess(
      await api.client
        .post('/api/v1/grades/subjects')
        .send({ name: 'Ed. Física', studentName: STUDENT }),
      201,
    );

    const res = await api.client
      .patch(`/api/v1/grades/subjects/${subject.id}`)
      .send({ name: 'Educación Física', teacherName: 'Prof. Deporte' });
    const data = expectSuccess(res, 200);

    expect(data.name).toBe('Educación Física');
    expect(data.teacherName).toBe('Prof. Deporte');
  });

  it('elimina una asignatura y sus notas en cascada', async () => {
    const subject = expectSuccess(
      await api.client
        .post('/api/v1/grades/subjects')
        .send({ name: 'Temporal', studentName: STUDENT }),
      201,
    );
    const added = expectSuccess(
      await api.client
        .post(`/api/v1/grades/subjects/${subject.id}/grades`)
        .send({ semester: 1, value: 6 }),
      201,
    );

    const res = await api.client.delete(`/api/v1/grades/subjects/${subject.id}`);
    expect(expectSuccess(res, 200)).toEqual({ id: subject.id });

    expectError(await api.client.get(`/api/v1/grades/subjects/${subject.id}`), 404);
    expectError(
      await api.client.patch(`/api/v1/grades/entries/${added.grade.id}`).send({ value: 5 }),
      404,
    );
  });

  it('obtiene el detalle de una asignatura', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/grades'));
    const subject = subjectByName(list.subjects, 'Lenguaje');

    const res = await api.client.get(`/api/v1/grades/subjects/${subject.id}`);
    const data = expectSuccess(res, 200);

    expect(data.id).toBe(subject.id);
    expect(data.finalAverage).toBe(5.9);
    expect(data.grades.semester1).toHaveLength(2);
  });

  it.each([
    [{ studentName: STUDENT }, ['name']],
    [{ name: 'X' }, ['studentName']],
    [{ name: '   ', studentName: STUDENT }, ['name']],
    [{ name: 'X', studentName: STUDENT, color: 'azul' }, ['color']],
  ])('valida la creación de asignatura %#', async (payload, fields) => {
    const res = await api.client.post('/api/v1/grades/subjects').send(payload);
    const body = expectError(res, 422);

    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it.each([
    [{ semester: 1, value: 0.5 }],
    [{ semester: 1, value: 7.1 }],
    [{ semester: 3, value: 5 }],
    [{ semester: 1, value: 'abc' }],
    [{ value: 5 }],
  ])('rechaza una nota inválida %#', async (payload) => {
    const list = expectSuccess(await api.client.get('/api/v1/grades'));
    const subject = list.subjects[0];

    const res = await api.client.post(`/api/v1/grades/subjects/${subject.id}/grades`).send(payload);
    expectError(res, 422);
  });

  it('exige al menos un campo en la actualización', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/grades'));
    const res = await api.client.patch(`/api/v1/grades/subjects/${list.subjects[0].id}`).send({});
    expectError(res, 422);
  });

  it('devuelve 404 para asignaturas y notas inexistentes', async () => {
    expectError(await api.client.get('/api/v1/grades/subjects/sub_inexistente'), 404);
    expectError(
      await api.client.patch('/api/v1/grades/subjects/sub_inexistente').send({ name: 'X' }),
      404,
    );
    expectError(
      await api.client.post('/api/v1/grades/subjects/sub_inexistente/grades').send({
        semester: 1,
        value: 5,
      }),
      404,
    );
    expectError(await api.client.delete('/api/v1/grades/subjects/sub_inexistente'), 404);
    expectError(
      await api.client.patch('/api/v1/grades/entries/grd_inexistente').send({ value: 5 }),
      404,
    );
    expectError(await api.client.delete('/api/v1/grades/entries/grd_inexistente'), 404);
  });
});
