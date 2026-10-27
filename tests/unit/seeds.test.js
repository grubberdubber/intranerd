import { describe, expect, it } from 'vitest';
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
} from '../../src/data/seeds.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

function assertUniqueIds(items) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
  ids.forEach((id) => expect(id).toMatch(/^[a-z]+_/));
}

/**
 * Datos de demostración del modo localStorage.
 * Garantizan que la SPA arranque con información coherente aunque la API no
 * esté disponible.
 */
describe('data/seeds · notas', () => {
  it('genera asignaturas con notas dentro de la escala 1.0–7.0', () => {
    const subjects = seedSubjects();

    expect(subjects).toHaveLength(4);
    assertUniqueIds(subjects);
    expect(subjects.map((subject) => subject.name)).toContain('Matemáticas');

    for (const subject of subjects) {
      expect(Array.isArray(subject.semester1)).toBe(true);
      expect(Array.isArray(subject.semester2)).toBe(true);
      expect(subject.createdAt).toMatch(ISO_DATETIME);

      const grades = [...subject.semester1, ...subject.semester2];
      expect(grades.length).toBeGreaterThan(0);
      grades.forEach((grade) => {
        expect(grade).toBeGreaterThanOrEqual(1);
        expect(grade).toBeLessThanOrEqual(7);
      });
    }
  });
});

describe('data/seeds · personas extraviadas', () => {
  it('genera reportes activos y resueltos con datos completos', () => {
    const reports = seedMissing();

    expect(reports).toHaveLength(2);
    assertUniqueIds(reports);

    for (const report of reports) {
      expect(report.name).toBeTruthy();
      expect(report.age).toBeGreaterThan(0);
      expect(report.desc.length).toBeGreaterThan(20);
      expect(report.place).toBeTruthy();
      expect(report.contact).toBeTruthy();
      expect(report.exampleImg).toMatch(/^assets\//);
      expect(report.createdAt).toMatch(ISO_DATETIME);
      expect(typeof report.found).toBe('boolean');
      if (report.found) expect(report.foundAt).toMatch(ISO_DATETIME);
      else expect(report.foundAt).toBeNull();
    }

    expect(reports.some((report) => report.found)).toBe(true);
    expect(reports.some((report) => !report.found)).toBe(true);
  });

  it('ordena los activos antes que los resueltos y por fecha descendente', () => {
    // Misma regla que la vista de seguridad: primero pendientes, luego recientes.
    const sorted = seedMissing()
      .slice()
      .sort(
        (a, b) =>
          Number(a.found) - Number(b.found) || new Date(b.createdAt) - new Date(a.createdAt),
      );

    expect(sorted[0].found).toBe(false);
    expect(sorted.at(-1).found).toBe(true);
  });
});

describe('data/seeds · profesores y estrellas', () => {
  it('genera profesores con reseñas de 1 a 5 estrellas', () => {
    const teachers = seedTeachers();

    expect(teachers).toHaveLength(4);
    assertUniqueIds(teachers);

    for (const teacher of teachers) {
      expect(teacher.name).toMatch(/^Prof\./);
      expect(teacher.subject).toBeTruthy();
      expect(teacher.photo).toMatch(/^assets\//);
      expect(teacher.reviews.length).toBeGreaterThan(0);
      assertUniqueIds(teacher.reviews);

      teacher.reviews.forEach((review) => {
        expect(review.student).toBeTruthy();
        expect(review.text.length).toBeGreaterThan(10);
        expect(Number.isInteger(review.rating)).toBe(true);
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
        expect(review.createdAt).toMatch(ISO_DATETIME);
      });
    }
  });

  it('permite calcular el promedio de estrellas por profesor', () => {
    const teachers = seedTeachers();
    const stats = teachers.map((teacher) => {
      const total = teacher.reviews.reduce((sum, review) => sum + review.rating, 0);
      return {
        name: teacher.name,
        count: teacher.reviews.length,
        total,
        average: total / teacher.reviews.length,
      };
    });

    const moya = stats.find((teacher) => teacher.name === 'Prof. Sebastián Moya');
    expect(moya).toMatchObject({ count: 2, total: 9, average: 4.5 });

    stats.forEach((teacher) => {
      expect(teacher.average).toBeGreaterThanOrEqual(1);
      expect(teacher.average).toBeLessThanOrEqual(5);
    });
  });
});

describe('data/seeds · objetos perdidos y encontrados', () => {
  it('separa objetos encontrados y avisos de perdidos', () => {
    const found = seedFound();
    const lost = seedLost();

    expect(found).toHaveLength(3);
    expect(lost).toHaveLength(2);
    assertUniqueIds(found);
    assertUniqueIds(lost);

    for (const item of [...found, ...lost]) {
      expect(item.category).toBeTruthy();
      expect(item.desc.length).toBeGreaterThan(20);
      expect(item.by).toBeTruthy();
      expect(item.contact).toBeTruthy();
      expect(item.place).toBeTruthy();
      expect(item.image).toMatch(/^assets\/items\//);
      expect(typeof item.resolved).toBe('boolean');
      expect(item.createdAt).toMatch(ISO_DATETIME);
    }

    expect(found.some((item) => item.resolved)).toBe(true);
    expect(lost.every((item) => !item.resolved)).toBe(true);
  });
});

describe('data/seeds · calendario', () => {
  it('genera evaluaciones en fechas ISO reales del año en curso', () => {
    const events = seedCalendar();
    const year = new Date().getFullYear();

    expect(events).toHaveLength(8);
    assertUniqueIds(events);

    for (const event of events) {
      expect(event.date).toMatch(ISO_DATE);
      expect(event.date.startsWith(String(year))).toBe(true);
      expect(Number.isNaN(new Date(`${event.date}T00:00:00`).getTime())).toBe(false);
      expect(['alumno', 'profesor']).toContain(event.role);
      expect(event.title).toBeTruthy();
      expect(event.author).toBeTruthy();
    }

    expect(events.filter((event) => event.role === 'alumno')).toHaveLength(2);
  });
});

describe('data/seeds · talleres', () => {
  it('genera talleres con cupos suficientes para sus inscripciones', () => {
    const workshops = seedWorkshops();

    expect(workshops).toHaveLength(6);
    assertUniqueIds(workshops);

    for (const workshop of workshops) {
      expect(workshop.name).toBeTruthy();
      expect(workshop.category).toBeTruthy();
      expect(workshop.teacher).toMatch(/^Prof\./);
      expect(workshop.schedule).toBeTruthy();
      expect(workshop.location).toBeTruthy();
      expect(workshop.capacity).toBeGreaterThan(0);
      expect(workshop.enrollments.length).toBeLessThanOrEqual(workshop.capacity);
      assertUniqueIds(workshop.enrollments);

      workshop.enrollments.forEach((enrollment) => {
        expect(enrollment.name).toBeTruthy();
        expect(enrollment.course).toBeTruthy();
        expect(enrollment.createdAt).toMatch(ISO_DATETIME);
      });
    }

    const categories = workshops.map((workshop) => workshop.category);
    expect(categories).toEqual(
      expect.arrayContaining([
        'deportes',
        'programacion',
        'arte',
        'musica',
        'ciencia',
        'bienestar',
      ]),
    );
  });
});

describe('data/seeds · anuncios', () => {
  it('genera comunicados con categorías y roles válidos', () => {
    const posts = seedAnnouncements();

    expect(posts).toHaveLength(5);
    assertUniqueIds(posts);
    expect(posts.filter((post) => post.pinned)).toHaveLength(2);

    const categories = ['general', 'suspension', 'evento', 'academico'];
    const roles = ['direccion', 'profesor', 'centro-alumnos', 'alumno'];

    posts.forEach((post) => {
      expect(post.title).toBeTruthy();
      expect(post.body.length).toBeGreaterThan(40);
      expect(categories).toContain(post.category);
      expect(roles).toContain(post.role);
      expect(post.author).toBeTruthy();
      expect(post.createdAt).toMatch(ISO_DATETIME);
    });
  });
});

describe('data/seeds · tareas', () => {
  it('genera tareas con prioridad, fecha y estado de completado', () => {
    const tasks = seedTasks();

    expect(tasks).toHaveLength(6);
    assertUniqueIds(tasks);

    tasks.forEach((task) => {
      expect(task.title).toBeTruthy();
      expect(task.subject).toBeTruthy();
      expect(task.description.length).toBeGreaterThan(20);
      expect(task.dueDate).toMatch(ISO_DATE);
      expect(['alta', 'media', 'baja']).toContain(task.priority);
      expect(task.author).toMatch(/^Prof\./);
      expect(typeof task.completed).toBe('boolean');
      expect(task.createdAt).toMatch(ISO_DATETIME);
      if (task.completed) expect(task.completedAt).toMatch(ISO_DATETIME);
    });

    expect(tasks.filter((task) => task.completed)).toHaveLength(1);
    expect(tasks.filter((task) => task.priority === 'alta').length).toBeGreaterThan(0);
  });
});

describe('data/seeds · unicidad entre módulos', () => {
  it('no reutiliza identificadores entre módulos distintos', () => {
    const all = [
      ...seedSubjects(),
      ...seedMissing(),
      ...seedTeachers(),
      ...seedFound(),
      ...seedLost(),
      ...seedCalendar(),
      ...seedWorkshops(),
      ...seedAnnouncements(),
      ...seedTasks(),
    ];
    const ids = all.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
