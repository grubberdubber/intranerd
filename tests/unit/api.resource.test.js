import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser, jsonResponse } from './helpers/fake-browser.js';

let browser;

async function setup(fetchImpl, seed = () => []) {
  const fetchMock = vi.fn(fetchImpl);
  vi.stubGlobal('fetch', fetchMock);

  const module = await import('../../src/services/api.js');
  const resource = module.createResource({
    name: 'demo',
    endpoint: '/demos',
    storageKey: 'demo.items',
    seed,
  });

  return { ...module, resource, fetchMock };
}

describe('services/api · repositorios REST con fallback local', () => {
  beforeEach(() => {
    vi.resetModules();
    browser = installFakeBrowser();
  });

  afterEach(() => {
    browser.restore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lista desde la API y marca el modo api', async () => {
    const { resource, connection, fetchMock } = await setup(async () =>
      jsonResponse({ success: true, data: { items: [{ id: 'a' }, { id: 'b' }] }, error: null }),
    );

    const items = await resource.list();

    expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(connection.mode).toBe('api');
    expect(connection.isApi).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/demos');
  });

  it('normaliza listas en formato array o data', async () => {
    const first = await setup(async () =>
      jsonResponse({ success: true, data: [{ id: 'array' }], error: null }),
    );
    await expect(first.resource.list()).resolves.toEqual([{ id: 'array' }]);

    vi.resetModules();
    const second = await setup(async () =>
      jsonResponse({ success: true, data: { items: [{ id: 'items' }] }, error: null }),
    );
    await expect(second.resource.list()).resolves.toEqual([{ id: 'items' }]);
  });

  it('crea entidades en la API', async () => {
    const { resource, fetchMock } = await setup(async () =>
      jsonResponse(
        { success: true, data: { id: 'new_1', name: 'Nuevo' }, error: null },
        { ok: true, status: 201 },
      ),
    );

    const created = await resource.create({ name: 'Nuevo' });

    expect(created).toEqual({ id: 'new_1', name: 'Nuevo' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/demos');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'Nuevo' });
  });

  it('actualiza entidades en la API', async () => {
    const { resource, fetchMock } = await setup(async () =>
      jsonResponse({ success: true, data: { id: 'a/b', name: 'Editado' }, error: null }),
    );

    const updated = await resource.update('a/b', { name: 'Editado' });

    expect(updated).toEqual({ id: 'a/b', name: 'Editado' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/demos/a%2Fb');
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  });

  it('elimina entidades en la API', async () => {
    const { resource, fetchMock } = await setup(async () =>
      jsonResponse({ success: true, data: { id: 'a' }, error: null }),
    );

    await expect(resource.remove('a')).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/demos/a');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('cae a localStorage si la API responde 404 y opera en modo local', async () => {
    const seed = () => [{ id: 'seed_1', name: 'Seed' }];
    const { resource, connection, fetchMock } = await setup(
      async () => jsonResponse({ success: false, error: 'No existe' }, { ok: false, status: 404 }),
      seed,
    );

    const items = await resource.list();
    expect(items).toEqual([{ id: 'seed_1', name: 'Seed' }]);
    expect(connection.mode).toBe('local');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // En modo local ya no se vuelve a llamar a fetch.
    const created = await resource.create({ name: 'Local' });
    expect(created.id).toMatch(/^demo_/);
    expect(created.name).toBe('Local');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const updated = await resource.update(created.id, { name: 'Local editado' });
    expect(updated.name).toBe('Local editado');

    expect(await resource.remove(created.id)).toBe(true);
    expect(resource.readLocal()).toHaveLength(1);
  });

  it('cae a localStorage ante una falla de red', async () => {
    const { resource, connection } = await setup(
      async () => {
        throw new TypeError('fetch failed');
      },
      () => [{ id: 'offline' }],
    );

    await expect(resource.list()).resolves.toEqual([{ id: 'offline' }]);
    expect(connection.mode).toBe('local');
  });

  it('propaga errores de negocio 422 sin activar el fallback', async () => {
    const { resource, connection } = await setup(async () =>
      jsonResponse(
        { success: false, error: 'Datos inválidos', details: [] },
        { ok: false, status: 422 },
      ),
    );

    await expect(resource.list()).rejects.toMatchObject({ status: 422 });
    expect(connection.mode).toBe('unknown');
  });

  it('propaga errores 409 de conflicto', async () => {
    const { resource } = await setup(async () =>
      jsonResponse({ error: 'Taller lleno' }, { ok: false, status: 409 }),
    );

    await expect(resource.create({ name: 'X' })).rejects.toMatchObject({
      status: 409,
      message: 'Taller lleno',
    });
  });

  it('usa la entidad local de respaldo si la API no devuelve cuerpo', async () => {
    const { resource } = await setup(async () => jsonResponse(null, { ok: true, status: 201 }));

    const created = await resource.create({ name: 'Sin cuerpo' });
    expect(created).toMatchObject({ name: 'Sin cuerpo' });
    expect(created.id).toMatch(/^demo_/);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('permite reiniciar la caché local de un recurso', async () => {
    const { resource } = await setup(
      async () => {
        throw new TypeError('offline');
      },
      () => [{ id: 'seed' }],
    );

    await resource.list();
    expect(resource.readLocal()).toEqual([{ id: 'seed' }]);

    resource.resetLocal();
    expect(resource.readLocal()).toEqual([{ id: 'seed' }]);
  });

  it('notifica cambios de conexión y permite reintentar', async () => {
    const { connection, resource } = await setup(async () =>
      jsonResponse({ success: true, data: [], error: null }),
    );
    const listener = vi.fn();

    const unsubscribe = connection.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'unknown', enabled: true }),
    );

    await resource.list();
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'api' }));
    expect(browser.events.some((event) => event.type === 'intranerd:connection')).toBe(true);

    connection.retry();
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'unknown' }));

    unsubscribe();
    const calls = listener.mock.calls.length;
    await resource.list();
    expect(listener).toHaveBeenCalledTimes(calls);
  });
});
