import { currentWeekKey } from '../utils/menu.js';

/**
 * Comentarios de ejemplo para la semana actual. Los comentarios se guardan por
 * semana y día, así que la rotación del menú no mezcla opiniones de otras fechas.
 */

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function seedMenuComments() {
  const weekKey = currentWeekKey();

  return [
    {
      id: 'menu-comment-camila',
      weekKey,
      dayId: 'lunes',
      type: 'comentario',
      body: 'La cazuela estaba rica y bien caliente. Me gustó que hubiera alternativa vegetariana.',
      author: 'Camila Rojas',
      role: 'alumno',
      createdAt: hoursAgo(20),
    },
    {
      id: 'menu-comment-moya',
      weekKey,
      dayId: 'miercoles',
      type: 'sugerencia',
      body: '¿Podrían agregar más ensalada en el almuerzo? A varios del curso nos queda poca verdura.',
      author: 'Prof. Sebastián Moya',
      role: 'profesor',
      createdAt: hoursAgo(9),
    },
    {
      id: 'menu-comment-paula',
      weekKey,
      dayId: 'viernes',
      type: 'sugerencia',
      body: 'Para el viernes, una opción sin pescado ayudaría a quienes no lo comen. Gracias.',
      author: 'Paula Rivas',
      role: 'inspector',
      createdAt: hoursAgo(3),
    },
  ];
}
