import { pluralize, toDate, toISODate } from './format.js';

/**
 * Plan de estudio sugerido para el panel general.
 *
 * Reglas simples y explicables:
 *   - Las tareas atrasadas se trabajan hoy.
 *   - Las tareas se preparan el día anterior a su entrega.
 *   - Las evaluaciones se repasan el día anterior.
 *   - Cada día muestra como máximo tres bloques para no saturar la agenda.
 */

const MS_PER_DAY = 86_400_000;
const MAX_ITEMS_PER_DAY = 3;
const TASK_MINUTES = { alta: 45, media: 35, baja: 25 };
const ASSESSMENT_MINUTES = 40;

function startOfDay(value) {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffInDays(value, start) {
  const date = startOfDay(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date - start) / MS_PER_DAY);
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function dayLabel(date, index) {
  if (index === 0) return 'Hoy';
  if (index === 1) return 'Mañana';
  const label = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function taskReason(diff) {
  if (diff < 0) {
    const days = Math.abs(diff);
    return `Atrasada ${days} ${days === 1 ? 'día' : 'días'}`;
  }
  if (diff === 0) return 'Vence hoy';
  if (diff === 1) return 'Vence mañana';
  return `Vence en ${diff} días`;
}

function assessmentReason(diff) {
  if (diff === 0) return 'Evaluación hoy';
  if (diff === 1) return 'Evaluación mañana';
  return `Evaluación en ${diff} días`;
}

function priorityBonus(priority) {
  if (priority === 'alta') return 12;
  if (priority === 'baja') return 0;
  return 6;
}

/**
 * @param {{ tasks?: Array, events?: Array, today?: Date|string, days?: number }} options
 */
export function buildStudyPlan({ tasks = [], events = [], today = new Date(), days = 5 } = {}) {
  const safeDays = Math.max(1, Math.min(Number.isInteger(days) ? days : 5, 7));
  const start = startOfDay(today);
  const items = [];

  tasks
    .filter((task) => task && !task.completed && task.dueDate)
    .forEach((task) => {
      const diff = diffInDays(task.dueDate, start);
      if (diff === null || diff >= safeDays) return;

      // Si vence hoy o está atrasada, se trabaja hoy; si no, el día anterior.
      const dayIndex = diff <= 0 ? 0 : Math.min(safeDays - 1, diff - 1);
      const minutes = TASK_MINUTES[task.priority] || TASK_MINUTES.media;
      items.push({
        id: `task:${task.id}`,
        type: 'task',
        title: task.title,
        subject: task.subject || 'General',
        dayIndex,
        minutes,
        reason: taskReason(diff),
        score: 60 + Math.max(0, 10 - diff) * 3 + priorityBonus(task.priority) + (diff < 0 ? 30 : 0),
        dueDate: task.dueDate,
      });
    });

  events
    .filter((event) => event && event.date)
    .forEach((event) => {
      const diff = diffInDays(event.date, start);
      if (diff === null || diff < 0 || diff >= safeDays) return;

      const dayIndex = Math.max(0, diff - 1);
      items.push({
        id: `event:${event.id}`,
        type: 'assessment',
        title: event.title,
        subject: event.subject || 'General',
        dayIndex,
        minutes: ASSESSMENT_MINUTES,
        reason: assessmentReason(diff),
        score: 50 + Math.max(0, 10 - diff) * 3,
        dueDate: event.date,
      });
    });

  const plannedDays = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const candidates = items
      .filter((item) => item.dayIndex === index)
      .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title), 'es'));
    const selected = candidates.slice(0, MAX_ITEMS_PER_DAY);

    return {
      index,
      date: toISODate(date),
      label: dayLabel(date, index),
      dateLabel: dateLabel(date),
      items: selected,
      extra: candidates.length - selected.length,
      totalMinutes: selected.reduce((total, item) => total + item.minutes, 0),
    };
  });

  const scheduled = plannedDays.flatMap((day) => day.items);
  const overdueCount = tasks.filter((task) => {
    if (!task || task.completed || !task.dueDate) return false;
    const diff = diffInDays(task.dueDate, start);
    return diff !== null && diff < 0;
  }).length;
  const assessmentCount = events.filter((event) => {
    const diff = event ? diffInDays(event.date, start) : null;
    return diff !== null && diff >= 0 && diff < safeDays;
  }).length;

  const totalMinutes = scheduled.reduce((total, item) => total + item.minutes, 0);
  const busiestDay = plannedDays.reduce(
    (busiest, day) => (day.totalMinutes > busiest.totalMinutes ? day : busiest),
    plannedDays[0],
  );

  let tip = 'Empieza por los bloques de prioridad alta y deja los más livianos para el final.';
  if (!scheduled.length) {
    tip = 'No hay entregas ni pruebas en los próximos días. Aprovecha para repasar o descansar.';
  } else if (overdueCount) {
    tip = `Tienes ${pluralize(overdueCount, 'tarea atrasada', 'tareas atrasadas')}; el plan las pone primero.`;
  } else if (assessmentCount) {
    tip =
      `Hay ${pluralize(assessmentCount, 'evaluación próxima', 'evaluaciones próximas')}. ` +
      'Reserva los bloques de repaso.';
  } else if (busiestDay.totalMinutes >= 100) {
    tip = `${busiestDay.label} es el día más cargado. Divide el trabajo en pausas cortas.`;
  }

  return {
    days: plannedDays,
    totalItems: scheduled.length,
    totalMinutes,
    overdueCount,
    assessmentCount,
    busiestDay,
    tip,
  };
}
