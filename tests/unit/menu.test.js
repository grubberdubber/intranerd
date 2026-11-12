import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MENU_ROTATIONS } from '../../src/data/menu.js';
import { installFakeBrowser } from './helpers/fake-browser.js';

let browser;
let menuService;

async function loadService() {
  vi.resetModules();
  browser = installFakeBrowser();
  menuService = await import('../../src/services/menu.js');
  return menuService;
}

afterEach(() => {
  browser?.restore();
});

describe('utils/menu · semanas y rotación', () => {
  it('calcula la semana ISO y el lunes de una fecha', async () => {
    const { isoWeekKey, startOfWeek } = await import('../../src/utils/menu.js');
    const wednesday = new Date(2026, 10, 12);

    expect(isoWeekKey(wednesday)).toBe('2026-W46');
    expect(startOfWeek(wednesday).getDay()).toBe(1);
    expect(startOfWeek(wednesday).getDate()).toBe(9);
  });

  it('genera los cinco días hábiles con fechas consecutivas', async () => {
    const { weekDays } = await import('../../src/utils/menu.js');
    const days = weekDays(new Date(2026, 10, 12));

    expect(days.map((day) => day.id)).toEqual([
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
    ]);
    expect(days[0].date).toBe('2026-11-09');
    expect(days[4].date).toBe('2026-11-13');
  });

  it('rota el menú cada semana y asigna todos los días', async () => {
    const { menuForWeek, rotationForWeek } = await import('../../src/utils/menu.js');
    const current = menuForWeek(new Date(2026, 10, 9), MENU_ROTATIONS);
    const next = menuForWeek(new Date(2026, 10, 16), MENU_ROTATIONS);

    expect(current.rotation).toBeTruthy();
    expect(current.days).toHaveLength(5);
    expect(current.days.every((day) => day.menu?.main)).toBe(true);
    expect(next.rotation.id).not.toBe(current.rotation.id);
    expect(rotationForWeek(new Date(2026, 10, 9), MENU_ROTATIONS)).toBe(current.rotation);
  });

  it('filtra comentarios por semana y día, y deja el más reciente primero', async () => {
    const { commentsFor, commentCount, latestComment } = await import(
      '../../src/utils/menu.js'
    );
    const comments = [
      { id: 'a', weekKey: '2026-W46', dayId: 'lunes', createdAt: '2026-11-10T10:00:00Z' },
      { id: 'b', weekKey: '2026-W46', dayId: 'lunes', createdAt: '2026-11-12T10:00:00Z' },
      { id: 'c', weekKey: '2026-W45', dayId: 'lunes', createdAt: '2026-11-05T10:00:00Z' },
      { id: 'd', weekKey: '2026-W46', dayId: 'martes', createdAt: '2026-11-12T10:00:00Z' },
    ];

    expect(commentsFor(comments, '2026-W46', 'lunes').map((comment) => comment.id)).toEqual([
      'b',
      'a',
    ]);
    expect(commentCount(comments, '2026-W46', 'lunes')).toBe(2);
    expect(latestComment(comments, '2026-W46', 'lunes').id).toBe('b');
  });
});

describe('services/menu · comentarios persistentes', () => {
  beforeEach(async () => {
    await loadService();
  });

  it('siembra comentarios de la semana actual', () => {
    const comments = menuService.listMenuComments();
    expect(comments).toHaveLength(3);
    expect(comments.map((comment) => comment.dayId)).toEqual(
      expect.arrayContaining(['lunes', 'miercoles', 'viernes']),
    );
  });

  it('publica un comentario válido y lo deja primero', () => {
    const created = menuService.addMenuComment({
      weekKey: '2026-W46',
      dayId: 'jueves',
      type: 'sugerencia',
      body: '  ¿Podrían incluir más fruta de estación?  ',
      author: '  Camila  ',
      role: 'alumno',
    });

    expect(created.body).toBe('¿Podrían incluir más fruta de estación?');
    expect(created.author).toBe('Camila');
    expect(menuService.listMenuComments()[0]).toEqual(created);
  });

  it('rechaza semana, día, tipo o texto inválidos', () => {
    expect(() =>
      menuService.addMenuComment({ weekKey: 'semana', dayId: 'lunes', body: 'Hola' }),
    ).toThrow(/semana/i);
    expect(() =>
      menuService.addMenuComment({ weekKey: '2026-W46', dayId: 'sábado', body: 'Hola' }),
    ).toThrow(/día/i);
    expect(() =>
      menuService.addMenuComment({
        weekKey: '2026-W46',
        dayId: 'lunes',
        type: 'queja',
        body: 'Hola',
      }),
    ).toThrow(/comentario/i);
    expect(() =>
      menuService.addMenuComment({ weekKey: '2026-W46', dayId: 'lunes', body: '  ' }),
    ).toThrow(/3 caracteres/i);
  });
});
