import { config } from '../config.js';
import { storage } from './storage.js';
import { HttpError, NetworkError, http } from './http.js';
import { uid } from '../utils/id.js';

/**
 * Capa de datos desacoplada.
 *
 * Estrategia:
 *  1. Si la API está habilitada, se intenta la operación REST.
 *  2. Si la API no está disponible (red, 404, 5xx) se cae a localStorage.
 *  3. La UI puede observar el modo activo con connection.subscribe().
 *
 * Los errores de validación del backend (400/409/422) sí se propagan para que
 * la vista muestre el mensaje real y no oculte un problema de negocio.
 */

const canFallbackStatuses = new Set([404, 405, 501]);

let mode = config.api.enabled ? 'unknown' : 'local';
let notifiedFallback = false;
const listeners = new Set();

function emitConnection(error = null) {
  const detail = { mode, enabled: config.api.enabled, error };
  listeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (listenerError) {
      console.warn('[IntraNerd] Error en listener de conexión.', listenerError);
    }
  });
  window.dispatchEvent(new CustomEvent('intranerd:connection', { detail }));
}

function setMode(nextMode, error = null) {
  if (mode === nextMode) return;
  mode = nextMode;
  emitConnection(error);
}

function shouldTryApi() {
  return config.api.enabled && mode !== 'local';
}

function handleRemoteFailure(error) {
  const canFallback =
    error instanceof NetworkError ||
    (error instanceof HttpError && (canFallbackStatuses.has(error.status) || error.status >= 500));

  if (!canFallback) throw error;

  if (!notifiedFallback) {
    notifiedFallback = true;
    console.info(
      '[IntraNerd] API no disponible. Se usará localStorage como almacenamiento principal.',
      error.message,
    );
  }
  setMode('local', error);
  return null;
}

function normalizeList(data) {
  // La API responde con la envoltura { success, data, error }: desenvolvemos
  // antes de buscar el arreglo de elementos.
  const payload = data && typeof data === 'object' && 'success' in data ? data.data : data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function normalizeEntity(data, fallback) {
  if (data && typeof data === 'object') {
    if (data.item && typeof data.item === 'object') return data.item;
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
    return data;
  }
  return fallback;
}

export const connection = {
  get mode() {
    return mode;
  },
  get isApi() {
    return mode === 'api';
  },
  get enabled() {
    return config.api.enabled;
  },
  subscribe(listener) {
    listeners.add(listener);
    listener({ mode, enabled: config.api.enabled, error: null });
    return () => listeners.delete(listener);
  },
  retry() {
    if (!config.api.enabled) return;
    notifiedFallback = false;
    mode = 'unknown';
    emitConnection();
  },
};

/**
 * Fábrica de repositorios CRUD con doble adaptador (REST + localStorage).
 *
 * `adapters` permite traducir el modelo propio de la SPA al contrato de la
 * API (campos y subrecursos con nombres distintos). Cada función devuelve ya
 * el objeto en formato SPA; si no se define, se usa el CRUD genérico.
 *
 *   listRemote(http)          -> items[]
 *   createRemote(http, data)  -> item
 *   updateRemote(http, id, patch) -> item
 *   removeRemote(http, id)    -> true
 *   toRemote(data) / fromRemote(item) para el CRUD genérico
 */
export function createResource({ name, endpoint, storageKey, seed = () => [], adapters = {} }) {
  function ensureLocal() {
    if (!storage.has(storageKey)) {
      storage.set(storageKey, seed());
    }
    return storage.get(storageKey, []);
  }

  function readLocal() {
    const items = ensureLocal();
    return Array.isArray(items) ? items : [];
  }

  function writeLocal(items) {
    storage.set(storageKey, items);
    return items;
  }

  async function list() {
    if (shouldTryApi()) {
      try {
        if (adapters.listRemote) {
          const items = await adapters.listRemote(http);
          setMode('api');
          return Array.isArray(items) ? items : [];
        }
        const data = await http.get(endpoint);
        setMode('api');
        const items = normalizeList(data);
        return adapters.fromRemote ? items.map(adapters.fromRemote) : items;
      } catch (error) {
        const fallback = handleRemoteFailure(error);
        if (fallback !== null) return fallback;
      }
    }
    return readLocal();
  }

  async function create(payload) {
    const localEntity = {
      id: uid(name),
      ...payload,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    if (shouldTryApi()) {
      try {
        if (adapters.createRemote) {
          const entity = await adapters.createRemote(http, payload);
          setMode('api');
          return entity;
        }
        const body = adapters.toRemote ? adapters.toRemote(payload) : payload;
        const data = await http.post(endpoint, body);
        setMode('api');
        const entity = normalizeEntity(data, localEntity);
        return adapters.fromRemote ? adapters.fromRemote(entity) : entity;
      } catch (error) {
        const fallback = handleRemoteFailure(error);
        if (fallback !== null) return fallback;
      }
    }

    const items = readLocal();
    writeLocal([localEntity, ...items]);
    return localEntity;
  }

  async function update(id, patch) {
    if (shouldTryApi()) {
      try {
        if (adapters.updateRemote) {
          const entity = await adapters.updateRemote(http, id, patch);
          setMode('api');
          return entity;
        }
        const body = adapters.toRemote ? adapters.toRemote(patch) : patch;
        const data = await http.patch(`${endpoint}/${encodeURIComponent(id)}`, body);
        setMode('api');
        const entity = normalizeEntity(data, { id, ...patch });
        return adapters.fromRemote ? adapters.fromRemote(entity) : entity;
      } catch (error) {
        const fallback = handleRemoteFailure(error);
        if (fallback !== null) return fallback;
      }
    }

    const items = readLocal();
    let updated = null;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, id };
      return updated;
    });
    if (!updated) throw new Error('El registro que intentas actualizar ya no existe.');
    writeLocal(next);
    return updated;
  }

  async function remove(id) {
    if (shouldTryApi()) {
      try {
        if (adapters.removeRemote) {
          await adapters.removeRemote(http, id);
        } else {
          await http.delete(`${endpoint}/${encodeURIComponent(id)}`);
        }
        setMode('api');
        return true;
      } catch (error) {
        const fallback = handleRemoteFailure(error);
        if (fallback !== null) return fallback;
      }
    }

    const items = readLocal();
    writeLocal(items.filter((item) => item.id !== id));
    return true;
  }

  return {
    name,
    endpoint,
    storageKey,
    list,
    create,
    update,
    remove,
    readLocal,
    writeLocal,
    resetLocal() {
      storage.remove(storageKey);
    },
  };
}
