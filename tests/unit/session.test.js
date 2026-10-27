import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser } from './helpers/fake-browser.js';

let browser;

async function loadSession() {
  return import('../../src/services/session.js');
}

describe('services/session · perfil local', () => {
  beforeEach(() => {
    vi.resetModules();
    browser = installFakeBrowser();
  });

  afterEach(() => {
    browser.restore();
  });

  it('parte con el perfil de visitante', async () => {
    const { getProfile, profileInitials } = await loadSession();

    const profile = getProfile();
    expect(profile).toMatchObject({
      name: 'Visitante',
      role: 'alumno',
      roleLabel: 'Alumno/a',
      email: '',
    });
    expect(profileInitials(profile)).toBe('V');
  });

  it('guarda el perfil y traduce el rol a etiqueta', async () => {
    const { getProfile, saveProfile, ROLE_LABELS } = await loadSession();

    const saved = saveProfile({ name: 'Ana María Pérez', role: 'profesor' });
    expect(saved).toMatchObject({
      name: 'Ana María Pérez',
      role: 'profesor',
      roleLabel: 'Profesor/a',
    });
    expect(ROLE_LABELS.direccion).toBe('Dirección');
    expect(getProfile().name).toBe('Ana María Pérez');

    expect(browser.events.at(-1)).toMatchObject({ type: 'intranerd:profile' });
  });

  it('conserva los datos previos al actualizar parcialmente', async () => {
    const { saveProfile } = await loadSession();

    saveProfile({ name: 'Ana', role: 'profesor', email: 'ana@colegio.cl' });
    const updated = saveProfile({ role: 'direccion' });

    expect(updated).toMatchObject({
      name: 'Ana',
      email: 'ana@colegio.cl',
      role: 'direccion',
      roleLabel: 'Dirección',
    });
  });

  it('usa Alumno/a si el rol no está en el catálogo', async () => {
    const { getProfile, saveProfile } = await loadSession();

    saveProfile({ role: 'desconocido' });
    expect(getProfile().roleLabel).toBe('Alumno/a');
  });

  it('notifica a los suscriptores y permite desuscribirse', async () => {
    const { subscribeProfile, saveProfile } = await loadSession();
    const listener = vi.fn();

    const unsubscribe = subscribeProfile(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Visitante' }));

    saveProfile({ name: 'Diego' });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    saveProfile({ name: 'Otro' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('devuelve IN cuando el nombre no permite iniciales', async () => {
    const { profileInitials } = await loadSession();
    expect(profileInitials({ name: '' })).toBe('IN');
    expect(profileInitials({ name: '  ' })).toBe('IN');
    expect(profileInitials({ name: 'Rodrigo Soto' })).toBe('RS');
  });
});
