/**
 * Catálogos y constantes compartidas por la aplicación.
 */

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    path: '/panel',
    label: 'Panel general',
    shortLabel: 'Panel',
    icon: 'dashboard',
    description: 'Resumen de la actividad escolar.',
  },
  {
    id: 'grades',
    path: '/notas',
    label: 'Notas y promedios',
    shortLabel: 'Notas',
    icon: 'grades',
    description: 'Registra calificaciones semestrales y calcula promedios.',
  },
  {
    id: 'missing',
    path: '/personas-extraviadas',
    label: 'Personas extraviadas',
    shortLabel: 'Seguridad',
    icon: 'missing',
    description: 'Reportes de emergencia dentro del recinto escolar.',
  },
  {
    id: 'teachers',
    path: '/profesores',
    label: 'Calificador de profesores',
    shortLabel: 'Profesores',
    icon: 'teachers',
    description: 'Directorio, valoraciones y opiniones de la comunidad.',
  },
  {
    id: 'lostfound',
    path: '/objetos-perdidos',
    label: 'Objetos perdidos',
    shortLabel: 'Objetos',
    icon: 'lostfound',
    description: 'Objetos encontrados y avisos de objetos perdidos.',
  },
  {
    id: 'calendar',
    path: '/calendario',
    label: 'Calendario de pruebas',
    shortLabel: 'Calendario',
    icon: 'calendar',
    description: 'Pruebas, evaluaciones y feriados del año escolar.',
  },
  {
    id: 'workshops',
    path: '/talleres',
    label: 'Talleres y actividades',
    shortLabel: 'Talleres',
    icon: 'workshops',
    description: 'Actividades extracurriculares e inscripciones.',
  },
  {
    id: 'announcements',
    path: '/comunicados',
    label: 'Tablón de comunicados',
    shortLabel: 'Comunicados',
    icon: 'announcements',
    description: 'Avisos oficiales de dirección, profesores y centro de alumnos.',
  },
  {
    id: 'tasks',
    path: '/tareas',
    label: 'Tareas y deberes',
    shortLabel: 'Tareas',
    icon: 'tasks',
    description: 'Deberes por asignatura y checklist personal de avance.',
  },
];

export const SUBJECTS = [
  'Lenguaje y Comunicación',
  'Matemáticas',
  'Ciencias Naturales',
  'Historia, Geografía y Ciencias Sociales',
  'Inglés',
  'Educación Física',
  'Artes Visuales',
  'Música',
  'Tecnología',
  'Filosofía',
  'Orientación',
  'Otro',
];

export const WORKSHOP_CATEGORIES = [
  { id: 'deportes', label: 'Deportes', icon: 'trophy' },
  { id: 'programacion', label: 'Programación', icon: 'code' },
  { id: 'arte', label: 'Arte', icon: 'palette' },
  { id: 'musica', label: 'Música', icon: 'music' },
  { id: 'ciencia', label: 'Ciencia', icon: 'flask' },
  { id: 'bienestar', label: 'Bienestar', icon: 'heart' },
];

export const ANNOUNCEMENT_CATEGORIES = [
  { id: 'general', label: 'General', tone: 'brand' },
  { id: 'urgente', label: 'Urgente', tone: 'danger' },
  { id: 'evento', label: 'Evento', tone: 'success' },
  { id: 'suspension', label: 'Suspensión', tone: 'warning' },
  { id: 'academico', label: 'Académico', tone: 'info' },
];

export const AUTHOR_ROLES = [
  { id: 'direccion', label: 'Dirección' },
  { id: 'profesor', label: 'Profesor/a' },
  { id: 'alumno', label: 'Alumno/a' },
  { id: 'centro-alumnos', label: 'Centro de alumnos' },
];

export const PRIORITIES = [
  { id: 'alta', label: 'Alta', tone: 'danger' },
  { id: 'media', label: 'Media', tone: 'warning' },
  { id: 'baja', label: 'Baja', tone: 'success' },
];

export const LOSTFOUND_CATEGORIES = [
  {
    id: 'mochila',
    label: 'Mochila / bolso',
    icon: 'lostfound',
    image: 'assets/items/backpack.svg',
  },
  { id: 'llaves', label: 'Llaves', icon: 'shield', image: 'assets/items/keys.svg' },
  { id: 'cuaderno', label: 'Cuaderno / libros', icon: 'book', image: 'assets/items/notebook.svg' },
  { id: 'tecnologia', label: 'Tecnología', icon: 'code', image: 'assets/items/tech.svg' },
  { id: 'ropa', label: 'Ropa / abrigo', icon: 'user', image: 'assets/items/jacket.svg' },
  { id: 'otro', label: 'Otro', icon: 'lostfound', image: 'assets/items/other.svg' },
];

export const EXAMPLE_AVATARS = [
  'assets/avatars/avatar-1.svg',
  'assets/avatars/avatar-2.svg',
  'assets/avatars/avatar-3.svg',
  'assets/avatars/avatar-4.svg',
];

export const EXAMPLE_PEOPLE = [
  'assets/illustrations/person-1.svg',
  'assets/illustrations/person-2.svg',
  'assets/illustrations/person-3.svg',
  'assets/illustrations/person-4.svg',
];

/**
 * Feriados escolares en Chile (mes/día). Se aplican a cualquier año.
 * Se pueden ampliar desde la vista de calendario sin tocar la lógica.
 */
export const HOLIDAYS = {
  1: [1],
  4: [18, 19],
  5: [1, 21],
  6: [20, 29],
  7: [16],
  8: [15],
  9: [18, 19],
  10: [12, 31],
  11: [1],
  12: [8, 25],
};

export const GRADE_SCALE = {
  min: 1,
  max: 7,
  passing: 4,
};

export const STORAGE_KEYS = {
  subjects: 'grades.subjects',
  missing: 'safety.missing',
  teachers: 'community.teachers',
  found: 'lostfound.found',
  lost: 'lostfound.lost',
  calendar: 'calendar.events',
  workshops: 'workshops.items',
  announcements: 'announcements.posts',
  tasks: 'tasks.items',
  profile: 'session.profile',
};
