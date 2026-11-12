import { MENU_COMMENT_TYPES, STORAGE_KEYS } from '../data/constants.js';
import { seedMenuComments } from '../data/menuSeeds.js';
import { isValidMenuDay } from '../utils/menu.js';
import { uid } from '../utils/id.js';
import { storage } from './storage.js';

/**
 * Persistencia de los comentarios del menú. Igual que el resto de la SPA,
 * funciona sin API y guarda todo en el navegador.
 */

const COMMENT_TYPES = new Set(MENU_COMMENT_TYPES.map((type) => type.id));

function readComments() {
  if (!storage.has(STORAGE_KEYS.menuComments)) {
    storage.set(STORAGE_KEYS.menuComments, seedMenuComments());
  }
  const comments = storage.get(STORAGE_KEYS.menuComments, []);
  return Array.isArray(comments) ? comments : [];
}

export function listMenuComments() {
  return readComments();
}

export function addMenuComment({
  weekKey,
  dayId,
  type = 'comentario',
  body,
  author = 'Comunidad',
  role = 'alumno',
} = {}) {
  if (!/^\d{4}-W\d{2}$/.test(String(weekKey || ''))) {
    throw new Error('La semana del comentario no es válida.');
  }
  if (!isValidMenuDay(dayId)) {
    throw new Error('Selecciona un día válido del menú.');
  }
  if (!COMMENT_TYPES.has(type)) {
    throw new Error('Selecciona si es un comentario o una sugerencia.');
  }

  const cleanBody = String(body || '').trim();
  if (cleanBody.length < 3) {
    throw new Error('Escribe al menos 3 caracteres para publicar.');
  }
  if (cleanBody.length > 500) {
    throw new Error('El comentario no puede superar los 500 caracteres.');
  }

  const comment = {
    id: uid('menu-comment'),
    weekKey,
    dayId,
    type,
    body: cleanBody,
    author: String(author || 'Comunidad').trim() || 'Comunidad',
    role,
    createdAt: new Date().toISOString(),
  };

  storage.set(STORAGE_KEYS.menuComments, [comment, ...readComments()]);
  return comment;
}
