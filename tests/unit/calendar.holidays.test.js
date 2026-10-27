import { describe, expect, it } from 'vitest';
import { holidaysForYear } from '../../backend/src/services/calendar.service.js';

/**
 * Módulo 6 · Calendario escolar.
 * Valida feriados fijos chilenos y los móviles derivados de Pascua.
 */
describe('calendar.service · feriados de Chile', () => {
  it('incluye los feriados fijos de septiembre y Navidad', () => {
    const holidays = holidaysForYear(2026);
    const byDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));

    expect(byDate.get('2026-09-18')).toMatchObject({
      name: 'Independencia Nacional',
      type: 'HOLIDAY',
    });
    expect(byDate.get('2026-09-19')).toMatchObject({
      name: 'Glorias del Ejército',
      type: 'HOLIDAY',
    });
    expect(byDate.get('2026-12-25').name).toBe('Navidad');
    expect(byDate.get('2026-01-01').name).toBe('Año Nuevo');
    expect(byDate.get('2026-05-21').name).toBe('Día de las Glorias Navales');
  });

  it('calcula correctamente Viernes Santo y Sábado Santo', () => {
    const byDate = (year) =>
      new Map(holidaysForYear(year).map((holiday) => [holiday.date, holiday.name]));

    // Pascua 2026: domingo 5 de abril.
    expect(byDate(2026).get('2026-04-03')).toBe('Viernes Santo');
    expect(byDate(2026).get('2026-04-04')).toBe('Sábado Santo');

    // Pascua 2024: domingo 31 de marzo.
    expect(byDate(2024).get('2024-03-29')).toBe('Viernes Santo');
    expect(byDate(2024).get('2024-03-30')).toBe('Sábado Santo');

    // Pascua 2025: domingo 20 de abril.
    expect(byDate(2025).get('2025-04-18')).toBe('Viernes Santo');
    expect(byDate(2025).get('2025-04-19')).toBe('Sábado Santo');
  });

  it('devuelve 13 feriados fijos + 2 móviles, ordenados y sin duplicados', () => {
    const holidays = holidaysForYear(2026);
    const dates = holidays.map((holiday) => holiday.date);

    expect(holidays).toHaveLength(15);
    expect(new Set(dates).size).toBe(15);
    expect([...dates].sort()).toEqual(dates);
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
    expect(holidays.every((holiday) => holiday.type === 'HOLIDAY')).toBe(true);
  });

  it('adapta los feriados móviles a cada año', () => {
    const years = [2023, 2024, 2025, 2026, 2027];
    for (const year of years) {
      const dates = holidaysForYear(year).map((holiday) => holiday.date);
      expect(dates.every((date) => date.startsWith(String(year)))).toBe(true);
      expect(dates).toContain(`${year}-09-18`);
      expect(dates).toContain(`${year}-12-25`);
    }
  });
});
