/**
 * Contactos y conversaciones de demostración del módulo Mensajes.
 *
 * Los identificadores son estables para que las conversaciones sembradas
 * apunten siempre al contacto correcto, incluso si el orden cambia.
 */

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const CONTACTS = [
  {
    id: 'chat-moya',
    name: 'Prof. Sebastián Moya',
    role: 'profesor',
    detail: 'Matemáticas · 3° Medio B',
    email: 's.moya@colegio.cl',
    note: 'Disponible para dudas de la guía y preparación de la prueba.',
    createdHours: 720,
  },
  {
    id: 'chat-paula',
    name: 'Paula Rivas',
    role: 'inspector',
    detail: 'Inspectoría · Patio central y acceso',
    email: 'p.rivas@colegio.cl',
    note: 'Apoyo en convivencia escolar, atrasos y seguridad del recinto.',
    createdHours: 700,
  },
  {
    id: 'chat-camila',
    name: 'Camila Rojas',
    role: 'alumno',
    detail: '2° Medio A · Delegada de curso',
    email: 'c.rojas@colegio.cl',
    note: 'Representa al curso ante el centro de alumnos.',
    createdHours: 480,
  },
  {
    id: 'chat-direccion',
    name: 'Dirección Académica',
    role: 'direccion',
    detail: 'Rectoría · Horario 08:30 a 17:30',
    email: 'direccion@colegio.cl',
    note: 'Consultas sobre calendario, evaluaciones y comunicados oficiales.',
    createdHours: 900,
  },
  {
    id: 'chat-ortega',
    name: 'Prof. Valentina Ortega',
    role: 'profesor',
    detail: 'Lenguaje y Comunicación · 2° Medio A',
    email: 'v.ortega@colegio.cl',
    note: 'Revisión de ensayos y apoyo en comprensión lectora.',
    createdHours: 660,
  },
];

export function seedChatContacts() {
  return CONTACTS.map(({ createdHours, ...contact }) => ({
    ...contact,
    createdAt: hoursAgo(createdHours),
  }));
}

export function seedChatThreads() {
  const moyaUpdatedAt = hoursAgo(3);
  const paulaUpdatedAt = hoursAgo(0.5);

  return [
    {
      id: 'thread-chat-moya',
      contactId: 'chat-moya',
      createdAt: hoursAgo(24),
      updatedAt: moyaUpdatedAt,
      lastReadAt: hoursAgo(1),
      messages: [
        {
          id: 'msg-chat-moya-1',
          author: 'contact',
          body: 'Hola, soy el profe Sebastián. Si tienes dudas con la guía de ecuaciones, escríbeme por aquí.',
          createdAt: hoursAgo(22),
        },
        {
          id: 'msg-chat-moya-2',
          author: 'me',
          body: 'Gracias, profe. ¿La entrega de la guía es individual o en parejas?',
          createdAt: hoursAgo(20),
        },
        {
          id: 'msg-chat-moya-3',
          author: 'contact',
          body: 'Es individual. Si quieres, el jueves revisamos un ejercicio juntos antes de la prueba.',
          createdAt: moyaUpdatedAt,
        },
      ],
    },
    {
      id: 'thread-chat-paula',
      contactId: 'chat-paula',
      createdAt: hoursAgo(6),
      updatedAt: paulaUpdatedAt,
      lastReadAt: hoursAgo(2),
      messages: [
        {
          id: 'msg-chat-paula-1',
          author: 'contact',
          body:
            'Hola. Si necesitas apoyo de inspectoría, puedes escribirme por este canal. ' +
            'También recuerda avisar en portería si ves una situación de riesgo.',
          createdAt: paulaUpdatedAt,
        },
      ],
    },
  ];
}
