import { describe, expect, it } from 'vitest';
import {
  filterLostFoundItems,
  filterMissingReports,
  matchesQuery,
  normalizeQuery,
  sortByNewest,
  sortMissingReports,
} from '../../src/utils/reports.js';

/**
 * Lógica pura compartida por las vistas de seguridad escolar y objetos
 * perdidos. Estos casos fijan el comportamiento de filtros y orden que la UI
 * usa al buscar y al mostrar primero los casos activos o más recientes.
 */

const MISSING = [
  {
    id: 'missing-1',
    name: 'Sofía Ramos',
    place: 'Patio central',
    contact: '+56 9 1234 5678',
    desc: 'Sudadera gris con capucha',
    found: false,
    createdAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'missing-2',
    name: 'Matías Oliva',
    place: 'Biblioteca',
    contact: 'Prof. López',
    desc: 'Camisa azul del uniforme',
    found: true,
    createdAt: '2026-03-09T10:00:00.000Z',
  },
  {
    id: 'missing-3',
    name: 'Antonia Vega',
    place: 'Gimnasio',
    contact: 'apoderado@colegio.cl',
    desc: 'Polerón rojo',
    found: false,
    createdAt: '2026-03-11T10:00:00.000Z',
  },
];

const LOST_FOUND = [
  {
    id: 'found-1',
    category: 'mochila',
    desc: 'Mochila azul con stickers',
    by: 'María Pérez',
    place: 'Patio central',
    contact: '+56 9 1234 5678',
    createdAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'found-2',
    category: 'tecnologia',
    desc: 'Audífonos blancos',
    by: 'Javier González',
    place: 'Aula 8',
    contact: 'javier@colegio.cl',
    createdAt: '2026-03-12T10:00:00.000Z',
  },
  {
    id: 'found-3',
    category: 'mochila',
    desc: 'Bolso deportivo negro',
    by: 'Conserjería',
    place: 'Gimnasio',
    contact: 'Mesa de entrada',
    createdAt: '2026-03-09T10:00:00.000Z',
  },
];

describe('utils/reports · normalización y coincidencias', () => {
  it('normaliza la búsqueda a minúsculas y sin espacios externos', () => {
    expect(normalizeQuery('  Sofía  ')).toBe('sofía');
    expect(normalizeQuery(null)).toBe('');
    expect(normalizeQuery(undefined)).toBe('');
    expect(normalizeQuery(42)).toBe('42');
  });

  it('trata una búsqueda vacía como coincidencia total', () => {
    expect(matchesQuery('', ['cualquier texto'])).toBe(true);
    expect(matchesQuery('   ', ['cualquier texto'])).toBe(true);
    expect(matchesQuery(null, [])).toBe(true);
  });

  it('busca sin distinguir mayúsculas/minúsculas y en cualquier campo', () => {
    expect(matchesQuery('SOFÍA', ['Sofía Ramos', 'Patio'])).toBe(true);
    expect(matchesQuery('patio', ['Sofía Ramos', 'Patio central'])).toBe(true);
    expect(matchesQuery('1234', ['+56 9 1234 5678'])).toBe(true);
    expect(matchesQuery('inexistente', ['Sofía Ramos', null, undefined])).toBe(false);
  });
});

describe('utils/reports · personas extraviadas', () => {
  it('ordena primero los casos activos y, dentro de cada grupo, el más reciente', () => {
    const sorted = sortMissingReports(MISSING);
    expect(sorted.map((report) => report.id)).toEqual(['missing-3', 'missing-1', 'missing-2']);
  });

  it('no muta el arreglo original al ordenar', () => {
    const original = MISSING.map((report) => report.id);
    sortMissingReports(MISSING);
    expect(MISSING.map((report) => report.id)).toEqual(original);
  });

  it('filtra por estado activo o encontrado', () => {
    expect(filterMissingReports(MISSING, { status: 'active' }).map((r) => r.id)).toEqual([
      'missing-3',
      'missing-1',
    ]);
    expect(filterMissingReports(MISSING, { status: 'found' }).map((r) => r.id)).toEqual([
      'missing-2',
    ]);
    expect(filterMissingReports(MISSING, { status: 'all' })).toHaveLength(3);
  });

  it('filtra por nombre, lugar, contacto o descripción', () => {
    expect(filterMissingReports(MISSING, { query: 'antonia' }).map((r) => r.id)).toEqual([
      'missing-3',
    ]);
    expect(filterMissingReports(MISSING, { query: 'biblioteca' }).map((r) => r.id)).toEqual([
      'missing-2',
    ]);
    expect(filterMissingReports(MISSING, { query: 'apoderado@' }).map((r) => r.id)).toEqual([
      'missing-3',
    ]);
    expect(filterMissingReports(MISSING, { query: 'polerón' }).map((r) => r.id)).toEqual([
      'missing-3',
    ]);
  });

  it('combina búsqueda y estado', () => {
    expect(
      filterMissingReports(MISSING, { query: 'gimnasio', status: 'active' }).map((r) => r.id),
    ).toEqual(['missing-3']);
    expect(filterMissingReports(MISSING, { query: 'gimnasio', status: 'found' })).toEqual([]);
  });

  it('devuelve un arreglo vacío si no hay coincidencias o no hay reportes', () => {
    expect(filterMissingReports(MISSING, { query: 'no existe' })).toEqual([]);
    expect(filterMissingReports([])).toEqual([]);
  });
});

describe('utils/reports · objetos perdidos y encontrados', () => {
  it('ordena por fecha de creación descendente sin mutar el original', () => {
    const original = LOST_FOUND.map((item) => item.id);
    const sorted = sortByNewest(LOST_FOUND);
    expect(sorted.map((item) => item.id)).toEqual(['found-2', 'found-1', 'found-3']);
    expect(LOST_FOUND.map((item) => item.id)).toEqual(original);
  });

  it('filtra por categoría', () => {
    expect(filterLostFoundItems(LOST_FOUND, { category: 'mochila' }).map((i) => i.id)).toEqual([
      'found-1',
      'found-3',
    ]);
    expect(filterLostFoundItems(LOST_FOUND, { category: 'tecnologia' }).map((i) => i.id)).toEqual([
      'found-2',
    ]);
    expect(filterLostFoundItems(LOST_FOUND, { category: 'otro' })).toEqual([]);
  });

  it('filtra por descripción, persona, lugar o contacto', () => {
    expect(filterLostFoundItems(LOST_FOUND, { query: 'audífonos' }).map((i) => i.id)).toEqual([
      'found-2',
    ]);
    expect(filterLostFoundItems(LOST_FOUND, { query: 'MARÍA' }).map((i) => i.id)).toEqual([
      'found-1',
    ]);
    expect(filterLostFoundItems(LOST_FOUND, { query: 'gimnasio' }).map((i) => i.id)).toEqual([
      'found-3',
    ]);
    expect(filterLostFoundItems(LOST_FOUND, { query: 'javier@' }).map((i) => i.id)).toEqual([
      'found-2',
    ]);
  });

  it('combina categoría y búsqueda', () => {
    expect(
      filterLostFoundItems(LOST_FOUND, { category: 'mochila', query: 'negro' }).map((i) => i.id),
    ).toEqual(['found-3']);
    expect(filterLostFoundItems(LOST_FOUND, { category: 'tecnologia', query: 'mochila' })).toEqual(
      [],
    );
  });

  it('mantiene todas las publicaciones con filtros por defecto', () => {
    expect(filterLostFoundItems(LOST_FOUND)).toHaveLength(3);
    expect(filterLostFoundItems([])).toEqual([]);
  });
});
