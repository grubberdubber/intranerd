import { afterEach, describe, expect, it, vi } from 'vitest';
import { uid } from '../../src/utils/id.js';

describe('utils/id · identificadores locales', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('genera un id legible con el prefijo indicado', () => {
    expect(uid('subj')).toMatch(/^subj_[a-z0-9]+$/);
    expect(uid()).toMatch(/^id_[a-z0-9]+$/);
    expect(uid('event')).toMatch(/^event_/);
  });

  it('combina tiempo y azar en base 36', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const value = uid('task');
    expect(value.startsWith('task_')).toBe(true);
    expect(value).toBe(
      `task_${(1_700_000_000_000).toString(36)}${(0.123456789).toString(36).slice(2, 8)}`,
    );
  });

  it('no repite identificadores en una ráfaga de creaciones', () => {
    const ids = new Set(Array.from({ length: 500 }, () => uid('x')));
    expect(ids.size).toBe(500);
  });
});
