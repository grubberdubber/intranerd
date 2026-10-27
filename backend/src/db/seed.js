import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, closeDatabase, initializeSchema, transaction } from './connection.js';
import { makeId } from '../utils/id.js';

const pad = (value) => String(value).padStart(2, '0');

const now = Date.now();
const minutesAgo = (minutes) => new Date(now - minutes * 60_000).toISOString();
const dateInDays = (days) => {
  const date = new Date(now + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};
const year = new Date().getFullYear();
const eventDate = (month, day) => `${year}-${pad(month)}-${pad(day)}`;

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=ffffff&size=256`;

const TABLES_IN_DELETE_ORDER = [
  'task_completions',
  'tasks',
  'workshop_enrollments',
  'workshops',
  'announcements',
  'calendar_events',
  'teacher_reviews',
  'teachers',
  'lost_found_items',
  'missing_persons',
  'grades',
  'subjects',
];

/**
 * Carga datos de demostración. Por defecto es idempotente: si ya existen
 * asignaturas no hace nada. Con { force: true } vacía las tablas y recarga.
 */
export function seedDatabase({ force = false } = {}) {
  initializeSchema();

  const existing = db.prepare('SELECT COUNT(*) AS count FROM subjects').get().count;
  if (existing > 0 && !force) {
    return { seeded: false, reason: 'La base de datos ya contiene información.' };
  }

  transaction(() => {
    if (force) {
      for (const table of TABLES_IN_DELETE_ORDER) {
        db.exec(`DELETE FROM ${table};`);
      }
    }

    // -----------------------------------------------------------------------
    // Asignaturas y notas
    // -----------------------------------------------------------------------
    const insertSubject = db.prepare(
      `INSERT INTO subjects (id, name, student_name, teacher_name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertGrade = db.prepare(
      `INSERT INTO grades (id, subject_id, semester, value, label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const subjects = [
      {
        name: 'Matemáticas',
        teacher: 'Prof. Sebastián Moya',
        color: '#1e40af',
        grades: [
          [1, 6.5, 'Prueba de ecuaciones'],
          [1, 5.8, 'Control de fracciones'],
          [1, 6.2, 'Taller de geometría'],
          [2, 6.0, 'Prueba de funciones'],
          [2, 6.4, 'Trabajo grupal'],
        ],
      },
      {
        name: 'Lenguaje',
        teacher: 'Prof. Valentina Ortega',
        color: '#2563eb',
        grades: [
          [1, 5.5, 'Análisis literario'],
          [1, 6.0, 'Ensayo argumentativo'],
          [2, 5.8, 'Comprensión lectora'],
          [2, 6.2, 'Disertación'],
        ],
      },
      {
        name: 'Ciencias',
        teacher: 'Prof. Tomás Villagrán',
        color: '#0ea5e9',
        grades: [
          [1, 4.2, 'Informe de laboratorio'],
          [1, 5.0, 'Prueba de biología'],
          [2, 4.6, 'Investigación científica'],
        ],
      },
      {
        name: 'Historia',
        teacher: 'Prof. Tomás Villagrán',
        color: '#6366f1',
        grades: [
          [1, 6.0, 'Ensayo histórico'],
          [2, 6.3, 'Prueba de Chile contemporáneo'],
          [2, 5.9, 'Línea de tiempo'],
        ],
      },
      {
        name: 'Inglés',
        teacher: 'Prof. Ana Pérez',
        color: '#0f766e',
        grades: [],
      },
    ];

    subjects.forEach((subject, subjectIndex) => {
      const subjectId = makeId('sub');
      const createdAt = minutesAgo(60 * 24 * (subjects.length - subjectIndex));
      insertSubject.run(
        subjectId,
        subject.name,
        'Alumno Demo',
        subject.teacher,
        subject.color,
        createdAt,
        createdAt,
      );
      subject.grades.forEach(([semester, value, label], gradeIndex) => {
        const gradeCreated = minutesAgo(
          60 * 24 * (subjects.length - subjectIndex) - gradeIndex * 5,
        );
        insertGrade.run(
          makeId('grd'),
          subjectId,
          semester,
          value,
          label,
          gradeCreated,
          gradeCreated,
        );
      });
    });

    // -----------------------------------------------------------------------
    // Personas extraviadas
    // -----------------------------------------------------------------------
    const insertMissing = db.prepare(
      `INSERT INTO missing_persons
         (id, name, age, description, last_seen_place, contact, photo_url,
          example_image_url, status, found_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const missingPeople = [
      {
        name: 'Sofía Ramos',
        age: 13,
        description: 'Sudadera gris, mochila rosa, cabello largo castaño.',
        place: 'Patio central',
        contact: 'Mamá: +56 9 1234 5678',
        photo:
          'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=600&q=80',
        status: 'MISSING',
        minutes: 45,
      },
      {
        name: 'Matías Oliva',
        age: 15,
        description: 'Camisa azul del uniforme, zapatillas blancas, estatura 1,70 m.',
        place: 'Entrada principal',
        contact: 'Prof. López: +56 9 8765 4321',
        photo: 'https://xsgames.co/randomusers/assets/avatars/male/28.jpg',
        status: 'MISSING',
        minutes: 120,
      },
      {
        name: 'Benjamín Soto',
        age: 9,
        description: 'Polerón rojo, pantalón de buzo azul. Fue encontrado en enfermería.',
        place: 'Gimnasio',
        contact: 'Inspectoría: +56 9 5555 1111',
        photo: 'https://xsgames.co/randomusers/assets/avatars/male/12.jpg',
        status: 'FOUND',
        minutes: 60 * 26,
      },
    ];

    for (const person of missingPeople) {
      const createdAt = minutesAgo(person.minutes);
      insertMissing.run(
        makeId('msp'),
        person.name,
        person.age,
        person.description,
        person.place,
        person.contact,
        person.photo,
        null,
        person.status,
        person.status === 'FOUND' ? minutesAgo(person.minutes - 30) : null,
        createdAt,
        createdAt,
      );
    }

    // -----------------------------------------------------------------------
    // Profesores y reseñas
    // -----------------------------------------------------------------------
    const insertTeacher = db.prepare(
      `INSERT INTO teachers (id, name, subject, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertReview = db.prepare(
      `INSERT INTO teacher_reviews
         (id, teacher_id, student_name, content, rating, evidence_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const teachers = [
      {
        name: 'Prof. Sebastián Moya',
        subject: 'Matemáticas',
        reviews: [
          { student: 'Camila R.', text: 'Súper claro para explicar.', rating: 5 },
          { student: 'Andrés T.', text: 'Bueno, pero deja mucha tarea.', rating: 4 },
        ],
      },
      {
        name: 'Prof. Valentina Ortega',
        subject: 'Lenguaje',
        reviews: [
          { student: 'Diego S.', text: 'Muy paciente y dedicada.', rating: 5 },
          { student: 'Sofía A.', text: 'Exigente pero justa.', rating: 4 },
          { student: 'Martina N.', text: 'Siempre disponible para resolver dudas.', rating: 5 },
        ],
      },
      {
        name: 'Prof. Tomás Villagrán',
        subject: 'Historia',
        reviews: [{ student: 'Martina N.', text: 'Explica rápido pero sabe mucho.', rating: 4 }],
      },
      {
        name: 'Prof. Ana Pérez',
        subject: 'Física',
        reviews: [],
      },
    ];

    teachers.forEach((teacher, index) => {
      const teacherId = makeId('tch');
      const createdAt = minutesAgo(60 * 24 * (teachers.length - index));
      insertTeacher.run(
        teacherId,
        teacher.name,
        teacher.subject,
        avatar(teacher.name.replace('Prof. ', '')),
        createdAt,
        createdAt,
      );
      teacher.reviews.forEach((review, reviewIndex) => {
        insertReview.run(
          makeId('rev'),
          teacherId,
          review.student,
          review.text,
          review.rating,
          null,
          minutesAgo(60 * 12 * (teacher.reviews.length - reviewIndex) + 60),
        );
      });
    });

    // -----------------------------------------------------------------------
    // Objetos perdidos y encontrados
    // -----------------------------------------------------------------------
    const insertLostFound = db.prepare(
      `INSERT INTO lost_found_items
         (id, item_type, reported_by, contact, description, location, photo_url,
          example_image_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const lostFoundItems = [
      {
        type: 'FOUND',
        by: 'María Pérez',
        contact: '+56 9 1234 5678',
        description: 'Mochila negra con stickers de astronautas.',
        location: 'Patio central',
        example:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        status: 'OPEN',
        minutes: 90,
      },
      {
        type: 'FOUND',
        by: 'Conserjería',
        contact: 'mesón@intranerd.cl',
        description: 'Llavero con tres llaves y dije de estrella.',
        location: 'Biblioteca',
        example:
          'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
        status: 'OPEN',
        minutes: 240,
      },
      {
        type: 'LOST',
        by: 'Juan González',
        contact: '+56 9 9876 5432',
        description: 'Cuaderno rojo de matemáticas, portada rayada.',
        location: 'Aula 12',
        example:
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
        status: 'OPEN',
        minutes: 300,
      },
      {
        type: 'LOST',
        by: 'Antonia Vega',
        contact: 'antonia.vega@correo.cl',
        description: 'Audífonos inalámbricos blancos en estuche azul.',
        location: 'Laboratorio de computación',
        example:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        status: 'OPEN',
        minutes: 480,
      },
    ];

    for (const item of lostFoundItems) {
      const createdAt = minutesAgo(item.minutes);
      insertLostFound.run(
        makeId('lfi'),
        item.type,
        item.by,
        item.contact,
        item.description,
        item.location,
        null,
        item.example,
        item.status,
        createdAt,
        createdAt,
      );
    }

    // -----------------------------------------------------------------------
    // Calendario escolar
    // -----------------------------------------------------------------------
    const insertEvent = db.prepare(
      `INSERT INTO calendar_events
         (id, title, description, event_date, role, author_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const events = [
      {
        title: 'Disertación de Ciencias',
        description: 'Presentación del proyecto de energías renovables.',
        date: eventDate(10, 30),
        role: 'STUDENT',
        author: 'Alumno Demo',
      },
      {
        title: 'Prueba de Matemáticas',
        description: 'Unidad 3: funciones y ecuaciones de segundo grado.',
        date: eventDate(11, 5),
        role: 'TEACHER',
        author: 'Prof. Sebastián Moya',
      },
      {
        title: 'Ensayo PAES',
        description: 'Ensayo general de competencia lectora y matemática.',
        date: eventDate(11, 12),
        role: 'STUDENT',
        author: 'Dirección Académica',
      },
      {
        title: 'Reunión de apoderados',
        description: 'Entrega de informes del segundo semestre.',
        date: eventDate(11, 20),
        role: 'TEACHER',
        author: 'Prof. Valentina Ortega',
      },
    ];

    for (const event of events) {
      insertEvent.run(
        makeId('evt'),
        event.title,
        event.description,
        event.date,
        event.role,
        event.author,
        minutesAgo(60 * 24),
        minutesAgo(60 * 24),
      );
    }

    // -----------------------------------------------------------------------
    // Talleres
    // -----------------------------------------------------------------------
    const insertWorkshop = db.prepare(
      `INSERT INTO workshops
         (id, name, description, category, schedule, location, teacher_name,
          capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertEnrollment = db.prepare(
      `INSERT INTO workshop_enrollments
         (id, workshop_id, student_name, student_email, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );

    const workshops = [
      {
        name: 'Programación y Robótica',
        description: 'Construcción de robots y automatización con Arduino.',
        category: 'Tecnología',
        schedule: 'Lunes y miércoles · 15:30 a 17:00',
        location: 'Laboratorio 2',
        teacher: 'Prof. Sebastián Moya',
        capacity: 20,
        students: [
          ['Alumno Demo', 'alumno.demo@intranerd.cl'],
          ['Sofía Ramos', 'sofia.ramos@intranerd.cl'],
        ],
      },
      {
        name: 'Fútbol formativo',
        description: 'Entrenamiento y torneos interescolares.',
        category: 'Deportes',
        schedule: 'Martes y jueves · 16:00 a 17:30',
        location: 'Cancha principal',
        teacher: 'Prof. Diego Fuentes',
        capacity: 25,
        students: [['Matías Oliva', null]],
      },
      {
        name: 'Arte y Muralismo',
        description: 'Pintura, ilustración y creación de murales escolares.',
        category: 'Arte',
        schedule: 'Viernes · 15:00 a 17:00',
        location: 'Sala de arte',
        teacher: 'Prof. Camila Rojas',
        capacity: 15,
        students: [],
      },
      {
        name: 'Banda escolar',
        description: 'Ensamble instrumental y presentaciones en actos escolares.',
        category: 'Música',
        schedule: 'Miércoles · 16:00 a 18:00',
        location: 'Sala de música',
        teacher: 'Prof. Nicolás Vera',
        capacity: 12,
        students: [],
      },
      {
        name: 'Ciencia y Experimentos',
        description: 'Laboratorio abierto con experimentos de química y física.',
        category: 'Ciencia',
        schedule: 'Jueves · 15:30 a 17:00',
        location: 'Laboratorio 1',
        teacher: 'Prof. Tomás Villagrán',
        capacity: 18,
        students: [],
      },
    ];

    workshops.forEach((workshop, index) => {
      const workshopId = makeId('wsp');
      const createdAt = minutesAgo(60 * 24 * (workshops.length - index));
      insertWorkshop.run(
        workshopId,
        workshop.name,
        workshop.description,
        workshop.category,
        workshop.schedule,
        workshop.location,
        workshop.teacher,
        workshop.capacity,
        createdAt,
        createdAt,
      );
      workshop.students.forEach(([studentName, email], studentIndex) => {
        insertEnrollment.run(
          makeId('enr'),
          workshopId,
          studentName,
          email,
          minutesAgo(60 * (studentIndex + 1)),
        );
      });
    });

    // -----------------------------------------------------------------------
    // Tablón de anuncios
    // -----------------------------------------------------------------------
    const insertAnnouncement = db.prepare(
      `INSERT INTO announcements
         (id, title, content, category, author_name, author_role, pinned,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const announcements = [
      {
        title: 'Bienvenida al segundo semestre',
        content:
          'Estimada comunidad escolar: damos inicio al segundo semestre. ' +
          'Recuerden revisar los horarios actualizados en el calendario escolar.',
        category: 'GENERAL',
        author: 'Dirección IntraNerd',
        role: 'DIRECTION',
        pinned: 1,
        minutes: 30,
      },
      {
        title: 'Suspensión de clases por emergencia',
        content:
          'Debido a una falla en el suministro eléctrico, las clases de la jornada ' +
          'de la tarde se suspenden. Las actividades se retomarán mañana en horario normal.',
        category: 'SUSPENSION',
        author: 'Rectoría',
        role: 'DIRECTION',
        pinned: 1,
        minutes: 90,
      },
      {
        title: 'Feria científica abierta',
        content:
          'Invitamos a todas las familias a la Feria Científica del viernes. ' +
          'Habrá experimentos, robótica y presentaciones de los talleres.',
        category: 'EVENT',
        author: 'Centro de Alumnos',
        role: 'STUDENT_COUNCIL',
        pinned: 0,
        minutes: 300,
      },
      {
        title: 'Calendario de evaluaciones',
        content:
          'Ya está disponible el calendario de evaluaciones del período. ' +
          'Revisa las fechas por asignatura en el módulo de calendario.',
        category: 'ACADEMIC',
        author: 'Dirección Académica',
        role: 'ADMIN',
        pinned: 0,
        minutes: 600,
      },
    ];

    for (const announcement of announcements) {
      const createdAt = minutesAgo(announcement.minutes);
      insertAnnouncement.run(
        makeId('ann'),
        announcement.title,
        announcement.content,
        announcement.category,
        announcement.author,
        announcement.role,
        announcement.pinned,
        createdAt,
        createdAt,
      );
    }

    // -----------------------------------------------------------------------
    // Tareas y checklist
    // -----------------------------------------------------------------------
    const insertTask = db.prepare(
      `INSERT INTO tasks
         (id, title, description, subject, due_date, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertCompletion = db.prepare(
      `INSERT INTO task_completions
         (id, task_id, student_name, completed, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    const tasks = [
      {
        title: 'Ejercicios de álgebra',
        description: 'Resolver los ejercicios 1 al 20 del cuadernillo.',
        subject: 'Matemáticas',
        due: dateInDays(3),
        by: 'Prof. Sebastián Moya',
        completed: true,
      },
      {
        title: 'Leer capítulo 4 de "La ciudad y los perros"',
        description: 'Preparar tres ideas para el conversatorio.',
        subject: 'Lenguaje',
        due: dateInDays(1),
        by: 'Prof. Valentina Ortega',
        completed: false,
      },
      {
        title: 'Informe de laboratorio',
        description: 'Entregar informe grupal sobre el experimento de densidad.',
        subject: 'Ciencias',
        due: dateInDays(5),
        by: 'Prof. Tomás Villagrán',
        completed: false,
      },
      {
        title: 'Línea de tiempo: Chile en el siglo XX',
        description: 'Incluir al menos 10 hitos con fechas y fuentes.',
        subject: 'Historia',
        due: dateInDays(7),
        by: 'Prof. Tomás Villagrán',
        completed: false,
      },
    ];

    for (const task of tasks) {
      const taskId = makeId('tsk');
      const createdAt = minutesAgo(60 * 24);
      insertTask.run(
        taskId,
        task.title,
        task.description,
        task.subject,
        task.due,
        task.by,
        createdAt,
        createdAt,
      );
      if (task.completed) {
        insertCompletion.run(
          makeId('cmp'),
          taskId,
          'Alumno Demo',
          1,
          minutesAgo(120),
          minutesAgo(120),
        );
      }
    }
  });

  return { seeded: true };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const force = process.argv.includes('--force');
  const result = seedDatabase({ force });
  console.log(
    result.seeded
      ? '✅ Datos de demostración cargados correctamente.'
      : `ℹ️  ${result.reason} Usa --force para recargar.`,
  );
  closeDatabase();
}
