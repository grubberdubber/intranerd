import { describe, expect, it } from 'vitest';
import {
  findLostFoundMatches,
  normalizeMatchText,
  tokenizeMatchText,
} from '../../src/utils/lostFoundMatches.js';

const FOUND = {
  id: 'found-1',
  category: 'mochila',
  desc: 'Mochila azul con stickers de astronautas y etiqueta J.P.',
  by: 'María Pérez',
  place: 'Patio central',
  contact: '+56 9 1234 5678',
  resolved: false,
  createdAt: '2026-03-10T10:00:00.000Z',
};

const LOST_MATCH = {
  id: 'lost-1',
  category: 'mochila',
  desc: 'Mochila azul con stickers de astronautas, etiqueta J.P.',
  by: 'Javiera P.',
  place: 'Patio central',
  contact: 'javiera@colegio.cl',
  resolved: false,
  createdAt: '2026-03-11T10:00:00.000Z',
};

describe('utils/lostFoundMatches · normalización', () => {
  it('compara sin acentos ni mayúsculas', () => {
    expect(normalizeMatchText('  Audífonos BLANCOS  ')).toBe('audifonos blancos');
    expect(normalizeMatchText(null)).toBe('');
  });

  it('descarta palabras vacías y conserva términos útiles', () => {
    expect(tokenizeMatchText('Mochila de color azul con stickers')).toEqual([
      'mochila',
      'color',
      'azul',
      'stickers',
    ]);
  });
});

describe('utils/lostFoundMatches · coincidencias explicables', () => {
  it('encuentra el par más parecido y explica por qué', () => {
    const [match] = findLostFoundMatches([FOUND], [LOST_MATCH]);

    expect(match.found.id).toBe('found-1');
    expect(match.lost.id).toBe('lost-1');
    expect(match.score).toBeGreaterThanOrEqual(80);
    expect(match.reasons).toEqual(
      expect.arrayContaining([
        'Misma categoría: Mochila / bolso',
        expect.stringContaining('Coinciden en:'),
        'Mismo lugar: Patio central',
      ]),
    );
  });

  it('no sugiere objetos de categorías distintas aunque compartan palabras', () => {
    const lost = { ...LOST_MATCH, category: 'tecnologia' };
    expect(findLostFoundMatches([FOUND], [lost])).toEqual([]);
  });

  it('exige una pista concreta además de la categoría', () => {
    const lost = {
      ...LOST_MATCH,
      desc: 'Objeto extraviado en el colegio',
      place: 'Laboratorio',
      createdAt: '2026-03-11T10:00:00.000Z',
    };
    expect(findLostFoundMatches([FOUND], [lost])).toEqual([]);
  });

  it('reconoce palabras con distinta acentuación', () => {
    const found = {
      ...FOUND,
      category: 'tecnologia',
      desc: 'Audífonos inalámbricos blancos',
      place: 'Aula 8',
    };
    const lost = {
      ...LOST_MATCH,
      category: 'tecnologia',
      desc: 'Audifonos inalambricos blancos',
      place: 'Aula 8',
    };
    expect(findLostFoundMatches([found], [lost])).toHaveLength(1);
  });

  it('excluye publicaciones resueltas y respeta el límite', () => {
    const foundResolved = { ...FOUND, resolved: true };
    expect(findLostFoundMatches([foundResolved], [LOST_MATCH])).toEqual([]);

    const secondFound = {
      ...FOUND,
      id: 'found-2',
      desc: 'Mochila azul con stickers',
    };
    const matches = findLostFoundMatches([FOUND, secondFound], [LOST_MATCH], { limit: 1 });
    expect(matches).toHaveLength(1);
    expect(matches[0].found.id).toBe('found-1');
  });

  it('devuelve una lista vacía sin publicaciones abiertas', () => {
    expect(findLostFoundMatches([], [LOST_MATCH])).toEqual([]);
    expect(findLostFoundMatches([FOUND], [])).toEqual([]);
  });
});
