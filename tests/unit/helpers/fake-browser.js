/**
 * Navegador mínimo para pruebas unitarias en entorno Node.
 *
 * Implementa el subconjunto de `window`, `localStorage`, `CustomEvent` y
 * `dispatchEvent` que usan `services/storage.js`, `services/session.js` y
 * `services/api.js`. No pretende ser un DOM completo: las vistas y los
 * helpers que crean nodos se prueban en E2E con un navegador real.
 */

/**
 * localStorage fiel a la enumeración del navegador: las claves guardadas son
 * propiedades propias enumerables y los métodos viven en el prototipo, de modo
 * que `Object.keys(localStorage)` devuelve solo las claves.
 */
class MemoryStorage {
  get length() {
    return Object.keys(this).length;
  }

  key(index) {
    return Object.keys(this)[index] ?? null;
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this, String(key)) ? this[String(key)] : null;
  }

  setItem(key, value) {
    this[String(key)] = String(value);
  }

  removeItem(key) {
    delete this[String(key)];
  }

  clear() {
    Object.keys(this).forEach((key) => delete this[key]);
  }
}

function createEnumerableStorage() {
  return new MemoryStorage();
}

export class FakeCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

/** Instala `window`, `localStorage` y `CustomEvent` globales. */
export function installFakeBrowser({ storageFails = false } = {}) {
  const events = [];
  const localStorage = createEnumerableStorage();

  if (storageFails) {
    localStorage.setItem = () => {
      throw new DOMException('Cuota agotada', 'QuotaExceededError');
    };
  }

  const window = {
    localStorage,
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  globalThis.window = window;
  globalThis.localStorage = localStorage;
  globalThis.CustomEvent = FakeCustomEvent;
  globalThis.document = globalThis.document ?? {
    createElement: () => {
      throw new Error('document no está disponible en pruebas unitarias');
    },
  };

  return {
    window,
    localStorage,
    events,
    restore() {
      delete globalThis.window;
      delete globalThis.localStorage;
      delete globalThis.CustomEvent;
    },
  };
}

/** Respuesta fetch falsa con cuerpo JSON. */
export function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}
