import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intranerd-api-test-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tempDir, 'test.db');
process.env.UPLOAD_DIR = path.join(tempDir, 'uploads');
process.env.SEED_ON_START = 'false';
process.env.RATE_LIMIT_MAX = '0';

let server;
let base;
let closeDatabase;
let uploadDir;

before(async () => {
  const { initializeSchema } = await import('../src/db/connection.js');
  initializeSchema();
  const app = (await import('../src/app.js')).default;
  ({ closeDatabase } = await import('../src/db/connection.js'));
  const { env } = await import('../src/config/env.js');
  uploadDir = env.uploadDir;

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDatabase();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function api(pathname, { method = 'GET', body, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers:
      isForm || body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  return { status: response.status, body: json };
}

test('health y envoltura de error 404', async () => {
  const health = await api('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.success, true);
  assert.equal(health.body.data.status, 'ok');

  const missing = await api('/ruta-inexistente');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);
  assert.equal(missing.body.data, null);
  assert.match(missing.body.error, /no existe/i);
});

test('módulo de notas: asignaturas, semestres, promedio final y validación', async () => {
  const created = await api('/grades/subjects', {
    method: 'POST',
    body: { name: 'Física', studentName: 'Alumno Test', teacherName: 'Prof. Ana Pérez' },
  });
  assert.equal(created.status, 201);
  const subjectId = created.body.data.id;
  assert.equal(created.body.data.status, 'SIN_NOTAS');

  await api(`/grades/subjects/${subjectId}/grades`, {
    method: 'POST',
    body: { semester: 1, value: 6.5, label: 'Prueba 1' },
  });
  const second = await api(`/grades/subjects/${subjectId}/grades`, {
    method: 'POST',
    body: { semester: 2, value: 5.5 },
  });
  assert.equal(second.status, 201);
  assert.equal(second.body.data.subject.semesterAverages.semester1, 6.5);
  assert.equal(second.body.data.subject.semesterAverages.semester2, 5.5);
  assert.equal(second.body.data.subject.finalAverage, 6);
  assert.equal(second.body.data.subject.status, 'APROBADO');
  assert.equal(second.body.data.subject.approved, true);

  const invalid = await api(`/grades/subjects/${subjectId}/grades`, {
    method: 'POST',
    body: { semester: 3, value: 9 },
  });
  assert.equal(invalid.status, 422);
  assert.equal(invalid.body.success, false);
  assert.ok(invalid.body.details.length >= 2);

  const list = await api('/grades?studentName=Alumno%20Test');
  assert.equal(list.body.data.summary.subjectCount, 1);
  assert.equal(list.body.data.summary.generalAverage, 6);

  const removed = await api(`/grades/subjects/${subjectId}`, { method: 'DELETE' });
  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.id, subjectId);
});

test('personas extraviadas: creación con archivo, found y rechazo de MIME', async () => {
  const form = new FormData();
  form.append('name', 'Persona Test');
  form.append('age', '11');
  form.append('description', 'Polerón verde y mochila azul');
  form.append('lastSeenPlace', 'Gimnasio');
  form.append('contact', '+56 9 0000 0000');
  form.append(
    'photo',
    new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }),
    'foto.png',
  );

  const created = await api('/missing-persons', { method: 'POST', body: form });
  assert.equal(created.status, 201);
  assert.match(created.body.data.photoUrl, /^\/uploads\/.+\.png$/);
  assert.equal(created.body.data.status, 'MISSING');
  const id = created.body.data.id;

  const storedPath = path.join(uploadDir, path.basename(created.body.data.photoUrl));
  assert.ok(fs.existsSync(storedPath));

  const photoOnly = new FormData();
  photoOnly.append(
    'photo',
    new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }),
    'nueva.png',
  );
  const photoPatch = await api(`/missing-persons/${id}`, {
    method: 'PATCH',
    body: photoOnly,
  });
  assert.equal(photoPatch.status, 200);
  assert.match(photoPatch.body.data.photoUrl, /^\/uploads\/.+\.png$/);
  assert.notEqual(photoPatch.body.data.photoUrl, created.body.data.photoUrl);

  const found = await api(`/missing-persons/${id}/found`, {
    method: 'PATCH',
    body: { found: true },
  });
  assert.equal(found.body.data.status, 'FOUND');
  assert.ok(found.body.data.foundAt);

  const search = await api('/missing-persons?status=FOUND&q=Persona');
  assert.ok(search.body.data.items.some((item) => item.id === id));

  const badForm = new FormData();
  badForm.append('name', 'Archivo inválido');
  badForm.append('description', 'Prueba');
  badForm.append('lastSeenPlace', 'Patio');
  badForm.append('contact', 'Test');
  badForm.append('photo', new Blob(['no soy imagen'], { type: 'text/plain' }), 'nota.txt');
  const rejected = await api('/missing-persons', { method: 'POST', body: badForm });
  assert.equal(rejected.status, 422);
  assert.match(rejected.body.error, /Tipo de archivo no permitido/);

  const removed = await api(`/missing-persons/${id}`, { method: 'DELETE' });
  assert.equal(removed.status, 200);
});

test('profesores: CRUD de reseñas y promedio de estrellas', async () => {
  const teacher = await api('/teachers', {
    method: 'POST',
    body: { name: 'Prof. Test', subject: 'Química' },
  });
  assert.equal(teacher.status, 201);
  const id = teacher.body.data.id;
  assert.equal(teacher.body.data.reviewCount, 0);
  assert.equal(teacher.body.data.averageRating, 0);

  await api(`/teachers/${id}/reviews`, {
    method: 'POST',
    body: { studentName: 'Ana', text: 'Excelente', rating: 5 },
  });
  const second = await api(`/teachers/${id}/reviews`, {
    method: 'POST',
    body: { studentName: 'Luis', text: 'Buena', rating: 4 },
  });
  assert.equal(second.status, 201);
  assert.equal(second.body.data.teacher.reviewCount, 2);
  assert.equal(second.body.data.teacher.totalPoints, 9);
  assert.equal(second.body.data.teacher.averageRating, 4.5);

  const invalid = await api(`/teachers/${id}/reviews`, {
    method: 'POST',
    body: { studentName: 'Eva', text: 'Fuera de rango', rating: 6 },
  });
  assert.equal(invalid.status, 422);

  const detail = await api(`/teachers/${id}`);
  assert.equal(detail.body.data.reviews.length, 2);
  assert.equal(detail.body.data.ratingDistribution['5'], 1);
});

test('objetos perdidos: doble panel, filtro y cambio de estado', async () => {
  const found = await api('/lost-found', {
    method: 'POST',
    body: {
      type: 'found',
      reportedBy: 'María',
      contact: 'maria@test.cl',
      description: 'Mochila negra',
      location: 'Patio',
    },
  });
  assert.equal(found.status, 201);
  assert.equal(found.body.data.type, 'FOUND');

  const lost = await api('/lost-found', {
    method: 'POST',
    body: {
      type: 'lost',
      reportedBy: 'Juan',
      contact: 'juan@test.cl',
      description: 'Cuaderno rojo',
      location: 'Aula 5',
    },
  });
  assert.equal(lost.body.data.type, 'LOST');

  const list = await api('/lost-found?type=LOST');
  assert.ok(list.body.data.items.every((item) => item.type === 'LOST'));

  const claimed = await api(`/lost-found/${found.body.data.id}/status`, {
    method: 'PATCH',
    body: { status: 'claimed' },
  });
  assert.equal(claimed.body.data.status, 'CLAIMED');
});

test('calendario: eventos por rol y festivos calculados', async () => {
  const year = new Date().getFullYear();
  const created = await api('/calendar/events', {
    method: 'POST',
    body: {
      title: 'Prueba Test',
      description: 'Contenidos del período',
      date: `${year}-11-05`,
      role: 'profesor',
      authorName: 'Prof. Test',
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.role, 'TEACHER');

  const events = await api(`/calendar/events?year=${year}&role=TEACHER`);
  assert.ok(events.body.data.some((event) => event.id === created.body.data.id));

  const calendar = await api(`/calendar?year=${year}`);
  assert.equal(calendar.body.data.year, year);
  assert.ok(calendar.body.data.holidays.some((h) => h.date === `${year}-09-18`));
  assert.ok(calendar.body.data.holidays.some((h) => h.name === 'Viernes Santo'));

  const invalid = await api('/calendar/events', {
    method: 'POST',
    body: {
      title: 'Fecha imposible',
      date: `${year}-02-30`,
      role: 'alumno',
      authorName: 'Test',
    },
  });
  assert.equal(invalid.status, 422);
});

test('talleres: control de cupos y prevención de duplicados', async () => {
  const workshop = await api('/workshops', {
    method: 'POST',
    body: { name: 'Taller Test', capacity: 1, category: 'Ciencia' },
  });
  const id = workshop.body.data.id;
  assert.equal(workshop.body.data.availableSpots, 1);

  const first = await api(`/workshops/${id}/enrollments`, {
    method: 'POST',
    body: { studentName: 'Alumno Uno', studentEmail: 'uno@test.cl' },
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.data.workshop.isFull, true);
  assert.equal(first.body.data.workshop.availableSpots, 0);

  const full = await api(`/workshops/${id}/enrollments`, {
    method: 'POST',
    body: { studentName: 'Alumno Dos' },
  });
  assert.equal(full.status, 409);
  assert.match(full.body.error, /cupos/i);

  const shrink = await api(`/workshops/${id}`, {
    method: 'PATCH',
    body: { capacity: 0 },
  });
  assert.equal(shrink.status, 422);

  const available = await api('/workshops?available=true');
  assert.ok(!available.body.data.items.some((item) => item.id === id));
});

test('anuncios: fijado y orden del feed', async () => {
  const normal = await api('/announcements', {
    method: 'POST',
    body: { title: 'Normal', content: 'Contenido normal', authorName: 'Dirección' },
  });
  assert.equal(normal.status, 201);
  assert.equal(normal.body.data.category, 'GENERAL');
  assert.equal(normal.body.data.pinned, false);

  const pinned = await api('/announcements', {
    method: 'POST',
    body: {
      title: 'Urgente',
      content: 'Suspensión',
      category: 'suspension',
      authorName: 'Rectoría',
      pinned: true,
    },
  });
  assert.equal(pinned.body.data.category, 'SUSPENSION');
  assert.equal(pinned.body.data.pinned, true);

  const feed = await api('/announcements?limit=10');
  assert.equal(feed.body.data.items[0].id, pinned.body.data.id);

  const unpinned = await api(`/announcements/${pinned.body.data.id}/pin`, {
    method: 'PATCH',
    body: { pinned: false },
  });
  assert.equal(unpinned.body.data.pinned, false);
});

test('tareas: checklist por alumno y filtro de completadas', async () => {
  const task = await api('/tasks', {
    method: 'POST',
    body: {
      title: 'Tarea Test',
      subject: 'Física',
      dueDate: '2026-12-01',
      createdBy: 'Prof. Test',
    },
  });
  assert.equal(task.status, 201);
  const id = task.body.data.id;

  const done = await api(`/tasks/${id}/completion`, {
    method: 'PATCH',
    body: { studentName: 'Alumno Test', completed: true },
  });
  assert.equal(done.status, 200);
  assert.equal(done.body.data.completion.completed, true);
  assert.deepEqual(done.body.data.task.completedBy, ['Alumno Test']);

  const completedList = await api('/tasks?studentName=Alumno%20Test&completed=true');
  assert.ok(completedList.body.data.items.some((item) => item.id === id));
  assert.equal(completedList.body.data.items.find((item) => item.id === id).completed, true);

  const pendingList = await api('/tasks?studentName=Alumno%20Test&completed=false');
  assert.ok(!pendingList.body.data.items.some((item) => item.id === id));

  const invalidFilter = await api('/tasks?completed=true');
  assert.equal(invalidFilter.status, 422);

  const undone = await api(`/tasks/${id}/completion`, {
    method: 'PATCH',
    body: { studentName: 'Alumno Test', completed: false },
  });
  assert.equal(undone.body.data.completion.completed, false);
  assert.equal(undone.body.data.task.completedBy.length, 0);
});

test('el alias /api expone los mismos módulos que /api/v1', async () => {
  const root = base.replace('/api/v1', '/api');
  const response = await fetch(`${root}/health`);
  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(json.data.service, 'intranerd-api');
});
