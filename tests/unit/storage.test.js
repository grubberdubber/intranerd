import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser } from './helpers/fake-browser.js';

let browser;

async function loadStorage() {
  const module = await import('../../src/services/storage.js');
  return module;
}

describe('services/storage · persistencia con espacio de nombres', () => {
  beforeEach(() => {
    vi.resetModules();
    browser = installFakeBrowser();
  });

  afterEach(() => {
    browser.restore();
  });

  it('detecta localStorage disponible y aplica el prefijo de la app', async () => {
    const { storage } = await loadStorage();

    expect(storage.isPersistent).toBe(true);
    expect(storage.key('grades.subjects')).toBe('intranerd.v2:grades.subjects');
  });

  it('guarda y recupera estructuras JSON', async () => {
    const { storage } = await loadStorage();
    const value = [{ id: 'subj_1', grades: [6.5, 5.8] }];

    expect(storage.has('subjects')).toBe(false);
    expect(storage.set('subjects', value)).toEqual(value);
    expect(storage.has('subjects')).toBe(true);
    expect(storage.get('subjects')).toEqual(value);
  });

  it('devuelve el fallback si la clave no existe o el JSON es inválido', async () => {
    const { storage } = await loadStorage();

    expect(storage.get('missing', 'por-defecto')).toBe('por-defecto');

    browser.localStorage.setItem(storage.key('roto'), '{no-es-json');
    expect(storage.get('roto', null)).toBeNull();
  });

  it('emite un evento al guardar y al eliminar', async () => {
    const { storage } = await loadStorage();

    storage.set('demo', { a: 1 });
    expect(browser.events.at(-1)).toMatchObject({
      type: 'intranerd:storage',
      detail: { key: 'demo', value: { a: 1 } },
    });

    storage.remove('demo');
    expect(browser.events.at(-1)).toMatchObject({
      type: 'intranerd:storage',
      detail: { key: 'demo', value: null },
    });
    expect(storage.has('demo')).toBe(false);
  });

  it('lista solo las claves propias de IntraNerd', async () => {
    const { storage } = await loadStorage();

    storage.set('a', 1);
    storage.set('b', 2);
    browser.localStorage.setItem('otra-app:clave', 'x');

    expect(storage.keys().sort()).toEqual(['a', 'b']);
  });

  it('calcula el uso y exporta/importa el conjunto de datos', async () => {
    const { storage } = await loadStorage();

    storage.set('a', { texto: 'hola' });
    storage.set('b', [1, 2, 3]);

    expect(storage.usage()).toBeGreaterThan(0);
    const dump = storage.exportAll();
    expect(dump).toEqual({ a: { texto: 'hola' }, b: [1, 2, 3] });

    storage.clearAll();
    expect(storage.keys()).toEqual([]);

    storage.importAll(dump);
    expect(storage.get('a')).toEqual({ texto: 'hola' });
    expect(storage.get('b')).toEqual([1, 2, 3]);
  });

  it('lanza StorageError cuando la cuota está agotada', async () => {
    const { storage, StorageError } = await loadStorage();
    expect(storage.isPersistent).toBe(true);

    browser.localStorage.setItem = () => {
      const error = new Error('Cuota agotada');
      error.name = 'QuotaExceededError';
      throw error;
    };

    expect(() => storage.set('foto', 'data:image/png;base64,AAAA')).toThrow(StorageError);
    expect(() => storage.set('foto', 'x')).toThrow(/almacenamiento del navegador está lleno/i);
  });

  it('envuelve otros errores de escritura en StorageError', async () => {
    const { storage, StorageError } = await loadStorage();
    storage.isPersistent;

    browser.localStorage.setItem = () => {
      throw new Error('fallo desconocido');
    };

    expect(() => storage.set('x', 1)).toThrow(StorageError);
    expect(() => storage.set('x', 1)).toThrow(/No fue posible guardar/i);
  });
});

describe('services/storage · fallback en memoria', () => {
  beforeEach(() => {
    vi.resetModules();
    browser = installFakeBrowser({ storageFails: true });
  });

  afterEach(() => {
    browser.restore();
  });

  it('opera en memoria cuando localStorage no está disponible', async () => {
    const { storage } = await loadStorage();

    expect(storage.isPersistent).toBe(false);
    expect(storage.get('x', 'fallback')).toBe('fallback');

    storage.set('x', { ok: true });
    expect(storage.has('x')).toBe(true);
    expect(storage.get('x')).toEqual({ ok: true });
    expect(storage.keys()).toEqual(['x']);
    expect(storage.usage()).toBeGreaterThan(0);

    storage.remove('x');
    expect(storage.has('x')).toBe(false);
  });
});
