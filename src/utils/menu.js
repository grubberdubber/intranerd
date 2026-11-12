import { toISODate } from './format.js';

/**
 * Cálculos del menú semanal: semana ISO, días hábiles, rotación y comentarios.
 * Las fechas se manipulan al mediodía local para evitar saltos por horario de
 * verano; la clave de semana usa el algoritmo ISO estándar.
 */

export const WEEKDAYS = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
];

const WEEKDAY_IDS = new Set(WEEKDAYS.map((weekday) => weekday.id));

function pad(value) {
  return String(value).padStart(2, '0');
}

export function startOfWeek(value = new Date()) {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

export function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function isoWeekKey(value = new Date()) {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);

  const target = new Date(date);
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);

  const week = 1 + Math.round((target - firstThursday) / (7 * 86_400_000));
  return `${target.getFullYear()}-W${pad(week)}`;
}

export function currentWeekKey() {
  return isoWeekKey(new Date());
}

export function weekDays(value = new Date()) {
  const start = startOfWeek(value);
  const today = toISODate(new Date());
  return WEEKDAYS.map((weekday, index) => {
    const date = addDays(start, index);
    return {
      ...weekday,
      date: toISODate(date),
      dateLabel: new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
      }).format(date),
      isToday: toISODate(date) === today,
    };
  });
}

export function weekRangeLabel(value = new Date()) {
  const start = startOfWeek(value);
  const end = addDays(start, 4);
  const sameMonth = start.getMonth() === end.getMonth();
  const month = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(end);
  const year = end.getFullYear();
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} de ${month} de ${year}`;

  const shortDate = (date) =>
    new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(date);
  return `${shortDate(start)} – ${shortDate(end)} de ${year}`;
}

export function rotationForWeek(value, rotations = []) {
  if (!rotations.length) return null;
  const start = startOfWeek(value);
  const epoch = Date.UTC(2024, 0, 1); // lunes de referencia
  const weekStartUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const weeks = Math.floor((weekStartUtc - epoch) / (7 * 86_400_000));
  return rotations[((weeks % rotations.length) + rotations.length) % rotations.length];
}

export function menuForWeek(value = new Date(), rotations = []) {
  const start = startOfWeek(value);
  const rotation = rotationForWeek(start, rotations);
  const days = weekDays(start).map((day) => ({
    ...day,
    menu: rotation?.days?.[day.id] || null,
  }));

  return {
    weekKey: isoWeekKey(start),
    weekStart: start,
    rotation,
    days,
    rangeLabel: weekRangeLabel(start),
  };
}

export function isValidMenuDay(dayId) {
  return WEEKDAY_IDS.has(dayId);
}

export function commentsFor(comments = [], weekKey, dayId) {
  return comments
    .filter((comment) => comment.weekKey === weekKey && comment.dayId === dayId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function commentCount(comments = [], weekKey, dayId) {
  return commentsFor(comments, weekKey, dayId).length;
}

export function latestComment(comments = [], weekKey, dayId) {
  return commentsFor(comments, weekKey, dayId)[0] || null;
}
