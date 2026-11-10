import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VERSION } from '../data/legal.js';
import { storage } from '../services/storage.js';
import { el } from '../utils/dom.js';
import { icon } from './icon.js';
import { openLegalModal } from './legal.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';

/**
 * Aviso de privacidad y preferencias de almacenamiento.
 *
 * IntraNerd no usa cookies publicitarias ni analítica: el aviso informa y deja
 * constancia de la decisión de la persona. Se guarda en localStorage con la
 * misma capa de almacenamiento que el resto de la aplicación.
 */

let banner = null;

export function getCookieConsent() {
  const record = storage.get(COOKIE_CONSENT_KEY, null);
  if (!record || record.version !== COOKIE_CONSENT_VERSION) return null;
  return record;
}

export function saveCookieConsent(preferences) {
  const record = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: Boolean(preferences),
    analytics: false,
    advertising: false,
    decidedAt: new Date().toISOString(),
  };
  storage.set(COOKIE_CONSENT_KEY, record);
  return record;
}

export function clearCookieConsent() {
  storage.remove(COOKIE_CONSENT_KEY);
}

export function hideCookieBanner() {
  if (!banner) return;
  banner.remove();
  banner = null;
}

function choose(preferences) {
  try {
    saveCookieConsent(preferences);
    hideCookieBanner();
    toast.success(
      preferences
        ? 'Gracias. Guardamos tu aceptación del almacenamiento local.'
        : 'Listo. Usaremos solo el almacenamiento necesario para que todo funcione.',
      { title: 'Preferencias guardadas' },
    );
  } catch (error) {
    console.error('[IntraNerd] No se pudo guardar la preferencia de cookies.', error);
    toast.error('No pudimos guardar tu elección. Revisa el almacenamiento del navegador.');
  }
}

/**
 * Muestra el aviso solo si todavía no hay una decisión guardada.
 */
export function showCookieBanner() {
  if (banner || getCookieConsent()) return;

  banner = el(
    'section',
    {
      class: 'cookie-banner',
      attrs: {
        role: 'region',
        'aria-labelledby': 'cookie-banner-title',
        'aria-describedby': 'cookie-banner-text',
      },
    },
    el('span', {
      class: 'cookie-banner__icon',
      html: icon('shield', { size: 22 }),
      attrs: { 'aria-hidden': 'true' },
    }),
    el(
      'div',
      { class: 'cookie-banner__content' },
      el('h2', {
        class: 'cookie-banner__title',
        id: 'cookie-banner-title',
        text: 'Tu privacidad, sin letra chica',
      }),
      el('p', {
        class: 'cookie-banner__text',
        id: 'cookie-banner-text',
        text:
          'IntraNerd guarda tus datos en este navegador para que la plataforma funcione. ' +
          'No usamos cookies publicitarias, analítica ni rastreadores de terceros.',
      }),
    ),
    el(
      'div',
      { class: 'cookie-banner__actions' },
      el('button', {
        class: 'btn btn--primary btn--sm',
        type: 'button',
        text: 'Aceptar todas',
        on: { click: () => choose(true) },
      }),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        text: 'Solo esenciales',
        on: { click: () => choose(false) },
      }),
      el('button', {
        class: 'btn btn--link',
        type: 'button',
        text: 'Política de cookies',
        on: { click: () => openLegalModal('cookies') },
      }),
    ),
  );

  document.body.appendChild(banner);
}

function preferenceRow({ title, description, state, tone }) {
  return el(
    'li',
    { class: 'cookie-prefs__item' },
    el(
      'div',
      { class: 'cookie-prefs__text' },
      el('h3', { class: 'cookie-prefs__title', text: title }),
      el('p', { class: 'cookie-prefs__description', text: description }),
    ),
    el('span', {
      class: `cookie-prefs__state cookie-prefs__state--${tone}`,
      text: state,
    }),
  );
}

/**
 * Abre el centro de preferencias para revisar, aceptar o retirar la decisión.
 */
export function openCookiePreferences() {
  const consent = getCookieConsent();
  const decided = consent
    ? `Última decisión: ${new Date(consent.decidedAt).toLocaleDateString('es-CL')}.`
    : 'Todavía no has guardado una decisión.';

  const body = el(
    'div',
    { class: 'cookie-prefs' },
    el('p', { class: 'cookie-prefs__lead', text: decided }),
    el(
      'ul',
      { class: 'cookie-prefs__list' },
      preferenceRow({
        title: 'Almacenamiento esencial',
        description:
          'Guarda tu perfil local, los datos de los módulos y tu decisión de privacidad. ' +
          'Sin esto IntraNerd no puede recordar nada entre visitas.',
        state: 'Siempre activo',
        tone: 'on',
      }),
      preferenceRow({
        title: 'Analítica y publicidad',
        description:
          'No utilizamos cookies de seguimiento, píxeles publicitarios ni servicios de ' +
          'terceros. Esta categoría no está disponible en la plataforma.',
        state: 'No se usa',
        tone: 'off',
      }),
    ),
    el(
      'p',
      { class: 'cookie-prefs__note' },
      'Ambas opciones mantienen la plataforma funcionando. Puedes cambiar o retirar tu ' +
        'decisión en cualquier momento desde este mismo panel.',
    ),
  );

  const modal = openModal({
    title: 'Preferencias de cookies',
    eyebrow: 'Centro de privacidad',
    description: 'Revisa qué guarda IntraNerd y elige cómo continuar.',
    body,
    size: 'md',
    footer: [
      consent
        ? el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Retirar decisión',
            on: {
              click: () => {
                clearCookieConsent();
                modal.close('withdraw');
                toast.info('Retiramos tu decisión de privacidad.');
                showCookieBanner();
              },
            },
          })
        : null,
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Solo esenciales',
        on: {
          click: () => {
            choose(false);
            modal.close('essential');
          },
        },
      }),
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Aceptar todas',
        on: {
          click: () => {
            choose(true);
            modal.close('all');
          },
        },
      }),
    ].filter(Boolean),
  });

  return modal;
}

/**
 * Arranque del aviso. Se llama una vez desde `main.js`, después del layout.
 */
export function initCookieConsent({ delay = 800 } = {}) {
  if (getCookieConsent()) return;
  window.setTimeout(showCookieBanner, delay);
}
