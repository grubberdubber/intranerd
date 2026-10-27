import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../../src/config.js';
import { HttpError, NetworkError, http, request } from '../../src/services/http.js';
import { jsonResponse } from './helpers/fake-browser.js';

let originalBaseUrl;

function installFetch(implementation) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('services/http · transporte', () => {
  beforeEach(() => {
    originalBaseUrl = config.api.baseUrl;
  });

  afterEach(() => {
    config.api.baseUrl = originalBaseUrl;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hace GET y devuelve el JSON parseado', async () => {
    const fetchMock = installFetch(async () =>
      jsonResponse({ success: true, data: { items: [1, 2] }, error: null }),
    );

    const data = await http.get('/grades');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/grades');
    expect(options.method).toBe('GET');
    expect(options.headers.Accept).toBe('application/json');
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBeUndefined();
    expect(data).toEqual({ success: true, data: { items: [1, 2] }, error: null });
  });

  it('serializa el cuerpo JSON en POST, PUT y PATCH', async () => {
    const fetchMock = installFetch(async () => jsonResponse({ ok: true }));

    await http.post('/a', { x: 1 });
    await http.put('/b', { x: 2 });
    await http.patch('/c', { x: 3 });

    expect(fetchMock.mock.calls.map(([, options]) => options.method)).toEqual([
      'POST',
      'PUT',
      'PATCH',
    ]);
    fetchMock.mock.calls.forEach(([, options], index) => {
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.body).toBe(JSON.stringify({ x: index + 1 }));
    });
  });

  it('envía DELETE sin cuerpo y permite cabeceras extra', async () => {
    const fetchMock = installFetch(async () => jsonResponse(null));

    await http.delete('/x', { headers: { Authorization: 'Bearer token' } });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('DELETE');
    expect(options.body).toBeUndefined();
    expect(options.headers.Authorization).toBe('Bearer token');
    expect(options.credentials).toBe('same-origin');
  });

  it('normaliza la unión de base y ruta', async () => {
    config.api.baseUrl = 'http://api.test/';
    const fetchMock = installFetch(async () => jsonResponse({ ok: true }));

    await request('/grades');

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/grades');
  });

  it('lanza HttpError con estado, mensaje y cuerpo en respuestas no exitosas', async () => {
    installFetch(async () =>
      jsonResponse(
        { success: false, data: null, error: 'La asignatura no existe.' },
        { ok: false, status: 404 },
      ),
    );

    const promise = http.get('/grades/subjects/x');
    await expect(promise).rejects.toBeInstanceOf(HttpError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      message: 'La asignatura no existe.',
      data: { success: false, data: null, error: 'La asignatura no existe.' },
    });
  });

  it('prefiere el campo message del backend cuando existe', async () => {
    installFetch(async () =>
      jsonResponse({ message: 'Mensaje directo' }, { ok: false, status: 422 }),
    );

    await expect(http.get('/x')).rejects.toMatchObject({
      status: 422,
      message: 'Mensaje directo',
    });
  });

  it('usa un mensaje por defecto si el error no trae cuerpo', async () => {
    installFetch(async () => jsonResponse('', { ok: false, status: 500 }));

    await expect(http.get('/x')).rejects.toMatchObject({
      status: 500,
      message: 'La API respondió con estado 500.',
    });
  });

  it('convierte fallas de red en NetworkError', async () => {
    installFetch(async () => {
      throw new TypeError('fetch failed');
    });

    const promise = http.get('/health');
    await expect(promise).rejects.toBeInstanceOf(NetworkError);
    await expect(promise).rejects.toMatchObject({
      message: 'No fue posible conectar con la API de IntraNerd.',
    });
  });

  it('devuelve texto plano cuando la respuesta no es JSON', async () => {
    installFetch(async () => jsonResponse('OK'));
    await expect(http.get('/ping')).resolves.toBe('OK');
  });

  it('devuelve null cuando la respuesta viene vacía', async () => {
    installFetch(async () => jsonResponse(''));
    await expect(http.get('/vacio')).resolves.toBeNull();
  });

  it('aborta por timeout y reporta un error de red descriptivo', async () => {
    vi.useFakeTimers();
    installFetch(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const promise = request('/lento', { timeout: 100 });
    const assertion = expect(promise).rejects.toBeInstanceOf(NetworkError);
    await vi.advanceTimersByTimeAsync(150);
    await assertion;
    await expect(promise).rejects.toThrow(/tardó demasiado/i);
  });

  it('respeta una señal externa de aborto', async () => {
    const controller = new AbortController();
    installFetch(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const promise = request('/x', { signal: controller.signal });
    const assertion = expect(promise).rejects.toBeInstanceOf(NetworkError);
    controller.abort();
    await assertion;
  });
});
