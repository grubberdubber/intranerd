import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MONTHS,
  WEEKDAYS,
  average,
  capitalize,
  daysInMonth,
  daysUntil,
  formatDate,
  formatLongDate,
  formatNumber,
  initials,
  isSameDay,
  pluralize,
  relativeTime,
  round1,
  toDate,
  toISODate,
  truncate,
  weekdayIndexMonday,
} from '../../src/utils/format.js';

describe('utils/format · fechas', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('exporta los nombres en español', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0]).toBe('Enero');
    expect(MONTHS[8]).toBe('Septiembre');
    expect(WEEKDAYS).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
  });

  it('convierte strings ISO a fecha local sin desfase de zona horaria', () => {
    const date = toDate('2026-09-18');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(18);
  });

  it('convierte una fecha a ISO con ceros a la izquierda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate('2026-12-31')).toBe('2026-12-31');
    expect(toISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('calcula el índice de día con lunes = 0 y domingo = 6', () => {
    expect(weekdayIndexMonday('2026-09-14')).toBe(0); // lunes
    expect(weekdayIndexMonday('2026-09-18')).toBe(4); // viernes
    expect(weekdayIndexMonday('2026-09-20')).toBe(6); // domingo
  });

  it('calcula los días de cada mes, incluyendo bisiestos', () => {
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 3)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(31);
  });

  it('compara días ignorando la hora', () => {
    expect(isSameDay('2026-09-18', new Date(2026, 8, 18, 23, 59))).toBe(true);
    expect(isSameDay('2026-09-18', '2026-09-19')).toBe(false);
  });

  it('calcula días restantes con el reloj controlado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 18, 10, 0, 0));

    expect(daysUntil('2026-09-20')).toBe(2);
    expect(daysUntil('2026-09-18')).toBe(0);
    expect(daysUntil('2026-09-16')).toBe(-2);
    expect(daysUntil('no-es-fecha')).toBeNull();
  });

  it('formatea fechas en español y tolera valores vacíos o inválidos', () => {
    expect(formatDate('2026-09-18')).toMatch(/2026/);
    expect(formatLongDate('2026-09-18')).toMatch(/viernes/i);
    expect(formatLongDate('2026-09-18')).toMatch(/septiembre/i);
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
    expect(formatLongDate(undefined)).toBe('—');
  });

  it('describe tiempos relativos con Intl', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-18T12:00:00'));

    expect(relativeTime('2026-09-18T11:55:00')).toContain('5');
    expect(relativeTime('2026-09-18T12:00:00')).toMatch(/ahora|segundo/i);
    expect(relativeTime(null)).toBe('—');
    expect(relativeTime('no-es-fecha')).toBe('—');
  });
});

describe('utils/format · números y texto', () => {
  it('promedia solo valores finitos', () => {
    expect(average([6, 5, 4])).toBe(5);
    expect(average([6, Number.NaN, 5])).toBe(5.5);
    expect(average([])).toBeNull();
  });

  it('redondea a un decimal y formatea números', () => {
    expect(round1(4.26)).toBe(4.3);
    expect(round1(Number.NaN)).toBeNull();
    expect(formatNumber(5.67)).toBe('5.7');
    expect(formatNumber(6)).toBe('6.0');
    expect(formatNumber(Number.NaN)).toBe('—');
  });

  it('obtiene iniciales de hasta dos palabras', () => {
    expect(initials('Ana María Pérez')).toBe('AM');
    expect(initials('  Rodrigo  ')).toBe('R');
    expect(initials('')).toBe('');
  });

  it('trunca textos largos con elipsis', () => {
    expect(truncate('Hola mundo', 20)).toBe('Hola mundo');
    expect(truncate('Hola mundo', 6)).toBe('Hola…');
    expect(truncate('', 10)).toBe('');
  });

  it('pluraliza y capitaliza', () => {
    expect(pluralize(1, 'tarea')).toBe('1 tarea');
    expect(pluralize(2, 'tarea')).toBe('2 tareas');
    expect(pluralize(0, 'alumno', 'alumnos')).toBe('0 alumnos');
    expect(capitalize('septiembre')).toBe('Septiembre');
    expect(capitalize('')).toBe('');
  });
});
