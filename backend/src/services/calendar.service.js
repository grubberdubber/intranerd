import { calendarRepository } from '../repositories/calendar.repository.js';
import { ApiError } from '../utils/ApiError.js';

const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: 'Año Nuevo' },
  { month: 5, day: 1, name: 'Día Nacional del Trabajo' },
  { month: 5, day: 21, name: 'Día de las Glorias Navales' },
  { month: 6, day: 29, name: 'San Pedro y San Pablo' },
  { month: 7, day: 16, name: 'Día de la Virgen del Carmen' },
  { month: 8, day: 15, name: 'Asunción de la Virgen' },
  { month: 9, day: 18, name: 'Independencia Nacional' },
  { month: 9, day: 19, name: 'Glorias del Ejército' },
  { month: 10, day: 12, name: 'Encuentro de Dos Mundos' },
  { month: 10, day: 31, name: 'Día de las Iglesias Evangélicas y Protestantes' },
  { month: 11, day: 1, name: 'Todos los Santos' },
  { month: 12, day: 8, name: 'Inmaculada Concepción' },
  { month: 12, day: 25, name: 'Navidad' },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function shiftDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Algoritmo gregoriano de Meeus/Jones/Butcher para la Pascua. */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Festivos chilenos fijos + los móviles derivados de Pascua. */
export function holidaysForYear(year) {
  const holidays = FIXED_HOLIDAYS.map((holiday) => ({
    date: `${year}-${pad(holiday.month)}-${pad(holiday.day)}`,
    name: holiday.name,
    type: 'HOLIDAY',
  }));

  const easter = easterSunday(year);
  holidays.push({
    date: formatDate(shiftDays(easter, -2)),
    name: 'Viernes Santo',
    type: 'HOLIDAY',
  });
  holidays.push({
    date: formatDate(shiftDays(easter, -1)),
    name: 'Sábado Santo',
    type: 'HOLIDAY',
  });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

export const calendarService = {
  getYear(year) {
    return {
      year,
      holidays: holidaysForYear(year),
      events: calendarRepository.list({ year, limit: 2000 }),
    };
  },

  listEvents(query) {
    return calendarRepository.list(query);
  },

  getEvent(id) {
    const event = calendarRepository.findById(id);
    if (!event) throw ApiError.notFound('La evaluación solicitada no existe.');
    return event;
  },

  createEvent(payload) {
    return calendarRepository.create(payload);
  },

  updateEvent(id, payload) {
    this.getEvent(id);
    return calendarRepository.update(id, payload);
  },

  removeEvent(id) {
    if (!calendarRepository.remove(id)) {
      throw ApiError.notFound('La evaluación solicitada no existe.');
    }
  },
};
