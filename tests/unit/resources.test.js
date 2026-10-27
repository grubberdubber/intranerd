import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser } from './helpers/fake-browser.js';

let browser;

async function loadResources() {
  vi.resetModules();
  return import('../../src/services/resources.js');
}

describe('services/resources · repositorios por módulo', () => {
  beforeEach(() => {
    browser = installFakeBrowser();
  });

  afterEach(() => {
    browser.restore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('expone un repositorio por cada módulo', async () => {
    const { repos } = await loadResources();

    expect(Object.keys(repos).sort()).toEqual([
      'announcements',
      'calendar',
      'found',
      'lost',
      'missing',
      'subjects',
      'tasks',
      'teachers',
      'workshops',
    ]);
  });

  it('cada repositorio implementa la interfaz CRUD y conserva su clave local', async () => {
    const { repos } = await loadResources();

    for (const [key, repo] of Object.entries(repos)) {
      expect(repo.name, key).toBeTruthy();
      expect(repo.endpoint, key).toMatch(/^\//);
      expect(repo.storageKey, key).toContain('.');
      expect(typeof repo.list, key).toBe('function');
      expect(typeof repo.create, key).toBe('function');
      expect(typeof repo.update, key).toBe('function');
      expect(typeof repo.remove, key).toBe('function');
      expect(typeof repo.resetLocal, key).toBe('function');
    }
  });

  it('siembra datos locales la primera vez que se consulta cada módulo', async () => {
    const { repos } = await loadResources();
    // Sin fetch disponible, los repositorios caen a localStorage con su seed.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      }),
    );

    for (const repo of Object.values(repos)) {
      const items = await repo.list();
      expect(Array.isArray(items), repo.name).toBe(true);
      expect(items.length, repo.name).toBeGreaterThan(0);
    }
  });

  it('reinicia el almacenamiento local de un repositorio', async () => {
    const { repos } = await loadResources();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      }),
    );

    const before = await repos.tasks.list();
    expect(before.length).toBeGreaterThan(0);

    repos.tasks.resetLocal();
    expect(repos.tasks.readLocal().length).toBeGreaterThan(0);
  });
});
