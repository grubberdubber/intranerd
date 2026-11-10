import { STORAGE_KEYS } from '../data/constants.js';
import { storage } from './storage.js';

/**
 * Preferencias de accesibilidad de la interfaz.
 *
 * Se guardan en localStorage y se aplican como atributos en <html>:
 *   data-text-size="normal|large|xlarge"
 *   data-contrast="normal|high"
 *   data-motion="system|reduced"
 *
 * El CSS de `styles/components/accessibility.css` traduce esos atributos en
 * tamaños, colores y movimiento reducido. Ninguna preferencia cambia los datos
 * de la persona: solo la presentación.
 */

export const TEXT_SIZES = {
  normal: {
    label: 'Normal',
    hint: 'El tamaño estándar de IntraNerd.',
  },
  large: {
    label: 'Grande',
    hint: 'Aumenta el texto y los espacios un 12,5 %.',
  },
  xlarge: {
    label: 'Muy grande',
    hint: 'Aumenta el texto y los espacios un 25 %.',
  },
};

export const CONTRAST_MODES = {
  normal: {
    label: 'Estándar',
    hint: 'La paleta institucional habitual.',
  },
  high: {
    label: 'Alto contraste',
    hint: 'Bordes más marcados, textos más oscuros y fondos blancos.',
  },
};

export const MOTION_MODES = {
  system: {
    label: 'Según el sistema',
    hint: 'Respeta la configuración de movimiento de tu equipo.',
  },
  reduced: {
    label: 'Movimiento reducido',
    hint: 'Desactiva animaciones y desplazamientos suaves.',
  },
};

export const PREFERENCE_DEFAULTS = {
  textSize: 'normal',
  contrast: 'normal',
  motion: 'system',
};

let current = { ...PREFERENCE_DEFAULTS };
const subscribers = new Set();

function normalize(raw = {}) {
  return {
    textSize: Object.hasOwn(TEXT_SIZES, raw.textSize) ? raw.textSize : PREFERENCE_DEFAULTS.textSize,
    contrast: Object.hasOwn(CONTRAST_MODES, raw.contrast)
      ? raw.contrast
      : PREFERENCE_DEFAULTS.contrast,
    motion: Object.hasOwn(MOTION_MODES, raw.motion) ? raw.motion : PREFERENCE_DEFAULTS.motion,
  };
}

export function getPreferences() {
  return { ...current };
}

export function applyPreferences() {
  const root = document.documentElement;
  root.dataset.textSize = current.textSize;
  root.dataset.contrast = current.contrast;
  root.dataset.motion = current.motion;
}

/**
 * Lee y aplica las preferencias guardadas. Se llama al arrancar, antes de
 * construir el layout, para que la interfaz nazca ya adaptada.
 */
export function initPreferences() {
  current = normalize(storage.get(STORAGE_KEYS.preferences, PREFERENCE_DEFAULTS));
  applyPreferences();
  return getPreferences();
}

/**
 * Guarda y aplica un cambio parcial. Devuelve el estado completo.
 * Puede lanzar StorageError si el navegador no permite escribir.
 */
export function savePreferences(partial) {
  current = normalize({ ...current, ...partial });
  storage.set(STORAGE_KEYS.preferences, current);
  applyPreferences();
  subscribers.forEach((listener) => listener(getPreferences()));
  return getPreferences();
}

export function resetPreferences() {
  return savePreferences(PREFERENCE_DEFAULTS);
}

export function subscribePreferences(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}
