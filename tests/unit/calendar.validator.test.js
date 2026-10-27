import { describe, expect, it } from 'vitest';
import {
  calendarListQuery,
  calendarYearQuery,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../../backend/src/validators/calendar.validator.js';
import { dateOnly } from '../../backend/src/validators/common.js';

/**
 * Módulo 6 · Validación de fechas del calendario de pruebas.
 */
describe('validators/calendar · fechas', () => {
  it('acepta fechas reales en formato ISO', () => {
    expect(dateOnly.parse('2026-09-15')).toBe('2026-09-15');
    expect(dateOnly.parse('2024-02-29')).toBe('2024-02-29');
  });

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-04-31'])(
    'rechaza fechas inexistentes: %s',
    (date) => {
      expect(() => dateOnly.parse(date)).toThrow();
    },
  );

  it.each(['15-09-2026', '2026-9-1', '2026/09/15', 'sin-fecha'])(
    'rechaza formatos inválidos: %s',
    (date) => {
      expect(() => dateOnly.parse(date)).toThrow();
    },
  );
});

describe('validators/calendar · evento', () => {
  const validEvent = {
    title: 'Prueba de Matemática',
    description: 'Unidad de ecuaciones.',
    date: '2026-09-15',
    role: 'profesor',
    authorName: 'Carolina Méndez',
  };

  it('normaliza el rol en español a STUDENT/TEACHER', () => {
    expect(createCalendarEventSchema.parse(validEvent).role).toBe('TEACHER');
    expect(createCalendarEventSchema.parse({ ...validEvent, role: 'alumno' }).role).toBe('STUDENT');
    expect(createCalendarEventSchema.parse({ ...validEvent, role: 'ALUMNO' }).role).toBe('STUDENT');
  });

  it('acepta el evento completo', () => {
    const parsed = createCalendarEventSchema.parse(validEvent);
    expect(parsed).toMatchObject({
      title: 'Prueba de Matemática',
      date: '2026-09-15',
      role: 'TEACHER',
      authorName: 'Carolina Méndez',
    });
  });

  it('exige título, fecha, rol y autor', () => {
    expect(() => createCalendarEventSchema.parse({ ...validEvent, title: '' })).toThrow();
    expect(() => createCalendarEventSchema.parse({ ...validEvent, date: '' })).toThrow();
    expect(() => createCalendarEventSchema.parse({ ...validEvent, role: 'admin' })).toThrow();
    expect(() => createCalendarEventSchema.parse({ ...validEvent, authorName: '' })).toThrow();
  });

  it('trata la descripción vacía como opcional', () => {
    const parsed = createCalendarEventSchema.parse({ ...validEvent, description: '   ' });
    expect(parsed.description).toBeUndefined();
  });

  it('rechaza una actualización sin campos', () => {
    expect(() => updateCalendarEventSchema.parse({})).toThrow();
    expect(updateCalendarEventSchema.parse({ title: 'Nuevo título' }).title).toBe('Nuevo título');
  });
});

describe('validators/calendar · consultas', () => {
  it('valida el año entre 1900 y 2100', () => {
    expect(calendarYearQuery.parse({ year: '2026' }).year).toBe(2026);
    expect(() => calendarYearQuery.parse({ year: '1899' })).toThrow();
    expect(() => calendarYearQuery.parse({ year: '2101' })).toThrow();
  });

  it('usa el año actual cuando no se envía', () => {
    expect(calendarYearQuery.parse({}).year).toBe(new Date().getFullYear());
  });

  it('valida mes, fechas y rol en el listado', () => {
    expect(
      calendarListQuery.parse({
        year: '2026',
        month: '9',
        role: 'PROFESOR',
        from: '2026-09-01',
        to: '2026-09-30',
      }),
    ).toMatchObject({ year: 2026, month: 9, role: 'TEACHER' });
    expect(() => calendarListQuery.parse({ month: '13' })).toThrow();
    expect(() => calendarListQuery.parse({ from: '2026-02-30' })).toThrow();
  });
});
