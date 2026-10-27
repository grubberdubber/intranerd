import { STORAGE_KEYS } from '../data/constants.js';
import { storage } from './storage.js';
import { initials } from '../utils/format.js';

/**
 * Perfil liviano del usuario actual. No es autenticación: es la identidad
 * local que se usa para firmar opiniones, pruebas y publicaciones.
 */
const DEFAULT_PROFILE = {
  name: 'Visitante',
  role: 'alumno',
  roleLabel: 'Alumno/a',
  email: '',
};

const listeners = new Set();

export const ROLE_LABELS = {
  alumno: 'Alumno/a',
  profesor: 'Profesor/a',
  direccion: 'Dirección',
  apoderado: 'Apoderado/a',
};

export function getProfile() {
  const profile = storage.get(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    roleLabel: ROLE_LABELS[profile?.role] || ROLE_LABELS.alumno,
  };
}

export function saveProfile(patch) {
  const current = getProfile();
  const next = {
    ...current,
    ...patch,
    roleLabel: ROLE_LABELS[patch.role || current.role] || ROLE_LABELS.alumno,
  };
  storage.set(STORAGE_KEYS.profile, next);
  listeners.forEach((listener) => listener(next));
  window.dispatchEvent(new CustomEvent('intranerd:profile', { detail: next }));
  return next;
}

export function subscribeProfile(listener) {
  listeners.add(listener);
  listener(getProfile());
  return () => listeners.delete(listener);
}

export function profileInitials(profile = getProfile()) {
  return initials(profile.name) || 'IN';
}
