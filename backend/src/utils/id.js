import { randomUUID } from 'node:crypto';

/** Genera un identificador legible con prefijo, p. ej. sub_3f2a... */
export function makeId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

export function nowIso() {
  return new Date().toISOString();
}
