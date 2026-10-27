import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

describe('API · módulo de calificación de profesores', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista los profesores ordenados por nombre con sus estadísticas', async () => {
    const res = await api.client.get('/api/v1/teachers');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(4);
    expect(data.items.map((teacher) => teacher.name)).toEqual([
      'Prof. Ana Pérez',
      'Prof. Sebastián Moya',
      'Prof. Tomás Villagrán',
      'Prof. Valentina Ortega',
    ]);

    const moya = data.items.find((teacher) => teacher.name === 'Prof. Sebastián Moya');
    expect(moya).toMatchObject({
      subject: 'Matemáticas',
      reviewCount: 2,
      totalPoints: 9,
      averageRating: 4.5,
    });

    const ortega = data.items.find((teacher) => teacher.name === 'Prof. Valentina Ortega');
    expect(ortega).toMatchObject({ reviewCount: 3, totalPoints: 14, averageRating: 4.7 });

    const perez = data.items.find((teacher) => teacher.name === 'Prof. Ana Pérez');
    expect(perez).toMatchObject({ reviewCount: 0, totalPoints: 0, averageRating: 0 });
  });

  it('filtra por asignatura y por texto', async () => {
    const bySubject = expectSuccess(
      await api.client.get('/api/v1/teachers').query({ subject: 'Matemáticas' }),
      200,
    );
    expect(bySubject.items).toHaveLength(1);

    const byQuery = expectSuccess(
      await api.client.get('/api/v1/teachers').query({ q: 'ortega' }),
      200,
    );
    expect(byQuery.items).toHaveLength(1);
    expect(byQuery.items[0].name).toBe('Prof. Valentina Ortega');
  });

  it('obtiene el detalle con reseñas y distribución de estrellas', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/teachers'));
    const moya = list.items.find((teacher) => teacher.name === 'Prof. Sebastián Moya');

    const data = expectSuccess(await api.client.get(`/api/v1/teachers/${moya.id}`), 200);

    expect(data.id).toBe(moya.id);
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews[0]).toHaveProperty('rating');
    expect(data.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  });

  it('crea un profesor (201) sin reseñas', async () => {
    const res = await api.client.post('/api/v1/teachers').send({
      name: 'Prof. Nuevo',
      subject: 'Filosofía',
    });
    const data = expectSuccess(res, 201);

    expect(data).toMatchObject({
      name: 'Prof. Nuevo',
      subject: 'Filosofía',
      reviewCount: 0,
      totalPoints: 0,
      averageRating: 0,
      reviews: [],
    });
    expect(data.id).toMatch(/^tch_/);
  });

  it('actualiza los datos de un profesor', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/teachers').send({ name: 'Prof. Editable' }),
      201,
    );

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/teachers/${created.id}`)
        .send({ name: 'Prof. Actualizado', subject: 'Arte' }),
      200,
    );
    expect(data).toMatchObject({ name: 'Prof. Actualizado', subject: 'Arte' });
  });

  it('agrega una reseña con estrellas y recalcula el promedio', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/teachers').send({ name: 'Prof. Reseñas' }),
      201,
    );

    const first = await api.client
      .post(`/api/v1/teachers/${created.id}/reviews`)
      .send({ studentName: 'Alumno 1', text: 'Muy buena clase', rating: 5 });
    const firstData = expectSuccess(first, 201);
    expect(firstData.review).toMatchObject({
      studentName: 'Alumno 1',
      text: 'Muy buena clase',
      rating: 5,
      evidenceUrl: null,
    });
    expect(firstData.teacher).toMatchObject({
      reviewCount: 1,
      totalPoints: 5,
      averageRating: 5,
    });

    const second = await api.client
      .post(`/api/v1/teachers/${created.id}/reviews`)
      .send({ studentName: 'Alumno 2', text: 'Regular', rating: 2 });
    const secondData = expectSuccess(second, 201);
    expect(secondData.teacher).toMatchObject({
      reviewCount: 2,
      totalPoints: 7,
      averageRating: 3.5,
    });
  });

  it('lista las reseñas de un profesor', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/teachers'));
    const ortega = list.items.find((teacher) => teacher.name === 'Prof. Valentina Ortega');

    const reviews = expectSuccess(
      await api.client.get(`/api/v1/teachers/${ortega.id}/reviews`),
      200,
    );
    expect(reviews).toHaveLength(3);
    expect(reviews.every((review) => review.teacherId === ortega.id)).toBe(true);
  });

  it('elimina una reseña y devuelve el profesor actualizado', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/teachers').send({ name: 'Prof. Borrar Reseña' }),
      201,
    );
    const added = expectSuccess(
      await api.client
        .post(`/api/v1/teachers/${created.id}/reviews`)
        .send({ studentName: 'Alumno', text: 'Comentario', rating: 4 }),
      201,
    );

    const teacher = expectSuccess(
      await api.client.delete(`/api/v1/teachers/${created.id}/reviews/${added.review.id}`),
      200,
    );
    expect(teacher.reviewCount).toBe(0);
    expect(teacher.reviews).toEqual([]);
  });

  it('elimina un profesor y sus reseñas en cascada', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/teachers').send({ name: 'Prof. Temporal' }),
      201,
    );
    const added = expectSuccess(
      await api.client
        .post(`/api/v1/teachers/${created.id}/reviews`)
        .send({ studentName: 'Alumno', text: 'Comentario', rating: 5 }),
      201,
    );

    expect(expectSuccess(await api.client.delete(`/api/v1/teachers/${created.id}`), 200)).toEqual({
      id: created.id,
    });
    expectError(await api.client.get(`/api/v1/teachers/${created.id}`), 404);
    expectError(
      await api.client.delete(`/api/v1/teachers/${created.id}/reviews/${added.review.id}`),
      404,
    );
  });

  it.each([
    [{ subject: 'X' }, ['name']],
    [{ name: 'Prof. Test', photoUrl: 'archivo.exe' }, ['photoUrl']],
  ])('valida la creación de profesores %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/teachers').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it.each([
    [{ text: 'x', rating: 3 }, ['studentName']],
    [{ studentName: 'x', rating: 3 }, ['text']],
    [{ studentName: 'x', text: 'y' }, ['rating']],
    [{ studentName: 'x', text: 'y', rating: 0 }, ['rating']],
    [{ studentName: 'x', text: 'y', rating: 6 }, ['rating']],
    [{ studentName: 'x', text: 'y', rating: 3.5 }, ['rating']],
    [{ studentName: 'x', text: 'y', rating: 'alta' }, ['rating']],
  ])('valida la creación de reseñas %#', async (payload, fields) => {
    const list = expectSuccess(await api.client.get('/api/v1/teachers'));
    const body = expectError(
      await api.client.post(`/api/v1/teachers/${list.items[0].id}/reviews`).send(payload),
      422,
    );
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('devuelve 404 para profesores y reseñas inexistentes', async () => {
    expectError(await api.client.get('/api/v1/teachers/tch_inexistente'), 404);
    expectError(await api.client.get('/api/v1/teachers/tch_inexistente/reviews'), 404);
    expectError(
      await api.client
        .post('/api/v1/teachers/tch_inexistente/reviews')
        .send({ studentName: 'x', text: 'y', rating: 5 }),
      404,
    );
    expectError(
      await api.client.patch('/api/v1/teachers/tch_inexistente').send({ name: 'x' }),
      404,
    );
    expectError(await api.client.delete('/api/v1/teachers/tch_inexistente'), 404);
    expectError(
      await api.client.delete('/api/v1/teachers/tch_inexistente/reviews/rev_inexistente'),
      404,
    );
  });
});
