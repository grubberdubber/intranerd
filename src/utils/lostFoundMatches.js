import { LOSTFOUND_CATEGORIES } from '../data/constants.js';
import { toDate } from './format.js';

/**
 * Coincidencias sugeridas entre objetos encontrados y avisos de perdidos.
 *
 * No es un motor de IA: compara datos que ya existen (categoría, palabras de la
 * descripción, lugar y fechas) y devuelve una puntuación explicable. La persona
 * siempre confirma antes de entregar un objeto.
 */

const CATEGORY_MAP = Object.fromEntries(
  LOSTFOUND_CATEGORIES.map((category) => [category.id, category]),
);

const STOPWORDS = new Set([
  'con',
  'sin',
  'para',
  'por',
  'una',
  'uno',
  'unos',
  'unas',
  'del',
  'las',
  'los',
  'que',
  'como',
  'muy',
  'mas',
  'pero',
  'esta',
  'este',
  'estos',
  'estas',
  'tiene',
  'tienen',
  'desde',
  'entre',
  'sobre',
  'hacia',
  'donde',
  'cuando',
  'porque',
  'tambien',
  'solo',
  'todo',
  'toda',
  'todos',
  'todas',
]);

/** Normaliza texto para comparar sin acentos ni mayúsculas. */
export function normalizeMatchText(value = '') {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Convierte una descripción o lugar en palabras significativas únicas. */
export function tokenizeMatchText(value = '') {
  return [
    ...new Set(
      normalizeMatchText(value)
        .split(' ')
        .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
    ),
  ];
}

function sharedWords(first = [], second = []) {
  const secondSet = new Set(second);
  return first.filter((word) => secondSet.has(word));
}

function daysBetween(first, second) {
  const a = toDate(first);
  const b = toDate(second);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 86_400_000));
}

function scorePair(found, lost) {
  const categoryMatch = Boolean(found.category) && found.category === lost.category;
  if (!categoryMatch) return null;

  const foundWords = tokenizeMatchText(found.desc);
  const lostWords = tokenizeMatchText(lost.desc);
  const commonWords = sharedWords(foundWords, lostWords);

  const foundPlace = normalizeMatchText(found.place);
  const lostPlace = normalizeMatchText(lost.place);
  const exactPlace = Boolean(foundPlace && lostPlace && foundPlace === lostPlace);
  const relatedPlaceWords = sharedWords(
    tokenizeMatchText(found.place),
    tokenizeMatchText(lost.place),
  );

  // La categoría sola no basta: evita sugerir todos los objetos de un mismo
  // tipo aunque no compartan ninguna pista concreta.
  if (!commonWords.length && !exactPlace && !relatedPlaceWords.length) return null;

  let score = 45;
  score += Math.min(commonWords.length * 8, 28);
  if (exactPlace) score += 15;
  else if (relatedPlaceWords.length) score += 8;

  const distance = daysBetween(found.createdAt, lost.createdAt);
  if (distance !== null) {
    if (distance <= 3) score += 10;
    else if (distance <= 14) score += 5;
  }
  score = Math.min(100, Math.round(score));

  const category = CATEGORY_MAP[found.category] || CATEGORY_MAP.otro;
  const reasons = [`Misma categoría: ${category?.label || found.category}`];
  if (commonWords.length) {
    reasons.push(`Coinciden en: ${commonWords.slice(0, 4).join(', ')}`);
  }
  if (exactPlace) reasons.push(`Mismo lugar: ${found.place}`);
  else if (relatedPlaceWords.length) {
    reasons.push(`Lugares relacionados: ${relatedPlaceWords.slice(0, 2).join(', ')}`);
  }
  if (distance !== null && distance <= 14) {
    reasons.push(
      distance === 0
        ? 'Publicados el mismo día'
        : `Publicados con ${distance} ${distance === 1 ? 'día' : 'días'} de diferencia`,
    );
  }

  return {
    id: `${found.id}::${lost.id}`,
    found,
    lost,
    score,
    reasons,
  };
}

/**
 * Devuelve las mejores coincidencias entre ambas bandejas, sin repetir pares y
 * excluyendo publicaciones ya resueltas.
 *
 * @param {Array} foundItems
 * @param {Array} lostItems
 * @param {{ limit?: number }} [options]
 */
export function findLostFoundMatches(foundItems = [], lostItems = [], { limit = 3 } = {}) {
  const safeLimit = Math.max(0, Math.min(Number.isInteger(limit) ? limit : 3, 20));
  if (!safeLimit) return [];

  const openFound = foundItems.filter((item) => item && !item.resolved);
  const openLost = lostItems.filter((item) => item && !item.resolved);
  if (!openFound.length || !openLost.length) return [];

  const matches = [];
  openFound.forEach((found) => {
    openLost.forEach((lost) => {
      const match = scorePair(found, lost);
      if (match) matches.push(match);
    });
  });

  return matches
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(b.found.createdAt).localeCompare(String(a.found.createdAt)) ||
        String(a.found.id).localeCompare(String(b.found.id)),
    )
    .slice(0, safeLimit);
}
