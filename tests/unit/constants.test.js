import { describe, expect, it } from 'vitest';
import {
  ANNOUNCEMENT_CATEGORIES,
  AUTHOR_ROLES,
  GRADE_SCALE,
  HOLIDAYS,
  LOSTFOUND_CATEGORIES,
  NAV_ITEMS,
  PRIORITIES,
  STORAGE_KEYS,
  SUBJECTS,
  WORKSHOP_CATEGORIES,
} from '../../src/data/constants.js';
import { daysInMonth } from '../../src/utils/format.js';

describe('data/constants · navegación', () => {
  it('define los 9 módulos de la plataforma', () => {
    expect(NAV_ITEMS).toHaveLength(9);
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      'dashboard',
      'grades',
      'missing',
      'teachers',
      'lostfound',
      'calendar',
      'workshops',
      'announcements',
      'tasks',
    ]);
  });

  it('usa rutas e identificadores únicos', () => {
    expect(new Set(NAV_ITEMS.map((item) => item.path)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((item) => item.id)).size).toBe(NAV_ITEMS.length);
    NAV_ITEMS.forEach((item) => {
      expect(item.path).toMatch(/^\//);
      expect(item.label.length).toBeGreaterThan(3);
      expect(item.icon.length).toBeGreaterThan(2);
    });
  });
});

describe('data/constants · escala y catálogos', () => {
  it('define la escala chilena de notas', () => {
    expect(GRADE_SCALE).toEqual({ min: 1, max: 7, passing: 4 });
  });

  it('incluye las asignaturas y categorías base', () => {
    expect(SUBJECTS).toContain('Matemáticas');
    expect(SUBJECTS).toContain('Lenguaje y Comunicación');
    expect(WORKSHOP_CATEGORIES.map((category) => category.id)).toContain('programacion');
    expect(LOSTFOUND_CATEGORIES.map((category) => category.id)).toEqual([
      'mochila',
      'llaves',
      'cuaderno',
      'tecnologia',
      'ropa',
      'otro',
    ]);
    expect(ANNOUNCEMENT_CATEGORIES.map((category) => category.id)).toContain('urgente');
    expect(AUTHOR_ROLES.map((role) => role.id)).toContain('direccion');
    expect(PRIORITIES.map((priority) => priority.id)).toEqual(['alta', 'media', 'baja']);
  });

  it('define claves de almacenamiento únicas y con espacio de nombres', () => {
    const keys = Object.values(STORAGE_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^[a-z]+\.[a-z]+$/));
  });
});

describe('data/constants · feriados', () => {
  it('solo contiene meses y días válidos para cualquier año', () => {
    Object.entries(HOLIDAYS).forEach(([month, days]) => {
      expect(Number(month)).toBeGreaterThanOrEqual(1);
      expect(Number(month)).toBeLessThanOrEqual(12);
      days.forEach((day) => {
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(daysInMonth(2026, Number(month) - 1));
      });
    });
  });

  it('marca las Fiestas Patrias y Navidad', () => {
    expect(HOLIDAYS[9]).toEqual([18, 19]);
    expect(HOLIDAYS[12]).toContain(25);
    expect(HOLIDAYS[1]).toContain(1);
  });
});
