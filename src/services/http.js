import { config } from '../config.js';

/**
 * Cliente HTTP mínimo para el backend REST de IntraNerd.
 * No conoce reglas de negocio: solo transporte, timeouts y errores tipados.
 */

export class HttpError extends Error {
  constructor(status, message, data = null) {
    super(message || `Error HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

function joinUrl(base, path) {
  return `${String(base).replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
}

export async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, timeout = config.api.timeout, signal } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const abortListener = () => controller.abort();
  signal?.addEventListener('abort', abortListener);

  try {
    const response = await fetch(joinUrl(config.api.baseUrl, path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      credentials: 'same-origin',
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data?.message || data?.error || `La API respondió con estado ${response.status}.`,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'AbortError') {
      throw new NetworkError('La API tardó demasiado en responder.', error);
    }
    throw new NetworkError('No fue posible conectar con la API de IntraNerd.', error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortListener);
  }
}

/** Convierte un data URL del navegador en un Blob para enviarlo por multipart. */
export function dataUrlToBlob(dataUrl) {
  const [header, payload] = String(dataUrl).split(',');
  const mimeType = /data:([^;]+)/.exec(header)?.[1] || 'application/octet-stream';
  const binary = atob(payload || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Envía `multipart/form-data` (texto + archivos). Los archivos pueden ser
 * `Blob`/`File` o data URLs producidos por `prepareUpload`.
 */
export async function requestForm(path, { method = 'POST', fields = {}, files = {}, signal } = {}) {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });

  Object.entries(files).forEach(([key, value]) => {
    if (!value) return;
    if (typeof value === 'string' && value.startsWith('data:')) {
      const blob = dataUrlToBlob(value);
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
      form.append(key, blob, `${key}.${extension}`);
      return;
    }
    if (value instanceof Blob) {
      form.append(key, value, value.name || key);
    }
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.api.timeout);
  const abortListener = () => controller.abort();
  signal?.addEventListener('abort', abortListener);

  try {
    const response = await fetch(joinUrl(config.api.baseUrl, path), {
      method,
      headers: { Accept: 'application/json' },
      body: form,
      signal: controller.signal,
      credentials: 'same-origin',
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data?.message || data?.error || `La API respondió con estado ${response.status}.`,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'AbortError') {
      throw new NetworkError('La API tardó demasiado en responder.', error);
    }
    throw new NetworkError('No fue posible conectar con la API de IntraNerd.', error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortListener);
  }
}

export const http = {
  get(path, options) {
    return request(path, { ...options, method: 'GET' });
  },
  postForm(path, options) {
    return requestForm(path, { ...options, method: 'POST' });
  },
  patchForm(path, options) {
    return requestForm(path, { ...options, method: 'PATCH' });
  },
  post(path, body, options) {
    return request(path, { ...options, method: 'POST', body });
  },
  put(path, body, options) {
    return request(path, { ...options, method: 'PUT', body });
  },
  patch(path, body, options) {
    return request(path, { ...options, method: 'PATCH', body });
  },
  delete(path, options) {
    return request(path, { ...options, method: 'DELETE' });
  },
};
