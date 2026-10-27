import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser, jsonResponse } from './helpers/fake-browser.js';

/**
 * Pruebas de los adaptadores SPA ↔ API.
 *
 * La API usa estados en mayúsculas, subrecursos (notas, reseñas, inscripciones)
 * y nombres distintos a los del modelo local. Estas pruebas fijan esa
 * traducción sin depender de un servidor real.
 */

let browser;

function installFetch(handler) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const path = String(url).replace(/^\/api/, '');
    let body = options.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }
    const result = await handler({ method, path, body, options });
    return jsonResponse(result.body ?? { success: true, data: null, error: null }, {
      ok: result.ok !== false,
      status: result.status ?? 200,
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function loadResources() {
  vi.resetModules();
  return import('../../src/services/resources.js');
}

function callsMatching(fetchMock, method, fragment) {
  return fetchMock.mock.calls.filter(([url, options = {}]) => {
    const callMethod = (options.method || 'GET').toUpperCase();
    return callMethod === method && String(url).includes(fragment);
  });
}

describe('services/resources · adaptadores de la API', () => {
  beforeEach(() => {
    browser = installFakeBrowser();
  });

  afterEach(() => {
    browser.restore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('traduce asignaturas y sincroniza sus notas', async () => {
    const summary = {
      id: 'sub1',
      name: 'Matemáticas',
      grades: { semester1: [{ id: 'g1', value: 6 }], semester2: [] },
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method, path }) => {
      if (method === 'GET' && path === '/grades?limit=100') {
        return { body: { success: true, data: { subjects: [summary] } } };
      }
      if (method === 'POST' && path === '/grades/subjects') {
        return { status: 201, body: { success: true, data: { id: 'sub2', name: 'Física' } } };
      }
      if (method === 'GET' && path.startsWith('/grades/subjects/')) {
        return { body: { success: true, data: summary } };
      }
      return { body: { success: true, data: {} } };
    });

    const { subjectsRepo } = await loadResources();

    await expect(subjectsRepo.list()).resolves.toEqual([
      expect.objectContaining({ id: 'sub1', semester1: [6], semester2: [] }),
    ]);

    const created = await subjectsRepo.create({
      name: 'Física',
      semester1: [5.5],
      semester2: [6],
    });
    expect(created).toMatchObject({ id: 'sub1', semester1: [6] });
    expect(callsMatching(fetchMock, 'POST', '/grades/subjects/sub2/grades')).toHaveLength(2);

    await subjectsRepo.update('sub1', { name: 'Matemática', semester1: [7], semester2: [] });
    expect(callsMatching(fetchMock, 'DELETE', '/grades/entries/g1')).toHaveLength(1);
    expect(callsMatching(fetchMock, 'POST', '/grades/subjects/sub1/grades')).toHaveLength(1);

    await subjectsRepo.remove('sub1');
    expect(callsMatching(fetchMock, 'DELETE', '/grades/subjects/sub1')).toHaveLength(1);
  });

  it('traduce personas extraviadas y acepta fotos como multipart', async () => {
    const person = {
      id: 'msp1',
      name: 'Sofía',
      age: 13,
      description: 'Polerón azul',
      lastSeenPlace: 'Patio',
      contact: '123',
      photoUrl: '/uploads/foto.jpg',
      exampleImageUrl: '/assets/items/other.svg',
      status: 'MISSING',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method, path }) => {
      if (method === 'GET' && path.startsWith('/missing-persons?')) {
        return { body: { success: true, data: { items: [person] } } };
      }
      if (method === 'PATCH') {
        return { body: { success: true, data: { ...person, status: 'FOUND' } } };
      }
      return { status: 201, body: { success: true, data: person } };
    });

    const { missingRepo } = await loadResources();

    const [item] = await missingRepo.list();
    expect(item).toMatchObject({
      desc: 'Polerón azul',
      place: 'Patio',
      found: false,
      photo: '/uploads/foto.jpg',
    });

    const created = await missingRepo.create({
      name: 'Sofía',
      desc: 'Polerón azul',
      place: 'Patio',
      contact: '123',
      photo: 'data:image/png;base64,aGVsbG8=',
      exampleImg: 'assets/items/other.svg',
    });
    expect(created.id).toBe('msp1');
    expect(callsMatching(fetchMock, 'POST', '/missing-persons')[0][0]).toBe('/api/missing-persons');

    const updated = await missingRepo.update('msp1', { found: true });
    expect(updated.found).toBe(true);
    expect(callsMatching(fetchMock, 'PATCH', '/missing-persons/msp1')[0][1].body).toBe(
      JSON.stringify({ status: 'FOUND' }),
    );

    await missingRepo.remove('msp1');
    expect(callsMatching(fetchMock, 'DELETE', '/missing-persons/msp1')).toHaveLength(1);
  });

  it('traduce profesores y publica reseñas como subrecurso', async () => {
    const teacher = {
      id: 't1',
      name: 'Prof. Ana',
      subject: 'Física',
      photoUrl: null,
      reviews: [{ id: 'r1', studentName: 'Camila', text: 'Muy clara', rating: 5 }],
    };

    const fetchMock = installFetch(({ method, path }) => {
      if (method === 'GET' && path === '/teachers?limit=100') {
        return { body: { success: true, data: { items: [teacher] } } };
      }
      if (method === 'GET' && path === '/teachers/t1') {
        return { body: { success: true, data: teacher } };
      }
      if (method === 'POST' && path === '/teachers') {
        return { status: 201, body: { success: true, data: { ...teacher, reviews: [] } } };
      }
      return { body: { success: true, data: teacher } };
    });

    const { teachersRepo } = await loadResources();

    const [listed] = await teachersRepo.list();
    expect(listed.reviews[0]).toMatchObject({ student: 'Camila', text: 'Muy clara' });

    const created = await teachersRepo.create({ name: 'Prof. Ana', subject: 'Física' });
    expect(created).toMatchObject({ name: 'Prof. Ana', reviews: [] });

    await teachersRepo.update('t1', {
      reviews: [
        ...teacher.reviews.map((review) => ({ id: 'r1' })),
        { id: 'r2', student: 'Leo', text: 'Bien', rating: 4 },
      ],
    });
    expect(callsMatching(fetchMock, 'POST', '/teachers/t1/reviews')).toHaveLength(1);

    await teachersRepo.remove('t1');
    expect(callsMatching(fetchMock, 'DELETE', '/teachers/t1')).toHaveLength(1);
  });

  it('traduce objetos perdidos y su estado', async () => {
    const item = {
      id: 'lfi1',
      type: 'FOUND',
      reportedBy: 'María',
      contact: '123',
      description: 'Mochila negra',
      location: 'Patio',
      category: 'mochila',
      photoUrl: null,
      exampleImageUrl: '/assets/items/backpack.svg',
      status: 'OPEN',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method }) => {
      if (method === 'GET') {
        return { body: { success: true, data: { items: [item] } } };
      }
      if (method === 'PATCH') {
        return { body: { success: true, data: { ...item, status: 'RETURNED' } } };
      }
      return { status: 201, body: { success: true, data: item } };
    });

    const { foundRepo } = await loadResources();

    const [listed] = await foundRepo.list();
    expect(listed).toMatchObject({
      desc: 'Mochila negra',
      by: 'María',
      place: 'Patio',
      resolved: false,
    });

    const created = await foundRepo.create({
      desc: 'Mochila negra',
      by: 'María',
      contact: '123',
      place: 'Patio',
      category: 'mochila',
      image: 'assets/items/backpack.svg',
    });
    expect(created.id).toBe('lfi1');

    const updated = await foundRepo.update('lfi1', { resolved: true });
    expect(updated.resolved).toBe(true);

    await foundRepo.remove('lfi1');
    expect(callsMatching(fetchMock, 'DELETE', '/lost-found/lfi1')).toHaveLength(1);
  });

  it('traduce eventos del calendario', async () => {
    const event = {
      id: 'evt1',
      title: 'Prueba',
      description: 'Unidad 1',
      subject: 'Matemáticas',
      date: '2026-11-05',
      role: 'TEACHER',
      authorName: 'Prof. Ana',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method }) => {
      if (method === 'GET') return { body: { success: true, data: [event] } };
      return { body: { success: true, data: event } };
    });

    const { calendarRepo } = await loadResources();

    const [listed] = await calendarRepo.list();
    expect(listed).toMatchObject({ role: 'profesor', author: 'Prof. Ana', subject: 'Matemáticas' });

    await calendarRepo.create({
      title: 'Prueba',
      description: 'Unidad 1',
      subject: 'Matemáticas',
      date: '2026-11-05',
      role: 'profesor',
      author: 'Prof. Ana',
    });
    const createCall = callsMatching(fetchMock, 'POST', '/calendar/events')[0];
    expect(JSON.parse(createCall[1].body)).toMatchObject({
      role: 'TEACHER',
      authorName: 'Prof. Ana',
    });

    await calendarRepo.update('evt1', { title: 'Prueba 2' });
    await calendarRepo.remove('evt1');
    expect(callsMatching(fetchMock, 'PATCH', '/calendar/events/evt1')).toHaveLength(1);
    expect(callsMatching(fetchMock, 'DELETE', '/calendar/events/evt1')).toHaveLength(1);
  });

  it('traduce talleres e inscripciones', async () => {
    const workshop = {
      id: 'w1',
      name: 'Robótica',
      description: 'Arduino',
      category: 'programacion',
      schedule: 'Lunes',
      location: 'Lab',
      teacherName: 'Prof. Ana',
      capacity: 10,
      enrollments: [{ id: 'e1', studentName: 'Leo', course: '1A', studentEmail: null }],
    };

    const fetchMock = installFetch(({ method, path }) => {
      if (method === 'GET' && path.startsWith('/workshops?')) {
        return { body: { success: true, data: { items: [workshop] } } };
      }
      if (method === 'GET' && path === '/workshops/w1') {
        return { body: { success: true, data: workshop } };
      }
      if (method === 'POST' && path === '/workshops') {
        return { status: 201, body: { success: true, data: workshop } };
      }
      return { body: { success: true, data: workshop } };
    });

    const { workshopsRepo } = await loadResources();

    const [listed] = await workshopsRepo.list();
    expect(listed).toMatchObject({
      teacher: 'Prof. Ana',
      enrollments: [{ name: 'Leo', course: '1A' }],
    });

    const created = await workshopsRepo.create({
      name: 'Robótica',
      teacher: 'Prof. Ana',
      capacity: 10,
      description: 'Arduino',
      category: 'programacion',
      schedule: 'Lunes',
      location: 'Lab',
    });
    expect(created.id).toBe('w1');

    await workshopsRepo.update('w1', {
      enrollments: [{ id: 'e2', name: 'Nueva', course: '2B' }],
      name: 'Robótica 2',
    });
    expect(callsMatching(fetchMock, 'DELETE', '/workshops/w1/enrollments/e1')).toHaveLength(1);
    expect(callsMatching(fetchMock, 'POST', '/workshops/w1/enrollments')).toHaveLength(1);
    expect(callsMatching(fetchMock, 'PATCH', '/workshops/w1')).toHaveLength(1);

    await workshopsRepo.remove('w1');
    expect(
      fetchMock.mock.calls.filter(
        ([url, options = {}]) => options.method === 'DELETE' && url === '/api/workshops/w1',
      ),
    ).toHaveLength(1);
  });

  it('traduce comunicados y su estado fijado', async () => {
    const post = {
      id: 'ann1',
      title: 'Suspensión',
      content: 'No hay clases',
      category: 'URGENT',
      authorName: 'Dirección',
      authorRole: 'DIRECTION',
      pinned: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method }) => {
      if (method === 'GET') {
        return { body: { success: true, data: { items: [post] } } };
      }
      return { body: { success: true, data: { ...post, pinned: true } } };
    });

    const { announcementsRepo } = await loadResources();

    const [listed] = await announcementsRepo.list();
    expect(listed).toMatchObject({
      body: 'No hay clases',
      author: 'Dirección',
      category: 'urgente',
      role: 'direccion',
    });

    await announcementsRepo.create({
      title: 'Suspensión',
      body: 'No hay clases',
      author: 'Dirección',
      role: 'direccion',
      category: 'urgente',
      pinned: true,
    });
    const createCall = callsMatching(fetchMock, 'POST', '/announcements')[0];
    expect(JSON.parse(createCall[1].body)).toMatchObject({
      content: 'No hay clases',
      authorName: 'Dirección',
      authorRole: 'DIRECTION',
      category: 'URGENT',
    });

    const updated = await announcementsRepo.update('ann1', { pinned: true });
    expect(updated.pinned).toBe(true);

    await announcementsRepo.remove('ann1');
    expect(callsMatching(fetchMock, 'DELETE', '/announcements/ann1')).toHaveLength(1);
  });

  it('traduce tareas y el checklist personal', async () => {
    const task = {
      id: 't1',
      title: 'Leer',
      description: 'Capítulo 3',
      subject: 'Historia',
      priority: 'alta',
      dueDate: '2030-01-15',
      createdBy: 'Prof. Ana',
      completed: false,
      completedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = installFetch(({ method, path }) => {
      if (method === 'GET') {
        return { body: { success: true, data: { items: [task] } } };
      }
      if (method === 'PATCH' && path === '/tasks/t1/completion') {
        return { body: { success: true, data: { task: { ...task, completed: true } } } };
      }
      if (method === 'POST') {
        return { status: 201, body: { success: true, data: task } };
      }
      return { body: { success: true, data: task } };
    });

    const { tasksRepo } = await loadResources();

    const [listed] = await tasksRepo.list();
    expect(listed).toMatchObject({ author: 'Prof. Ana', priority: 'alta', completed: false });

    const created = await tasksRepo.create({
      title: 'Leer',
      description: 'Capítulo 3',
      subject: 'Historia',
      priority: 'alta',
      dueDate: '2030-01-15',
      author: 'Prof. Ana',
    });
    expect(created).toMatchObject({ author: 'Prof. Ana', completed: false });

    const updated = await tasksRepo.update('t1', { completed: true });
    expect(updated.completed).toBe(true);
    expect(callsMatching(fetchMock, 'PATCH', '/tasks/t1/completion')).toHaveLength(1);

    await tasksRepo.remove('t1');
    expect(callsMatching(fetchMock, 'DELETE', '/tasks/t1')).toHaveLength(1);
  });
});
