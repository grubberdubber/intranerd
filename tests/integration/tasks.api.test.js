import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

const STUDENT = 'Alumno Demo';

function findTask(tasks, title) {
  const task = tasks.find((item) => item.title === title);
  if (!task) throw new Error(`No se encontró la tarea ${title}`);
  return task;
}

describe('API · módulo de tareas y checklist', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lista las tareas ordenadas por fecha de entrega', async () => {
    const res = await api.client.get('/api/v1/tasks');
    const data = expectSuccess(res, 200);

    expect(data.items).toHaveLength(4);
    expect(data.items.map((task) => task.subject)).toEqual([
      'Lenguaje',
      'Matemáticas',
      'Ciencias',
      'Historia',
    ]);
    expect(data.items.every((task) => task.completed === null)).toBe(true);
    expect(data.items.every((task) => Array.isArray(task.completedBy))).toBe(true);
  });

  it('marca el estado personal cuando se indica studentName', async () => {
    const data = expectSuccess(
      await api.client.get('/api/v1/tasks').query({ studentName: STUDENT }),
      200,
    );

    const algebra = findTask(data.items, 'Ejercicios de álgebra');
    const lectura = findTask(data.items, 'Leer capítulo 4 de "La ciudad y los perros"');

    expect(algebra.completed).toBe(true);
    expect(algebra.completedAt).toBeTruthy();
    expect(algebra.completedCount).toBe(1);
    expect(algebra.completedBy).toContain(STUDENT);

    expect(lectura.completed).toBe(false);
    expect(lectura.completedAt).toBeNull();
  });

  it('filtra por estado completado del alumno', async () => {
    const completed = expectSuccess(
      await api.client.get('/api/v1/tasks').query({ studentName: STUDENT, completed: true }),
      200,
    );
    expect(completed.items).toHaveLength(1);
    expect(completed.items[0].title).toBe('Ejercicios de álgebra');

    const pending = expectSuccess(
      await api.client.get('/api/v1/tasks').query({ studentName: STUDENT, completed: false }),
      200,
    );
    // Solo cuentan tareas con un registro explícito de completado = 0.
    expect(pending.items).toEqual([]);
  });

  it('exige studentName al filtrar por completado', async () => {
    const body = expectError(await api.client.get('/api/v1/tasks').query({ completed: true }), 422);
    expect(body.details.map((detail) => detail.field)).toContain('studentName');
  });

  it('filtra por asignatura y busca por texto', async () => {
    const bySubject = expectSuccess(
      await api.client.get('/api/v1/tasks').query({ subject: 'matemáticas' }),
      200,
    );
    expect(bySubject.items).toHaveLength(1);

    const byText = expectSuccess(
      await api.client.get('/api/v1/tasks').query({ q: 'laboratorio' }),
      200,
    );
    expect(byText.items).toHaveLength(1);
    expect(byText.items[0].subject).toBe('Ciencias');
  });

  it('obtiene el detalle con el listado de completados', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    const algebra = findTask(list.items, 'Ejercicios de álgebra');

    const data = expectSuccess(await api.client.get(`/api/v1/tasks/${algebra.id}`), 200);
    expect(data.completions).toHaveLength(1);
    expect(data.completions[0]).toMatchObject({
      studentName: STUDENT,
      completed: true,
    });
    expect(data.completedBy).toEqual([STUDENT]);
  });

  it('crea una tarea (201)', async () => {
    const res = await api.client.post('/api/v1/tasks').send({
      title: 'Nueva tarea',
      description: 'Descripción de la tarea',
      subject: 'Filosofía',
      dueDate: '2027-01-15',
      createdBy: 'Prof. Nueva',
    });
    const data = expectSuccess(res, 201);

    expect(data).toMatchObject({
      title: 'Nueva tarea',
      description: 'Descripción de la tarea',
      subject: 'Filosofía',
      dueDate: '2027-01-15',
      createdBy: 'Prof. Nueva',
    });
    expect(data.id).toMatch(/^tsk_/);
  });

  it('crea una tarea sin fecha de entrega', async () => {
    const data = expectSuccess(
      await api.client.post('/api/v1/tasks').send({
        title: 'Sin fecha',
        subject: 'Arte',
        createdBy: 'Prof. Demo',
      }),
      201,
    );
    expect(data.dueDate).toBeNull();
    expect(data.description).toBeNull();
  });

  it('actualiza una tarea', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/tasks').send({
        title: 'Original',
        subject: 'Arte',
        createdBy: 'Prof. Demo',
      }),
      201,
    );

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/tasks/${created.id}`)
        .send({ title: 'Actualizada', dueDate: '2027-02-01' }),
      200,
    );
    expect(data).toMatchObject({ title: 'Actualizada', dueDate: '2027-02-01' });
  });

  it('marca y desmarca una tarea en el checklist personal', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    const lectura = findTask(list.items, 'Leer capítulo 4 de "La ciudad y los perros"');

    const marked = expectSuccess(
      await api.client
        .patch(`/api/v1/tasks/${lectura.id}/completion`)
        .send({ studentName: STUDENT, completed: true }),
      200,
    );
    expect(marked.completion).toMatchObject({ studentName: STUDENT, completed: true });
    expect(marked.completion.completedAt).toBeTruthy();
    expect(marked.task.completedBy).toContain(STUDENT);

    const unmarked = expectSuccess(
      await api.client
        .patch(`/api/v1/tasks/${lectura.id}/completion`)
        .send({ studentName: STUDENT, completed: false }),
      200,
    );
    expect(unmarked.completion.completed).toBe(false);
    expect(unmarked.completion.completedAt).toBeNull();
  });

  it('completa por defecto al omitir el campo completed', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    const ciencias = findTask(list.items, 'Informe de laboratorio');

    const data = expectSuccess(
      await api.client
        .patch(`/api/v1/tasks/${ciencias.id}/completion`)
        .send({ studentName: 'Otro Alumno' }),
      200,
    );
    expect(data.completion.completed).toBe(true);
  });

  it('lista y elimina registros de completado', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    const ciencias = findTask(list.items, 'Informe de laboratorio');

    const completions = expectSuccess(
      await api.client.get(`/api/v1/tasks/${ciencias.id}/completions`),
      200,
    );
    expect(completions.map((completion) => completion.studentName)).toContain('Otro Alumno');

    const task = expectSuccess(
      await api.client.delete(
        `/api/v1/tasks/${ciencias.id}/completions/${encodeURIComponent('Otro Alumno')}`,
      ),
      200,
    );
    expect(task.completedBy).not.toContain('Otro Alumno');

    expectError(
      await api.client.delete(
        `/api/v1/tasks/${ciencias.id}/completions/${encodeURIComponent('Otro Alumno')}`,
      ),
      404,
    );
  });

  it('elimina una tarea y sus completados en cascada', async () => {
    const created = expectSuccess(
      await api.client.post('/api/v1/tasks').send({
        title: 'Temporal',
        subject: 'Arte',
        createdBy: 'Prof. Demo',
      }),
      201,
    );
    expectSuccess(
      await api.client
        .patch(`/api/v1/tasks/${created.id}/completion`)
        .send({ studentName: STUDENT, completed: true }),
      200,
    );

    expect(expectSuccess(await api.client.delete(`/api/v1/tasks/${created.id}`), 200)).toEqual({
      id: created.id,
    });
    expectError(await api.client.get(`/api/v1/tasks/${created.id}`), 404);
    expectError(await api.client.get(`/api/v1/tasks/${created.id}/completions`), 404);
  });

  it.each([
    [{ subject: 'X', createdBy: 'Y' }, ['title']],
    [{ title: 'X', createdBy: 'Y' }, ['subject']],
    [{ title: 'X', subject: 'Y' }, ['createdBy']],
    [{ title: 'X', subject: 'Y', createdBy: 'Z', dueDate: '2026-02-30' }, ['dueDate']],
  ])('valida la creación de tareas %#', async (payload, fields) => {
    const body = expectError(await api.client.post('/api/v1/tasks').send(payload), 422);
    expect(body.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(fields));
  });

  it('valida el registro de completado', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    expectError(
      await api.client.patch(`/api/v1/tasks/${list.items[0].id}/completion`).send({}),
      422,
    );
  });

  it('exige al menos un campo al actualizar', async () => {
    const list = expectSuccess(await api.client.get('/api/v1/tasks'));
    expectError(await api.client.patch(`/api/v1/tasks/${list.items[0].id}`).send({}), 422);
  });

  it('devuelve 404 para tareas inexistentes', async () => {
    const id = 'tsk_inexistente';
    expectError(await api.client.get(`/api/v1/tasks/${id}`), 404);
    expectError(await api.client.patch(`/api/v1/tasks/${id}`).send({ title: 'X' }), 404);
    expectError(await api.client.delete(`/api/v1/tasks/${id}`), 404);
    expectError(await api.client.get(`/api/v1/tasks/${id}/completions`), 404);
    expectError(
      await api.client
        .patch(`/api/v1/tasks/${id}/completion`)
        .send({ studentName: STUDENT, completed: true }),
      404,
    );
    expectError(await api.client.delete(`/api/v1/tasks/${id}/completions/${STUDENT}`), 404);
  });
});
