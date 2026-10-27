import { createResource } from './api.js';
import { getProfile } from './session.js';
import { STORAGE_KEYS } from '../data/constants.js';
import {
  seedAnnouncements,
  seedCalendar,
  seedFound,
  seedLost,
  seedMissing,
  seedSubjects,
  seedTasks,
  seedTeachers,
  seedWorkshops,
} from '../data/seeds.js';

/**
 * Repositorios de cada módulo. Las vistas solo conocen esta interfaz:
 * list(), create(), update(), remove(). El adaptador (API o localStorage)
 * queda encapsulado en services/api.js.
 *
 * La API usa un modelo normalizado (notas y reseñas como subrecursos, estados
 * en mayúsculas, etc.). Los `adapters` traducen ese contrato al modelo plano
 * que consumen las vistas, de modo que ambos modos compartan la misma UI.
 */

const asArray = (value) => (Array.isArray(value) ? value : []);
const unwrap = (response) => response?.data ?? response;

function itemsFrom(response) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  return asArray(payload?.items);
}

function withSlash(value) {
  if (!value || typeof value !== 'string') return value;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:')) {
    return value;
  }
  return `/${value}`;
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

/* -------------------------------------------------------------------------- */
/* 1 · Notas y asignaturas                                                    */
/* -------------------------------------------------------------------------- */

function mapSubject(subject) {
  return {
    id: subject.id,
    name: subject.name,
    semester1: asArray(subject.grades?.semester1).map((grade) => grade.value),
    semester2: asArray(subject.grades?.semester2).map((grade) => grade.value),
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

async function fetchSubject(http, id) {
  const data = unwrap(await http.get(`/grades/subjects/${encodeURIComponent(id)}`));
  return mapSubject(data);
}

async function addSubjectGrades(http, subjectId, semester, values) {
  for (const value of values) {
    await http.post(`/grades/subjects/${encodeURIComponent(subjectId)}/grades`, {
      semester,
      value,
    });
  }
}

async function syncSubjectSemester(http, subjectId, semester, current, desired) {
  const same =
    current.length === desired.length &&
    current.every((value, index) => Number(value) === Number(desired[index]));
  if (same) return;

  const summary = unwrap(await http.get(`/grades/subjects/${encodeURIComponent(subjectId)}`));
  const grades = asArray(summary.grades?.[`semester${semester}`]);

  for (const grade of grades) {
    await http.delete(`/grades/entries/${encodeURIComponent(grade.id)}`);
  }
  await addSubjectGrades(http, subjectId, semester, desired);
}

export const subjectsRepo = createResource({
  name: 'subject',
  endpoint: '/grades/subjects',
  storageKey: STORAGE_KEYS.subjects,
  seed: seedSubjects,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/grades?limit=100'));
      return asArray(data?.subjects).map(mapSubject);
    },
    async createRemote(http, payload) {
      const studentName = getProfile().name || 'Alumno';
      const data = unwrap(
        await http.post('/grades/subjects', {
          name: payload.name,
          studentName,
        }),
      );
      const semesters = [
        [1, asArray(payload.semester1)],
        [2, asArray(payload.semester2)],
      ];
      for (const [semester, values] of semesters) {
        await addSubjectGrades(http, data.id, semester, values);
      }
      return fetchSubject(http, data.id);
    },
    async updateRemote(http, id, patch) {
      if (patch.name !== undefined) {
        await http.patch(`/grades/subjects/${encodeURIComponent(id)}`, { name: patch.name });
      }

      const current = await fetchSubject(http, id);
      await syncSubjectSemester(
        http,
        id,
        1,
        current.semester1,
        asArray(patch.semester1 ?? current.semester1),
      );
      await syncSubjectSemester(
        http,
        id,
        2,
        current.semester2,
        asArray(patch.semester2 ?? current.semester2),
      );

      return fetchSubject(http, id);
    },
    removeRemote(http, id) {
      return http.delete(`/grades/subjects/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 2 · Personas extraviadas                                                   */
/* -------------------------------------------------------------------------- */

function mapMissing(person) {
  return {
    id: person.id,
    name: person.name,
    age: person.age ?? null,
    desc: person.description,
    place: person.lastSeenPlace,
    contact: person.contact,
    photo: person.photoUrl,
    exampleImg: person.exampleImageUrl,
    found: person.status === 'FOUND',
    foundAt: person.foundAt ?? null,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}

function missingFields(payload) {
  const fields = {};
  if (payload.name !== undefined) fields.name = payload.name;
  if (payload.desc !== undefined) fields.description = payload.desc;
  if (payload.place !== undefined) fields.lastSeenPlace = payload.place;
  if (payload.contact !== undefined) fields.contact = payload.contact;
  if (payload.exampleImg) fields.exampleImageUrl = withSlash(payload.exampleImg);
  if (payload.age !== undefined && payload.age !== null && payload.age !== '') {
    fields.age = payload.age;
  }
  if (payload.found !== undefined) fields.status = payload.found ? 'FOUND' : 'MISSING';
  return fields;
}

export const missingRepo = createResource({
  name: 'missing',
  endpoint: '/missing-persons',
  storageKey: STORAGE_KEYS.missing,
  seed: seedMissing,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/missing-persons?limit=100'));
      return asArray(data?.items).map(mapMissing);
    },
    async createRemote(http, payload) {
      const fields = missingFields(payload);
      const response = isDataUrl(payload.photo)
        ? await http.postForm('/missing-persons', { fields, files: { photo: payload.photo } })
        : await http.post('/missing-persons', {
            ...fields,
            ...(withSlash(payload.photo) ? { photoUrl: withSlash(payload.photo) } : {}),
          });
      return mapMissing(unwrap(response));
    },
    async updateRemote(http, id, patch) {
      const fields = missingFields(patch);
      const response = await http.patch(`/missing-persons/${encodeURIComponent(id)}`, fields);
      return mapMissing(unwrap(response));
    },
    removeRemote(http, id) {
      return http.delete(`/missing-persons/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 3 · Profesores y opiniones                                                 */
/* -------------------------------------------------------------------------- */

function mapReview(review) {
  return {
    id: review.id,
    student: review.studentName,
    text: review.text ?? review.content,
    rating: review.rating,
    evidence: review.evidenceUrl,
    createdAt: review.createdAt,
  };
}

function mapTeacher(teacher) {
  return {
    id: teacher.id,
    name: teacher.name,
    subject: teacher.subject || '',
    photo: teacher.photoUrl,
    reviews: asArray(teacher.reviews).map(mapReview),
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}

async function fetchTeacher(http, id) {
  const data = unwrap(await http.get(`/teachers/${encodeURIComponent(id)}`));
  return mapTeacher(data);
}

async function addTeacherReview(http, teacherId, review) {
  const fields = {
    studentName: review.student,
    text: review.text,
    rating: review.rating,
  };
  if (isDataUrl(review.evidence)) {
    await http.postForm(`/teachers/${encodeURIComponent(teacherId)}/reviews`, {
      fields,
      files: { evidence: review.evidence },
    });
    return;
  }
  await http.post(`/teachers/${encodeURIComponent(teacherId)}/reviews`, {
    ...fields,
    ...(withSlash(review.evidence) ? { evidenceUrl: withSlash(review.evidence) } : {}),
  });
}

export const teachersRepo = createResource({
  name: 'teacher',
  endpoint: '/teachers',
  storageKey: STORAGE_KEYS.teachers,
  seed: seedTeachers,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/teachers?limit=100'));
      const items = asArray(data?.items);
      return Promise.all(
        items.map(async (teacher) => {
          try {
            return await fetchTeacher(http, teacher.id);
          } catch {
            return mapTeacher({ ...teacher, reviews: [] });
          }
        }),
      );
    },
    async createRemote(http, payload) {
      const fields = { name: payload.name, subject: payload.subject };
      const response = isDataUrl(payload.photo)
        ? await http.postForm('/teachers', { fields, files: { photo: payload.photo } })
        : await http.post('/teachers', {
            ...fields,
            ...(withSlash(payload.photo) ? { photoUrl: withSlash(payload.photo) } : {}),
          });
      return mapTeacher(unwrap(response));
    },
    async updateRemote(http, id, patch) {
      if (patch.name !== undefined || patch.subject !== undefined) {
        await http.patch(`/teachers/${encodeURIComponent(id)}`, {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
        });
      }

      if (Array.isArray(patch.reviews)) {
        const current = await fetchTeacher(http, id);
        const known = new Set(current.reviews.map((review) => review.id));
        for (const review of patch.reviews) {
          if (known.has(review.id)) continue;
          await addTeacherReview(http, id, review);
        }
      }

      return fetchTeacher(http, id);
    },
    removeRemote(http, id) {
      return http.delete(`/teachers/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 4 · Objetos perdidos y encontrados                                         */
/* -------------------------------------------------------------------------- */

function mapLostFound(item) {
  return {
    id: item.id,
    type: item.type === 'FOUND' ? 'found' : 'lost',
    desc: item.description,
    by: item.reportedBy,
    contact: item.contact,
    place: item.location || '',
    location: item.location || '',
    category: item.category || 'otro',
    photo: item.photoUrl,
    image: item.exampleImageUrl,
    resolved: item.status === 'RETURNED',
    resolvedAt: item.status === 'RETURNED' ? item.updatedAt : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function lostFoundFields(payload, type) {
  const fields = {
    type,
    reportedBy: payload.by,
    contact: payload.contact,
    description: payload.desc,
    location: payload.place ?? payload.location ?? '',
    status: payload.resolved ? 'RETURNED' : 'OPEN',
  };
  if (payload.category) fields.category = payload.category;
  if (payload.image) fields.exampleImageUrl = withSlash(payload.image);
  return fields;
}

/** Crea un repositorio para una de las dos bandejas del módulo. */
function createLostFoundResource({ name, type, storageKey, seed }) {
  return createResource({
    name,
    endpoint: '/lost-found',
    storageKey,
    seed,
    adapters: {
      async listRemote(http) {
        const data = unwrap(await http.get(`/lost-found?type=${type}&limit=100`));
        return asArray(data?.items).map(mapLostFound);
      },
      async createRemote(http, payload) {
        const fields = lostFoundFields(payload, type);
        const response = isDataUrl(payload.photo)
          ? await http.postForm('/lost-found', { fields, files: { photo: payload.photo } })
          : await http.post('/lost-found', {
              ...fields,
              ...(withSlash(payload.photo) ? { photoUrl: withSlash(payload.photo) } : {}),
            });
        return mapLostFound(unwrap(response));
      },
      async updateRemote(http, id, patch) {
        if (patch.resolved !== undefined) {
          const response = await http.patch(`/lost-found/${encodeURIComponent(id)}/status`, {
            status: patch.resolved ? 'RETURNED' : 'OPEN',
          });
          return mapLostFound(unwrap(response));
        }
        return null;
      },
      removeRemote(http, id) {
        return http.delete(`/lost-found/${encodeURIComponent(id)}`);
      },
    },
  });
}

export const foundRepo = createLostFoundResource({
  name: 'found',
  type: 'FOUND',
  storageKey: STORAGE_KEYS.found,
  seed: seedFound,
});

export const lostRepo = createLostFoundResource({
  name: 'lost',
  type: 'LOST',
  storageKey: STORAGE_KEYS.lost,
  seed: seedLost,
});

/* -------------------------------------------------------------------------- */
/* 5 · Calendario escolar                                                     */
/* -------------------------------------------------------------------------- */

const ROLE_TO_API = { alumno: 'STUDENT', profesor: 'TEACHER' };
const ROLE_FROM_API = { STUDENT: 'alumno', TEACHER: 'profesor' };

function mapEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    subject: event.subject || '',
    date: event.date,
    role: ROLE_FROM_API[event.role] || 'alumno',
    author: event.authorName,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function eventToRemote(payload) {
  const output = {};
  if (payload.title !== undefined) output.title = payload.title;
  if (payload.description !== undefined) output.description = payload.description;
  if (payload.subject !== undefined) output.subject = payload.subject;
  if (payload.date !== undefined) output.date = payload.date;
  if (payload.role !== undefined) output.role = ROLE_TO_API[payload.role] || payload.role;
  if (payload.author !== undefined) output.authorName = payload.author;
  return output;
}

export const calendarRepo = createResource({
  name: 'event',
  endpoint: '/calendar/events',
  storageKey: STORAGE_KEYS.calendar,
  seed: seedCalendar,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/calendar/events'));
      return asArray(data).map(mapEvent);
    },
    async createRemote(http, payload) {
      const response = await http.post('/calendar/events', eventToRemote(payload));
      return mapEvent(unwrap(response));
    },
    async updateRemote(http, id, patch) {
      const response = await http.patch(
        `/calendar/events/${encodeURIComponent(id)}`,
        eventToRemote(patch),
      );
      return mapEvent(unwrap(response));
    },
    removeRemote(http, id) {
      return http.delete(`/calendar/events/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 6 · Talleres                                                               */
/* -------------------------------------------------------------------------- */

function mapEnrollment(enrollment) {
  return {
    id: enrollment.id,
    name: enrollment.studentName,
    course: enrollment.course || '',
    email: enrollment.studentEmail || '',
    createdAt: enrollment.createdAt,
  };
}

function mapWorkshop(workshop) {
  return {
    id: workshop.id,
    name: workshop.name,
    description: workshop.description || '',
    category: workshop.category || '',
    schedule: workshop.schedule || '',
    location: workshop.location || '',
    teacher: workshop.teacherName || '',
    capacity: workshop.capacity,
    enrollments: asArray(workshop.enrollments).map(mapEnrollment),
    createdAt: workshop.createdAt,
    updatedAt: workshop.updatedAt,
  };
}

async function fetchWorkshop(http, id) {
  const data = unwrap(await http.get(`/workshops/${encodeURIComponent(id)}`));
  return mapWorkshop(data);
}

function workshopToRemote(payload) {
  const output = {};
  if (payload.name !== undefined) output.name = payload.name;
  if (payload.description !== undefined) output.description = payload.description;
  if (payload.category !== undefined) output.category = payload.category;
  if (payload.schedule !== undefined) output.schedule = payload.schedule;
  if (payload.location !== undefined) output.location = payload.location;
  if (payload.teacher !== undefined) output.teacherName = payload.teacher;
  if (payload.capacity !== undefined) output.capacity = payload.capacity;
  return output;
}

export const workshopsRepo = createResource({
  name: 'workshop',
  endpoint: '/workshops',
  storageKey: STORAGE_KEYS.workshops,
  seed: seedWorkshops,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/workshops?limit=100'));
      const items = asArray(data?.items);
      return Promise.all(
        items.map(async (workshop) => {
          try {
            return await fetchWorkshop(http, workshop.id);
          } catch {
            return mapWorkshop({ ...workshop, enrollments: [] });
          }
        }),
      );
    },
    async createRemote(http, payload) {
      const response = await http.post('/workshops', workshopToRemote(payload));
      return fetchWorkshop(http, unwrap(response).id);
    },
    async updateRemote(http, id, patch) {
      const current = await fetchWorkshop(http, id);

      if (Array.isArray(patch.enrollments)) {
        const desiredIds = new Set(patch.enrollments.map((enrollment) => enrollment.id));
        const currentIds = new Set(current.enrollments.map((enrollment) => enrollment.id));

        for (const enrollment of current.enrollments) {
          if (desiredIds.has(enrollment.id)) continue;
          await http.delete(
            `/workshops/${encodeURIComponent(id)}/enrollments/${encodeURIComponent(enrollment.id)}`,
          );
        }

        for (const enrollment of patch.enrollments) {
          if (currentIds.has(enrollment.id)) continue;
          await http.post(`/workshops/${encodeURIComponent(id)}/enrollments`, {
            studentName: enrollment.name,
            course: enrollment.course,
          });
        }
      }

      const fields = workshopToRemote(patch);
      if (Object.keys(fields).length) {
        await http.patch(`/workshops/${encodeURIComponent(id)}`, fields);
      }

      return fetchWorkshop(http, id);
    },
    removeRemote(http, id) {
      return http.delete(`/workshops/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 7 · Comunicados                                                            */
/* -------------------------------------------------------------------------- */

const ANNOUNCEMENT_CATEGORY_TO_API = {
  general: 'GENERAL',
  urgente: 'URGENT',
  evento: 'EVENT',
  suspension: 'SUSPENSION',
  academico: 'ACADEMIC',
};
const ANNOUNCEMENT_CATEGORY_FROM_API = Object.fromEntries(
  Object.entries(ANNOUNCEMENT_CATEGORY_TO_API).map(([key, value]) => [value, key]),
);
const ANNOUNCEMENT_ROLE_TO_API = {
  direccion: 'DIRECTION',
  profesor: 'TEACHER',
  alumno: 'ADMIN',
  'centro-alumnos': 'STUDENT_COUNCIL',
};
const ANNOUNCEMENT_ROLE_FROM_API = {
  DIRECTION: 'direccion',
  TEACHER: 'profesor',
  ADMIN: 'alumno',
  STUDENT_COUNCIL: 'centro-alumnos',
};

function mapAnnouncement(post) {
  return {
    id: post.id,
    title: post.title,
    body: post.content,
    author: post.authorName,
    role: ANNOUNCEMENT_ROLE_FROM_API[post.authorRole] || 'direccion',
    category: ANNOUNCEMENT_CATEGORY_FROM_API[post.category] || 'general',
    pinned: Boolean(post.pinned),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function announcementToRemote(payload) {
  const output = {};
  if (payload.title !== undefined) output.title = payload.title;
  if (payload.body !== undefined) output.content = payload.body;
  if (payload.author !== undefined) output.authorName = payload.author;
  if (payload.role !== undefined) {
    output.authorRole = ANNOUNCEMENT_ROLE_TO_API[payload.role] || payload.role;
  }
  if (payload.category !== undefined) {
    output.category = ANNOUNCEMENT_CATEGORY_TO_API[payload.category] || payload.category;
  }
  if (payload.pinned !== undefined) output.pinned = payload.pinned;
  return output;
}

export const announcementsRepo = createResource({
  name: 'post',
  endpoint: '/announcements',
  storageKey: STORAGE_KEYS.announcements,
  seed: seedAnnouncements,
  adapters: {
    async listRemote(http) {
      const data = unwrap(await http.get('/announcements?limit=100'));
      return asArray(data?.items).map(mapAnnouncement);
    },
    async createRemote(http, payload) {
      const response = await http.post('/announcements', announcementToRemote(payload));
      return mapAnnouncement(unwrap(response));
    },
    async updateRemote(http, id, patch) {
      const response = await http.patch(
        `/announcements/${encodeURIComponent(id)}`,
        announcementToRemote(patch),
      );
      return mapAnnouncement(unwrap(response));
    },
    removeRemote(http, id) {
      return http.delete(`/announcements/${encodeURIComponent(id)}`);
    },
  },
});

/* -------------------------------------------------------------------------- */
/* 8 · Tareas                                                                 */
/* -------------------------------------------------------------------------- */

function mapTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    subject: task.subject,
    dueDate: task.dueDate,
    priority: task.priority || 'media',
    author: task.createdBy,
    completed: Boolean(task.completed),
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function taskToRemote(payload) {
  const output = {};
  if (payload.title !== undefined) output.title = payload.title;
  if (payload.description !== undefined) output.description = payload.description;
  if (payload.subject !== undefined) output.subject = payload.subject;
  if (payload.priority !== undefined) output.priority = payload.priority;
  if (payload.dueDate !== undefined) output.dueDate = payload.dueDate;
  if (payload.author !== undefined) output.createdBy = payload.author;
  return output;
}

function currentStudent() {
  return getProfile().name || 'Visitante';
}

export const tasksRepo = createResource({
  name: 'task',
  endpoint: '/tasks',
  storageKey: STORAGE_KEYS.tasks,
  seed: seedTasks,
  adapters: {
    async listRemote(http) {
      const studentName = encodeURIComponent(currentStudent());
      const data = unwrap(await http.get(`/tasks?limit=100&studentName=${studentName}`));
      return asArray(data?.items).map(mapTask);
    },
    async createRemote(http, payload) {
      const response = await http.post('/tasks', taskToRemote(payload));
      return { ...mapTask(unwrap(response)), completed: false, completedAt: null };
    },
    async updateRemote(http, id, patch) {
      if (patch.completed !== undefined) {
        await http.patch(`/tasks/${encodeURIComponent(id)}/completion`, {
          studentName: currentStudent(),
          completed: patch.completed,
        });
      }

      const fields = taskToRemote(patch);
      if (Object.keys(fields).length) {
        await http.patch(`/tasks/${encodeURIComponent(id)}`, fields);
      }

      return {
        id,
        ...(patch.completed !== undefined ? { completed: Boolean(patch.completed) } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
      };
    },
    removeRemote(http, id) {
      return http.delete(`/tasks/${encodeURIComponent(id)}`);
    },
  },
});

export const repos = {
  subjects: subjectsRepo,
  missing: missingRepo,
  teachers: teachersRepo,
  found: foundRepo,
  lost: lostRepo,
  calendar: calendarRepo,
  workshops: workshopsRepo,
  announcements: announcementsRepo,
  tasks: tasksRepo,
};
