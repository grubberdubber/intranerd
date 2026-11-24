import { SCHEDULE_DAYS } from '../data/constants.js';

/**
 * Utilidades puras del horario semanal.
 * Se mantienen separadas de la vista para poder probar los cálculos de
 * duración, orden, cruces de horario y próxima clase sin tocar el DOM.
 */

const DAY_IDS = new Set(SCHEDULE_DAYS.map((day) => day.id));
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function dayLabel(dayId) {
  return SCHEDULE_DAYS.find((day) => day.id === Number(dayId))?.label || '';
}

export function timeToMinutes(value) {
  const match = TIME_PATTERN.exec(String(value || '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function durationMinutes(block) {
  const start = timeToMinutes(block?.start);
  const end = timeToMinutes(block?.end);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
}

export function formatDuration(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function formatTimeRange(block) {
  if (!block?.start || !block?.end) return '';
  return `${block.start} – ${block.end}`;
}

export function intervalsOverlap(first, second) {
  const firstStart = timeToMinutes(first.start);
  const firstEnd = timeToMinutes(first.end);
  const secondStart = timeToMinutes(second.start);
  const secondEnd = timeToMinutes(second.end);
  if ([firstStart, firstEnd, secondStart, secondEnd].some((value) => value === null)) {
    return false;
  }
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function sortBlocks(blocks = []) {
  return blocks
    .slice()
    .sort(
      (a, b) =>
        Number(a.day) - Number(b.day) ||
        (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0),
    );
}

export function blocksForDay(blocks = [], dayId) {
  return sortBlocks(blocks).filter((block) => Number(block.day) === Number(dayId));
}

export function weeklySummary(blocks = []) {
  const subjects = new Set(
    blocks.map((block) => String(block.subject || '').trim()).filter(Boolean),
  );
  return {
    count: blocks.length,
    minutes: blocks.reduce((total, block) => total + durationMinutes(block), 0),
    subjects: subjects.size,
  };
}

/**
 * La semana visible empieza el lunes y, durante el fin de semana, muestra la
 * semana que viene para que el horario siga siendo útil.
 */
export function scheduleWeekStart(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  if (weekday === 0) start.setDate(start.getDate() + 1);
  else if (weekday === 6) start.setDate(start.getDate() + 2);
  else start.setDate(start.getDate() - (weekday - 1));
  return start;
}

export function scheduleWeekDates(date = new Date()) {
  const start = scheduleWeekStart(date);
  return SCHEDULE_DAYS.map((day) => {
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    current.setDate(current.getDate() + day.id - 1);
    return { ...day, date: current };
  });
}

export function formatScheduleWeek(date = new Date()) {
  const dates = scheduleWeekDates(date);
  const start = dates[0].date;
  const end = dates[dates.length - 1].date;
  const startLabel = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
  }).format(end);
  return `${startLabel} al ${endLabel}`;
}

export function formatDayDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}

export function isScheduleDayToday(dayId, now = new Date()) {
  const weekday = now.getDay();
  return weekday >= 1 && weekday <= 5 && weekday === Number(dayId);
}

export function normalizeScheduleInput(input = {}) {
  return {
    day: Number(input.day),
    start: String(input.start || '').trim(),
    end: String(input.end || '').trim(),
    subject: String(input.subject || '').trim(),
    teacher: String(input.teacher || '').trim(),
    room: String(input.room || '').trim(),
  };
}

/**
 * Devuelve errores por campo para que la vista pueda asociarlos al input
 * correspondiente y el servicio rechace datos inválidos aunque no haya UI.
 */
export function validateScheduleInput(input = {}, blocks = [], excludeId = null) {
  const data = normalizeScheduleInput(input);
  const errors = {};

  if (!DAY_IDS.has(data.day)) {
    errors.day = 'Elige un día de lunes a viernes.';
  }

  const start = timeToMinutes(data.start);
  const end = timeToMinutes(data.end);
  if (start === null) errors.start = 'Indica una hora de inicio válida.';
  if (end === null) errors.end = 'Indica una hora de término válida.';
  if (start !== null && end !== null && end <= start) {
    errors.end = 'La hora de término debe ser posterior a la de inicio.';
  }

  if (!data.subject) {
    errors.subject = 'Escribe la asignatura o actividad.';
  } else if (data.subject.length > 80) {
    errors.subject = 'Usa como máximo 80 caracteres.';
  }

  if (data.teacher.length > 80) errors.teacher = 'Usa como máximo 80 caracteres.';
  if (data.room.length > 80) errors.room = 'Usa como máximo 80 caracteres.';

  if (!Object.keys(errors).length) {
    const overlap = blocks.find(
      (block) =>
        block.id !== excludeId && Number(block.day) === data.day && intervalsOverlap(block, data),
    );
    if (overlap) {
      errors.start = `Se cruza con "${overlap.subject}" (${overlap.start} – ${overlap.end}).`;
    }
  }

  return errors;
}

/**
 * Devuelve la clase en curso o la siguiente de la semana.
 * `status`: ongoing (en curso), today (más tarde hoy) o upcoming (otro día).
 */
export function currentOrNextBlock(blocks = [], now = new Date()) {
  const weekday = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (weekday >= 1 && weekday <= 5) {
    const today = blocksForDay(blocks, weekday);
    const ongoing = today.find(
      (block) => timeToMinutes(block.start) <= nowMinutes && nowMinutes < timeToMinutes(block.end),
    );
    if (ongoing) return { block: ongoing, status: 'ongoing', dayOffset: 0 };

    const later = today.find((block) => timeToMinutes(block.start) > nowMinutes);
    if (later) return { block: later, status: 'today', dayOffset: 0 };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const futureWeekday = future.getDay();
    if (futureWeekday < 1 || futureWeekday > 5) continue;
    const next = blocksForDay(blocks, futureWeekday);
    if (next.length) {
      return {
        block: next[0],
        status: offset === 1 ? 'tomorrow' : 'upcoming',
        dayOffset: offset,
      };
    }
  }

  return null;
}
