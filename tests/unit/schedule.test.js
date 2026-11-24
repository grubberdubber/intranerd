import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser } from './helpers/fake-browser.js';
import {
  blocksForDay,
  currentOrNextBlock,
  durationMinutes,
  formatDuration,
  scheduleWeekDates,
  validateScheduleInput,
  weeklySummary,
} from '../../src/utils/schedule.js';

const MONDAY_BLOCK = {
  id: 'block-a',
  day: 1,
  start: '08:00',
  end: '09:30',
  subject: 'Matemáticas',
};
const TUESDAY_BLOCK = {
  id: 'block-b',
  day: 2,
  start: '09:45',
  end: '11:15',
  subject: 'Lenguaje',
};

describe('utils/schedule · bloques y validación', () => {
  it('ordena los bloques del día y calcula la carga semanal', () => {
    const blocks = [
      { ...MONDAY_BLOCK, id: 'late', start: '14:00', end: '15:30' },
      MONDAY_BLOCK,
      TUESDAY_BLOCK,
    ];

    expect(blocksForDay(blocks, 1).map((block) => block.id)).toEqual(['block-a', 'late']);
    expect(durationMinutes(MONDAY_BLOCK)).toBe(90);
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(weeklySummary(blocks)).toEqual({ count: 3, minutes: 270, subjects: 2 });
  });

  it('acepta un bloque válido y detecta cruces de horario', () => {
    expect(
      validateScheduleInput({ day: 1, start: '10:00', end: '11:30', subject: 'Historia' }, [
        MONDAY_BLOCK,
      ]),
    ).toEqual({});

    const overlap = validateScheduleInput(
      { day: 1, start: '09:00', end: '10:00', subject: 'Historia' },
      [MONDAY_BLOCK],
    );
    expect(overlap.start).toMatch(/cruza/i);
  });

  it('rechaza días, horas y asignaturas inválidas', () => {
    expect(validateScheduleInput({ day: 9, start: '08:00', end: '09:00' }).day).toMatch(
      /lunes a viernes/i,
    );
    expect(validateScheduleInput({ day: 1, start: '8:00', end: '09:00' }).start).toMatch(
      /inicio válida/i,
    );
    expect(validateScheduleInput({ day: 1, start: '10:00', end: '09:00' }).end).toMatch(
      /posterior/i,
    );
    expect(validateScheduleInput({ day: 1, start: '08:00', end: '09:00' }).subject).toMatch(
      /asignatura/i,
    );
  });

  it('muestra la semana del lunes al viernes y adelanta el fin de semana', () => {
    expect(scheduleWeekDates(new Date(2026, 10, 24)).map((day) => day.id)).toEqual([1, 2, 3, 4, 5]);
    expect(scheduleWeekDates(new Date(2026, 10, 24))[0].date.getDate()).toBe(23);

    const weekend = scheduleWeekDates(new Date(2026, 10, 29));
    expect(weekend[0].date.getDate()).toBe(30);
    expect(weekend[0].date.getMonth()).toBe(10);
    expect(weekend[4].date.getDate()).toBe(4);
    expect(weekend[4].date.getMonth()).toBe(11);
  });
});

describe('utils/schedule · próxima clase', () => {
  const blocks = [MONDAY_BLOCK, TUESDAY_BLOCK];

  it('detecta la clase en curso y la siguiente del mismo día', () => {
    const ongoing = currentOrNextBlock(blocks, new Date(2026, 10, 23, 8, 30));
    expect(ongoing).toMatchObject({ status: 'ongoing', dayOffset: 0 });
    expect(ongoing.block.id).toBe('block-a');

    const later = currentOrNextBlock(blocks, new Date(2026, 10, 23, 7, 30));
    expect(later).toMatchObject({ status: 'today', dayOffset: 0 });
    expect(later.block.id).toBe('block-a');
  });

  it('salta al día siguiente y al lunes cuando termina la semana', () => {
    const tomorrow = currentOrNextBlock(blocks, new Date(2026, 10, 23, 12, 0));
    expect(tomorrow).toMatchObject({ status: 'tomorrow', dayOffset: 1 });
    expect(tomorrow.block.id).toBe('block-b');

    const monday = currentOrNextBlock(blocks, new Date(2026, 10, 28, 12, 0));
    expect(monday.status).toBe('upcoming');
    expect(monday.dayOffset).toBe(2);
    expect(monday.block.id).toBe('block-a');
  });

  it('devuelve null si no hay bloques', () => {
    expect(currentOrNextBlock([], new Date(2026, 10, 23, 8, 0))).toBeNull();
  });
});

describe('services/schedule · persistencia local', () => {
  let browser;
  let service;

  beforeEach(async () => {
    vi.resetModules();
    browser = installFakeBrowser();
    service = await import('../../src/services/schedule.js');
  });

  afterEach(() => {
    browser.restore();
  });

  it('siembra el horario demo y crea un bloque', () => {
    expect(service.listScheduleBlocks()).toHaveLength(20);

    const created = service.createScheduleBlock({
      day: 1,
      start: '16:00',
      end: '17:30',
      subject: '  Taller de prueba  ',
      teacher: 'Prof. E2E',
      room: 'Sala 3',
    });

    expect(created.subject).toBe('Taller de prueba');
    expect(service.listScheduleBlocks()).toHaveLength(21);
    expect(service.listScheduleBlocks().find((block) => block.id === created.id).subject).toBe(
      'Taller de prueba',
    );
  });

  it('actualiza y elimina un bloque persistido', () => {
    const created = service.createScheduleBlock({
      day: 2,
      start: '16:00',
      end: '17:30',
      subject: 'Robótica',
    });
    const updated = service.updateScheduleBlock(created.id, { room: 'Laboratorio 2' });
    expect(updated.room).toBe('Laboratorio 2');
    expect(service.listScheduleBlocks().find((block) => block.id === created.id).room).toBe(
      'Laboratorio 2',
    );

    service.deleteScheduleBlock(created.id);
    expect(service.listScheduleBlocks()).toHaveLength(20);
  });

  it('rechaza cruces con los datos ya guardados', () => {
    expect(() =>
      service.createScheduleBlock({
        day: 1,
        start: '08:30',
        end: '09:00',
        subject: 'Choque',
      }),
    ).toThrow(service.ScheduleValidationError);

    try {
      service.createScheduleBlock({
        day: 1,
        start: '08:30',
        end: '09:00',
        subject: 'Choque',
      });
    } catch (error) {
      expect(error.fields.start).toMatch(/cruza/i);
    }
  });
});
