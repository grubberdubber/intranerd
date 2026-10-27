import { toISODate } from '../utils/format.js';
import { uid } from '../utils/id.js';

/**
 * Datos de demostración. Se cargan una sola vez en localStorage para que la
 * aplicación se sienta viva desde el primer inicio, sin depender de un backend.
 */

const now = () => new Date().toISOString();

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysFromNow(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function dateInYear(month, day) {
  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function seedSubjects() {
  return [
    {
      id: uid('subj'),
      name: 'Matemáticas',
      semester1: [6.2, 5.8, 6.5],
      semester2: [5.9, 6.1],
      createdAt: hoursAgo(240),
    },
    {
      id: uid('subj'),
      name: 'Lenguaje y Comunicación',
      semester1: [5.5, 6.0],
      semester2: [5.8, 6.2],
      createdAt: hoursAgo(238),
    },
    {
      id: uid('subj'),
      name: 'Ciencias Naturales',
      semester1: [6.0, 5.7],
      semester2: [5.4],
      createdAt: hoursAgo(236),
    },
    {
      id: uid('subj'),
      name: 'Historia, Geografía y Ciencias Sociales',
      semester1: [5.2, 5.9],
      semester2: [6.0],
      createdAt: hoursAgo(234),
    },
  ];
}

export function seedMissing() {
  return [
    {
      id: uid('missing'),
      name: 'Sofía Ramos',
      age: 13,
      desc:
        'Sudadera gris con capucha, mochila rosa y cabello largo castaño. ' +
        'Se le vio por última vez cerca del patio central.',
      place: 'Patio central',
      contact: 'Mamá: +56 9 1234 5678',
      photo: null,
      exampleImg: 'assets/illustrations/person-1.svg',
      found: false,
      createdAt: hoursAgo(2),
      foundAt: null,
    },
    {
      id: uid('missing'),
      name: 'Matías Oliva',
      age: 15,
      desc: 'Camisa azul del uniforme, zapatillas blancas y mochila negra. Ya fue ubicado en la biblioteca.',
      place: 'Entrada principal',
      contact: 'Prof. López: +56 9 8765 4321',
      photo: null,
      exampleImg: 'assets/illustrations/person-2.svg',
      found: true,
      createdAt: hoursAgo(26),
      foundAt: hoursAgo(24),
    },
  ];
}

export function seedTeachers() {
  return [
    {
      id: uid('teacher'),
      name: 'Prof. Sebastián Moya',
      subject: 'Matemáticas',
      photo: 'assets/avatars/avatar-1.svg',
      reviews: [
        {
          id: uid('review'),
          student: 'Camila R.',
          rating: 5,
          text: 'Súper claro para explicar y siempre responde las dudas con paciencia.',
          evidence: null,
          createdAt: hoursAgo(72),
        },
        {
          id: uid('review'),
          student: 'Andrés T.',
          rating: 4,
          text: 'Bueno, pero deja bastante tarea. Las clases son entretenidas.',
          evidence: null,
          createdAt: hoursAgo(48),
        },
      ],
      createdAt: hoursAgo(720),
    },
    {
      id: uid('teacher'),
      name: 'Prof. Valentina Ortega',
      subject: 'Lenguaje y Comunicación',
      photo: 'assets/avatars/avatar-2.svg',
      reviews: [
        {
          id: uid('review'),
          student: 'Diego S.',
          rating: 5,
          text: 'Muy paciente y logra que todos participemos en clase.',
          evidence: null,
          createdAt: hoursAgo(60),
        },
        {
          id: uid('review'),
          student: 'Sofía A.',
          rating: 4,
          text: 'Exigente pero justa. Sus comentarios ayudan a mejorar.',
          evidence: null,
          createdAt: hoursAgo(30),
        },
      ],
      createdAt: hoursAgo(700),
    },
    {
      id: uid('teacher'),
      name: 'Prof. Tomás Villagrán',
      subject: 'Historia, Geografía y Ciencias Sociales',
      photo: 'assets/avatars/avatar-3.svg',
      reviews: [
        {
          id: uid('review'),
          student: 'Martina N.',
          rating: 4,
          text: 'Explica rápido, pero sabe muchísimo y las historias son buenísimas.',
          evidence: null,
          createdAt: hoursAgo(20),
        },
      ],
      createdAt: hoursAgo(680),
    },
    {
      id: uid('teacher'),
      name: 'Prof. Antonia Fuentes',
      subject: 'Ciencias Naturales',
      photo: 'assets/avatars/avatar-4.svg',
      reviews: [
        {
          id: uid('review'),
          student: 'Vicente P.',
          rating: 5,
          text: 'Las clases de laboratorio son las mejores del semestre.',
          evidence: null,
          createdAt: hoursAgo(12),
        },
      ],
      createdAt: hoursAgo(640),
    },
  ];
}

export function seedFound() {
  return [
    {
      id: uid('found'),
      category: 'mochila',
      desc: 'Mochila azul con stickers de astronautas y una etiqueta con iniciales J.P.',
      by: 'María Pérez',
      contact: '+56 9 1234 5678',
      place: 'Patio central',
      photo: null,
      image: 'assets/items/backpack.svg',
      resolved: false,
      createdAt: hoursAgo(5),
    },
    {
      id: uid('found'),
      category: 'llaves',
      desc: 'Llavero con tres llaves y un dije de estrella amarilla.',
      by: 'Conserjería',
      contact: 'Mesa de entrada',
      place: 'Pasillo del segundo piso',
      photo: null,
      image: 'assets/items/keys.svg',
      resolved: false,
      createdAt: hoursAgo(29),
    },
    {
      id: uid('found'),
      category: 'cuaderno',
      desc: 'Cuaderno universitario rojo con el nombre "Elena" en la portada.',
      by: 'Prof. Ortega',
      contact: 'Sala de profesores',
      place: 'Aula 12',
      photo: null,
      image: 'assets/items/notebook.svg',
      resolved: true,
      createdAt: hoursAgo(51),
    },
  ];
}

export function seedLost() {
  return [
    {
      id: uid('lost'),
      category: 'tecnologia',
      desc: 'Audífonos inalámbricos blancos dentro de un estuche azul. Tienen una marca en la bisagra.',
      by: 'Javier González',
      contact: '+56 9 9876 5432',
      place: 'Aula 8',
      photo: null,
      image: 'assets/items/tech.svg',
      resolved: false,
      createdAt: hoursAgo(8),
    },
    {
      id: uid('lost'),
      category: 'ropa',
      desc: 'Polerón institucional talla M, con nombre bordado en el puño.',
      by: 'Antonia Vega',
      contact: 'antonia.vega@colegio.cl',
      place: 'Gimnasio',
      photo: null,
      image: 'assets/items/jacket.svg',
      resolved: false,
      createdAt: hoursAgo(33),
    },
  ];
}

export function seedCalendar() {
  return [
    {
      id: uid('event'),
      date: dateInYear(3, 18),
      title: 'Prueba de Matemáticas',
      description: 'Unidad de álgebra y ecuaciones de primer grado.',
      role: 'profesor',
      author: 'Prof. Moya',
      subject: 'Matemáticas',
      createdAt: hoursAgo(120),
    },
    {
      id: uid('event'),
      date: dateInYear(4, 7),
      title: 'Ensayo PAES',
      description: 'Ensayo general de competencia lectora y matemática.',
      role: 'profesor',
      author: 'Coordinación Académica',
      subject: 'General',
      createdAt: hoursAgo(110),
    },
    {
      id: uid('event'),
      date: dateInYear(5, 12),
      title: 'Disertación de Historia',
      description: 'Presentación grupal sobre el siglo XX en Chile.',
      role: 'alumno',
      author: 'Martina N.',
      subject: 'Historia',
      createdAt: hoursAgo(96),
    },
    {
      id: uid('event'),
      date: dateInYear(6, 3),
      title: 'Control de Ciencias',
      description: 'Contenidos: ecosistemas, energía y materia.',
      role: 'profesor',
      author: 'Prof. Fuentes',
      subject: 'Ciencias Naturales',
      createdAt: hoursAgo(80),
    },
    {
      id: uid('event'),
      date: dateInYear(8, 26),
      title: 'Feria de Talleres',
      description: 'Muestra anual de talleres extracurriculares en el gimnasio.',
      role: 'profesor',
      author: 'Dirección',
      subject: 'General',
      createdAt: hoursAgo(70),
    },
    {
      id: uid('event'),
      date: dateInYear(9, 15),
      title: 'Prueba de Inglés',
      description: 'Listening, reading and writing assessment.',
      role: 'profesor',
      author: 'Prof. Rojas',
      subject: 'Inglés',
      createdAt: hoursAgo(62),
    },
    {
      id: uid('event'),
      date: dateInYear(10, 22),
      title: 'Presentación de proyecto',
      description: 'Proyecto interdisciplinario de tecnología y arte.',
      role: 'alumno',
      author: 'Equipo 4° medio',
      subject: 'Tecnología',
      createdAt: hoursAgo(40),
    },
    {
      id: uid('event'),
      date: dateInYear(11, 4),
      title: 'Examen de Lenguaje',
      description: 'Análisis literario y producción escrita.',
      role: 'profesor',
      author: 'Prof. Ortega',
      subject: 'Lenguaje y Comunicación',
      createdAt: hoursAgo(30),
    },
  ];
}

export function seedWorkshops() {
  return [
    {
      id: uid('workshop'),
      name: 'Básquetbol formativo',
      category: 'deportes',
      description:
        'Entrenamiento de fundamentos, trabajo en equipo y preparación para torneos interescolares.',
      teacher: 'Prof. Diego Salazar',
      schedule: 'Martes y jueves · 16:30 a 18:00',
      location: 'Gimnasio principal',
      capacity: 24,
      enrollments: [
        { id: uid('enroll'), name: 'Martín Rivas', course: '7° B', createdAt: hoursAgo(90) },
        { id: uid('enroll'), name: 'Josefa Lagos', course: '8° A', createdAt: hoursAgo(80) },
        { id: uid('enroll'), name: 'Benjamín Soto', course: '1° medio', createdAt: hoursAgo(60) },
      ],
      createdAt: hoursAgo(800),
    },
    {
      id: uid('workshop'),
      name: 'Robótica y programación',
      category: 'programacion',
      description:
        'Construcción de prototipos con Arduino, pensamiento computacional y desafíos de código.',
      teacher: 'Prof. Camila Herrera',
      schedule: 'Miércoles · 15:30 a 17:30',
      location: 'Laboratorio de computación',
      capacity: 18,
      enrollments: [
        { id: uid('enroll'), name: 'Vicente Paredes', course: '2° medio', createdAt: hoursAgo(70) },
        { id: uid('enroll'), name: 'Isidora Muñoz', course: '1° medio', createdAt: hoursAgo(55) },
      ],
      createdAt: hoursAgo(790),
    },
    {
      id: uid('workshop'),
      name: 'Taller de teatro',
      category: 'arte',
      description:
        'Expresión corporal, improvisación y montaje de una obra para la muestra de fin de año.',
      teacher: 'Prof. Paula Contreras',
      schedule: 'Viernes · 16:00 a 18:00',
      location: 'Sala de artes',
      capacity: 20,
      enrollments: [
        { id: uid('enroll'), name: 'Emilia Torres', course: '8° B', createdAt: hoursAgo(44) },
        { id: uid('enroll'), name: 'Tomás Silva', course: '3° medio', createdAt: hoursAgo(42) },
        { id: uid('enroll'), name: 'Amanda Ruiz', course: '7° A', createdAt: hoursAgo(30) },
        { id: uid('enroll'), name: 'Lucas Fernández', course: '2° medio', createdAt: hoursAgo(20) },
      ],
      createdAt: hoursAgo(780),
    },
    {
      id: uid('workshop'),
      name: 'Banda escolar',
      category: 'musica',
      description: 'Ensamble instrumental y vocal. Incluye preparación para la gala de talentos.',
      teacher: 'Prof. Nicolás Vera',
      schedule: 'Lunes y miércoles · 17:00 a 18:30',
      location: 'Sala de música',
      capacity: 16,
      enrollments: [
        { id: uid('enroll'), name: 'Florencia Díaz', course: '1° medio', createdAt: hoursAgo(48) },
        { id: uid('enroll'), name: 'Agustín Mora', course: '4° medio', createdAt: hoursAgo(36) },
        { id: uid('enroll'), name: 'Trinidad Pérez', course: '8° A', createdAt: hoursAgo(22) },
      ],
      createdAt: hoursAgo(770),
    },
    {
      id: uid('workshop'),
      name: 'Club de ciencias',
      category: 'ciencia',
      description:
        'Experimentos, salidas a terreno y preparación de proyectos para la feria científica.',
      teacher: 'Prof. Antonia Fuentes',
      schedule: 'Jueves · 15:30 a 17:00',
      location: 'Laboratorio de ciencias',
      capacity: 22,
      enrollments: [
        { id: uid('enroll'), name: 'Sofía Araya', course: '2° medio', createdAt: hoursAgo(52) },
        { id: uid('enroll'), name: 'Matías Oliva', course: '1° medio', createdAt: hoursAgo(40) },
      ],
      createdAt: hoursAgo(760),
    },
    {
      id: uid('workshop'),
      name: 'Yoga y bienestar',
      category: 'bienestar',
      description:
        'Respiración consciente, movilidad suave y herramientas para manejar el estrés escolar.',
      teacher: 'Prof. Josefa Ríos',
      schedule: 'Martes · 15:30 a 16:30',
      location: 'Sala multiuso',
      capacity: 20,
      enrollments: [
        { id: uid('enroll'), name: 'Antonia Vega', course: '3° medio', createdAt: hoursAgo(34) },
        { id: uid('enroll'), name: 'Rocío Espinoza', course: '4° medio', createdAt: hoursAgo(28) },
        { id: uid('enroll'), name: 'Ignacia Fuentes', course: '2° medio', createdAt: hoursAgo(18) },
        { id: uid('enroll'), name: 'Martina Núñez', course: '1° medio', createdAt: hoursAgo(10) },
      ],
      createdAt: hoursAgo(750),
    },
  ];
}

export function seedAnnouncements() {
  return [
    {
      id: uid('post'),
      title: 'Bienvenida al segundo semestre',
      body:
        'Les damos la bienvenida a la comunidad IntraNerd. Recuerden revisar el ' +
        'calendario de evaluaciones y mantener sus datos de contacto actualizados. ' +
        'Este semestre tendremos nuevas actividades y talleres abiertos.',
      category: 'general',
      role: 'direccion',
      author: 'Dirección Académica',
      pinned: true,
      createdAt: hoursAgo(30),
    },
    {
      id: uid('post'),
      title: 'Suspensión de clases presenciales',
      body:
        'Debido a trabajos de mantenimiento en el sistema eléctrico, el viernes no ' +
        'habrá clases presenciales. Las actividades se realizarán de forma virtual ' +
        'según el horario habitual.',
      category: 'suspension',
      role: 'direccion',
      author: 'Rectoría',
      pinned: true,
      createdAt: hoursAgo(18),
    },
    {
      id: uid('post'),
      title: 'Feria de talleres: inscripciones abiertas',
      body:
        'Ya están abiertas las inscripciones para los talleres de deportes, ' +
        'programación, arte, música, ciencia y bienestar. Los cupos son limitados ' +
        'y se asignan por orden de inscripción.',
      category: 'evento',
      role: 'centro-alumnos',
      author: 'Centro de Alumnos',
      pinned: false,
      createdAt: hoursAgo(44),
    },
    {
      id: uid('post'),
      title: 'Nuevo protocolo de objetos perdidos',
      body:
        'A partir de esta semana, todos los objetos encontrados serán registrados en ' +
        'el módulo de Objetos Perdidos. Si encontraste algo, publícalo con una foto ' +
        'y el lugar donde lo hallaste.',
      category: 'general',
      role: 'profesor',
      author: 'Coordinación de Convivencia',
      pinned: false,
      createdAt: hoursAgo(66),
    },
    {
      id: uid('post'),
      title: 'Ensayo PAES para terceros y cuartos medios',
      body:
        'El ensayo se realizará en el salón principal. Deben llegar a las 08:15 con ' +
        'lápiz grafito, goma y carnet de identidad. La jornada termina a las 13:00.',
      category: 'academico',
      role: 'profesor',
      author: 'Coordinación Académica',
      pinned: false,
      createdAt: hoursAgo(90),
    },
  ];
}

export function seedTasks() {
  return [
    {
      id: uid('task'),
      title: 'Guía de ecuaciones de primer grado',
      subject: 'Matemáticas',
      description:
        'Resolver los ejercicios 1 al 24 de la guía entregada en clase. Mostrar el desarrollo.',
      dueDate: daysFromNow(2),
      priority: 'alta',
      author: 'Prof. Moya',
      completed: false,
      createdAt: hoursAgo(10),
    },
    {
      id: uid('task'),
      title: 'Lectura: "La amortajada"',
      subject: 'Lenguaje y Comunicación',
      description: 'Leer los capítulos 1 y 2 y preparar tres preguntas para el conversatorio.',
      dueDate: daysFromNow(4),
      priority: 'media',
      author: 'Prof. Ortega',
      completed: false,
      createdAt: hoursAgo(22),
    },
    {
      id: uid('task'),
      title: 'Maqueta del ciclo del agua',
      subject: 'Ciencias Naturales',
      description:
        'Trabajo en parejas. Materiales reciclados y una breve explicación escrita del proceso.',
      dueDate: daysFromNow(7),
      priority: 'media',
      author: 'Prof. Fuentes',
      completed: false,
      createdAt: hoursAgo(28),
    },
    {
      id: uid('task'),
      title: 'Línea de tiempo del siglo XX',
      subject: 'Historia, Geografía y Ciencias Sociales',
      description:
        'Seleccionar cinco hitos y justificar su relevancia en una línea de tiempo ilustrada.',
      dueDate: daysFromNow(-1),
      priority: 'alta',
      author: 'Prof. Villagrán',
      completed: false,
      createdAt: hoursAgo(50),
    },
    {
      id: uid('task'),
      title: 'Vocabulary quiz: unit 4',
      subject: 'Inglés',
      description: 'Repasar el vocabulario de la unidad 4 y las estructuras de presente perfecto.',
      dueDate: daysFromNow(1),
      priority: 'alta',
      author: 'Prof. Rojas',
      completed: true,
      createdAt: hoursAgo(60),
      completedAt: hoursAgo(4),
    },
    {
      id: uid('task'),
      title: 'Propuesta para la feria de ciencias',
      subject: 'Ciencias Naturales',
      description:
        'Escribir en una página el problema, la hipótesis y los materiales del proyecto.',
      dueDate: daysFromNow(9),
      priority: 'baja',
      author: 'Prof. Fuentes',
      completed: false,
      createdAt: hoursAgo(70),
    },
  ];
}
