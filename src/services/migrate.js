import { STORAGE_KEYS } from '../data/constants.js';
import { storage } from './storage.js';
import { uid } from '../utils/id.js';

/**
 * Migración de datos desde los HTML originales (carpeta /legacy).
 *
 * Los módulos antiguos guardaban la información con claves y formatos propios.
 * Esta migración se ejecuta una sola vez, antes de que los repositorios siembren
 * datos de demostración, para no perder el trabajo que ya existía en el navegador.
 */

const MIGRATION_KEY = 'migration.legacy.v1';

const LEGACY_KEYS = {
  teachers: 'intra_professors_v1',
  missing: 'intranerd_missing_v1',
  found: 'intra_found_v3',
  lost: 'intra_lost_v3',
};

function readLegacy(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`[IntraNerd] No se pudo leer el dato antiguo "${key}".`, error);
    return null;
  }
}

/**
 * Convierte fechas del formato local antiguo (dd-mm-yyyy hh:mm) a ISO.
 * Si no es posible interpretarla, usa la fecha actual para no romper la UI.
 */
function normalizeDate(value) {
  if (!value) return new Date().toISOString();

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const match = String(value).match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (match) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return new Date().toISOString();
}

function clampRating(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function migrateTeachers(items) {
  return items
    .filter((item) => item && (item.name || item.subject))
    .map((item) => ({
      id: item.id || uid('teacher'),
      name: item.name || 'Profesor/a sin nombre',
      subject: item.subject || '',
      photo: item.photo || null,
      reviews: Array.isArray(item.reviews)
        ? item.reviews.map((review) => ({
            id: review.id || uid('review'),
            student: review.student || 'Anónimo',
            rating: clampRating(review.rating),
            text: review.text || '',
            evidence: review.evidence || null,
            createdAt: normalizeDate(review.createdAt || review.when),
          }))
        : [],
      createdAt: normalizeDate(item.createdAt),
    }));
}

function migrateMissing(items) {
  return items
    .filter((item) => item && item.name)
    .map((item) => ({
      id: item.id || uid('missing'),
      name: item.name,
      age: item.age ?? null,
      desc: item.desc || '',
      place: item.place || '',
      contact: item.contact || '',
      photo: item.photo || null,
      exampleImg: item.exampleImg || null,
      found: Boolean(item.found),
      createdAt: normalizeDate(item.createdAt || item.when),
      foundAt: item.found ? normalizeDate(item.foundAt || item.when) : null,
    }));
}

function migrateLostFound(items, type) {
  return items
    .filter((item) => item && item.desc)
    .map((item) => ({
      id: item.id || uid(type),
      category: item.category || 'otro',
      desc: item.desc,
      by: item.by || 'Sin identificar',
      contact: item.contact || '',
      place: item.place || '',
      photo: item.photo || null,
      image: item.example || item.image || null,
      resolved: Boolean(item.resolved),
      createdAt: normalizeDate(item.createdAt || item.when),
      resolvedAt: item.resolved ? normalizeDate(item.resolvedAt || item.when) : null,
    }));
}

export function migrateLegacyData() {
  if (storage.get(MIGRATION_KEY, null)) return;

  const imported = [];

  try {
    if (!storage.has(STORAGE_KEYS.teachers)) {
      const legacyTeachers = readLegacy(LEGACY_KEYS.teachers);
      if (legacyTeachers?.length) {
        storage.set(STORAGE_KEYS.teachers, migrateTeachers(legacyTeachers));
        imported.push(`profesores (${legacyTeachers.length})`);
      }
    }

    if (!storage.has(STORAGE_KEYS.missing)) {
      const legacyMissing = readLegacy(LEGACY_KEYS.missing);
      if (legacyMissing?.length) {
        storage.set(STORAGE_KEYS.missing, migrateMissing(legacyMissing));
        imported.push(`personas extraviadas (${legacyMissing.length})`);
      }
    }

    if (!storage.has(STORAGE_KEYS.found)) {
      const legacyFound = readLegacy(LEGACY_KEYS.found);
      if (legacyFound?.length) {
        storage.set(STORAGE_KEYS.found, migrateLostFound(legacyFound, 'found'));
        imported.push(`objetos encontrados (${legacyFound.length})`);
      }
    }

    if (!storage.has(STORAGE_KEYS.lost)) {
      const legacyLost = readLegacy(LEGACY_KEYS.lost);
      if (legacyLost?.length) {
        storage.set(STORAGE_KEYS.lost, migrateLostFound(legacyLost, 'lost'));
        imported.push(`objetos perdidos (${legacyLost.length})`);
      }
    }

    storage.set(MIGRATION_KEY, {
      completedAt: new Date().toISOString(),
      imported,
    });

    if (imported.length) {
      console.info('[IntraNerd] Datos antiguos migrados:', imported.join(', '));
    }
  } catch (error) {
    // Nunca bloqueamos el arranque por una migración fallida.
    console.warn('[IntraNerd] La migración de datos antiguos no se completó.', error);
  }
}
