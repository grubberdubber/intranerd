import { config } from '../config.js';

/**
 * Capa de almacenamiento local con espacio de nombres y fallback en memoria.
 * Centralizar el acceso permite versionar datos y manejar cuotas agotadas
 * (por ejemplo, al guardar fotos en data URL) sin romper la aplicación.
 */

const PREFIX = `${config.storage.prefix}:`;
const memory = new Map();
let available = null;

function storageAvailable() {
  if (available !== null) return available;
  try {
    const probe = '__intranerd_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

function fullKey(key) {
  return `${PREFIX}${key}`;
}

export const storage = {
  get isPersistent() {
    return storageAvailable();
  },

  key(key) {
    return fullKey(key);
  },

  has(key) {
    if (!storageAvailable()) return memory.has(fullKey(key));
    try {
      return window.localStorage.getItem(fullKey(key)) !== null;
    } catch {
      return false;
    }
  },

  get(key, fallback = null) {
    const name = fullKey(key);
    try {
      const raw = storageAvailable() ? window.localStorage.getItem(name) : memory.get(name);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`[IntraNerd] No se pudo leer "${key}".`, error);
      return fallback;
    }
  },

  set(key, value) {
    const name = fullKey(key);
    const raw = JSON.stringify(value);
    try {
      if (storageAvailable()) {
        window.localStorage.setItem(name, raw);
      } else {
        memory.set(name, raw);
      }
      window.dispatchEvent(new CustomEvent('intranerd:storage', { detail: { key, value } }));
      return value;
    } catch (error) {
      if (error?.name === 'QuotaExceededError' || error?.code === 22) {
        throw new StorageError(
          'El almacenamiento del navegador está lleno. Elimina fotos o registros antiguos e inténtalo de nuevo.',
          error,
        );
      }
      throw new StorageError('No fue posible guardar la información en el navegador.', error);
    }
  },

  remove(key) {
    const name = fullKey(key);
    if (storageAvailable()) {
      window.localStorage.removeItem(name);
    } else {
      memory.delete(name);
    }
    window.dispatchEvent(new CustomEvent('intranerd:storage', { detail: { key, value: null } }));
  },

  keys() {
    if (!storageAvailable()) {
      return Array.from(memory.keys())
        .filter((name) => name.startsWith(PREFIX))
        .map((name) => name.slice(PREFIX.length));
    }
    try {
      return Object.keys(window.localStorage)
        .filter((name) => name.startsWith(PREFIX))
        .map((name) => name.slice(PREFIX.length));
    } catch {
      return [];
    }
  },

  usage() {
    if (!storageAvailable()) {
      return Array.from(memory.values()).reduce((total, raw) => total + raw.length, 0);
    }
    try {
      return Object.keys(window.localStorage)
        .filter((name) => name.startsWith(PREFIX))
        .reduce((total, name) => total + (window.localStorage.getItem(name)?.length || 0), 0);
    } catch {
      return 0;
    }
  },

  exportAll() {
    return this.keys().reduce((accumulator, key) => {
      accumulator[key] = this.get(key);
      return accumulator;
    }, {});
  },

  importAll(data = {}) {
    Object.entries(data).forEach(([key, value]) => this.set(key, value));
  },

  clearAll() {
    this.keys().forEach((key) => this.remove(key));
  },
};
