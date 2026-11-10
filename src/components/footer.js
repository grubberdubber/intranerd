import { APP_NAME, config } from '../config.js';
import { NAV_ITEMS } from '../data/constants.js';
import { el } from '../utils/dom.js';
import { openAccessibilityPreferences } from './accessibility.js';
import { openCookiePreferences } from './cookieConsent.js';
import { icon } from './icon.js';
import { openLegalModal } from './legal.js';

/**
 * Footer institucional de la SPA.
 *
 * Reúne navegación secundaria, recursos para el equipo, canales de contacto y
 * accesos a los documentos legales. Los enlaces legales abren un modal, así
 * que no sacan a la persona de la aplicación.
 */

const PLATFORM_LINKS = ['dashboard', 'grades', 'calendar', 'announcements', 'tasks'];

const RESOURCE_LINKS = [
  {
    label: 'Guía del equipo',
    href: 'docs/GUIA-EQUIPO.md',
    iconName: 'book',
    title: 'Aprende HTML, CSS, tipografías, iconos y SPA desde cero',
  },
  {
    label: 'Arquitectura',
    href: 'docs/ARCHITECTURE.md',
    iconName: 'clipboard',
    title: 'Cómo se conectan la SPA, la API y la base de datos',
  },
  {
    label: 'API (OpenAPI)',
    href: 'docs/openapi.yaml',
    iconName: 'code',
    title: 'Contrato REST de la plataforma',
  },
];

function footerLink({ label, href, iconName, external = false, title, route }) {
  const attrs = {
    ...(external ? { target: '_blank', rel: 'noopener' } : {}),
    ...(route ? { 'data-footer-route': route } : {}),
  };

  return el(
    'li',
    {},
    el(
      'a',
      { class: 'footer__link', href, title: title || label, attrs },
      iconName
        ? el('span', { class: 'footer__link-icon', html: icon(iconName, { size: 14 }) })
        : null,
      el('span', { text: label }),
      external ? el('span', { class: 'sr-only', text: ' (abre en una pestaña nueva)' }) : null,
    ),
  );
}

function footerButton({ label, iconName, onClick }) {
  return el(
    'li',
    {},
    el(
      'button',
      {
        class: 'footer__link',
        type: 'button',
        attrs: { 'aria-haspopup': 'dialog' },
        on: { click: onClick },
      },
      iconName
        ? el('span', { class: 'footer__link-icon', html: icon(iconName, { size: 14 }) })
        : null,
      el('span', { text: label }),
    ),
  );
}

function legalButton({ label, documentId, onClick }) {
  return footerButton({
    label,
    onClick: onClick || (() => openLegalModal(documentId)),
  });
}

export function createFooter() {
  const year = new Date().getFullYear();
  const platformItems = PLATFORM_LINKS.map((id) => NAV_ITEMS.find((item) => item.id === id)).filter(
    Boolean,
  );

  return el(
    'footer',
    { class: 'site-footer', attrs: { 'aria-labelledby': 'site-footer-title' } },
    el(
      'div',
      { class: 'site-footer__inner' },
      el(
        'div',
        { class: 'site-footer__brand' },
        el(
          'a',
          { class: 'site-footer__brand-link', href: '#/panel' },
          el('img', {
            src: 'assets/brand/intranerd-mark.svg',
            alt: '',
            width: '40',
            height: '40',
            loading: 'lazy',
            decoding: 'async',
          }),
          el(
            'span',
            { class: 'site-footer__brand-text' },
            el('span', { class: 'site-footer__name', id: 'site-footer-title', text: APP_NAME }),
            el('span', { class: 'site-footer__tagline', text: config.app.tagline }),
          ),
        ),
        el('p', {
          class: 'site-footer__about',
          text:
            'El punto de encuentro digital de nuestra comunidad escolar. Un proyecto del ' +
            'equipo de la escuela, hecho para alumnado, profesorado, apoderados y dirección.',
        }),
        el(
          'p',
          { class: 'site-footer__school' },
          el('span', { html: icon('mapPin', { size: 14 }), attrs: { 'aria-hidden': 'true' } }),
          el('span', { text: config.app.school }),
        ),
      ),
      el(
        'nav',
        { class: 'site-footer__col', attrs: { 'aria-labelledby': 'footer-platform-title' } },
        el('h2', {
          class: 'site-footer__heading',
          id: 'footer-platform-title',
          text: 'Plataforma',
        }),
        el(
          'ul',
          { class: 'footer__list' },
          ...platformItems.map((item) =>
            footerLink({
              label: item.shortLabel,
              href: `#${item.path}`,
              iconName: item.icon,
              title: item.description,
              route: item.id,
            }),
          ),
        ),
      ),
      el(
        'nav',
        { class: 'site-footer__col', attrs: { 'aria-labelledby': 'footer-resources-title' } },
        el('h2', {
          class: 'site-footer__heading',
          id: 'footer-resources-title',
          text: 'Recursos',
        }),
        el(
          'ul',
          { class: 'footer__list' },
          ...RESOURCE_LINKS.map((resource) => footerLink({ ...resource, external: true })),
          footerButton({
            label: 'Accesibilidad',
            iconName: 'accessibility',
            onClick: () => openAccessibilityPreferences(),
          }),
          footerLink({
            label: 'Contacto y soporte',
            href: '#/contacto',
            iconName: 'mail',
            title: 'Escríbenos',
          }),
        ),
      ),
      el(
        'section',
        { class: 'site-footer__col', attrs: { 'aria-labelledby': 'footer-legal-title' } },
        el('h2', {
          class: 'site-footer__heading',
          id: 'footer-legal-title',
          text: 'Legal',
        }),
        el(
          'ul',
          { class: 'footer__list' },
          legalButton({ label: 'Términos y condiciones', documentId: 'terms' }),
          legalButton({ label: 'Política de privacidad', documentId: 'privacy' }),
          legalButton({ label: 'Política de cookies', documentId: 'cookies' }),
          legalButton({ label: 'Declaración de accesibilidad', documentId: 'accessibility' }),
          legalButton({
            label: 'Preferencias de cookies',
            onClick: () => openCookiePreferences(),
          }),
        ),
        el(
          'div',
          { class: 'site-footer__contact' },
          el(
            'a',
            { class: 'site-footer__contact-link', href: `mailto:${config.contact.email}` },
            el('span', { html: icon('mail', { size: 14 }), attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: config.contact.email }),
          ),
          el(
            'a',
            {
              class: 'site-footer__contact-link',
              href: `tel:${config.contact.phone.replace(/\s+/g, '')}`,
            },
            el('span', { html: icon('phone', { size: 14 }), attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: config.contact.phone }),
          ),
        ),
      ),
    ),
    el(
      'div',
      { class: 'site-footer__bottom' },
      el(
        'p',
        { class: 'site-footer__copyright' },
        `© ${year} ${APP_NAME} · ${config.app.school}. Todos los derechos reservados.`,
      ),
      el(
        'p',
        { class: 'site-footer__team' },
        el('span', { html: icon('heart', { size: 13 }), attrs: { 'aria-hidden': 'true' } }),
        el('span', { text: `Hecho por el equipo de la escuela · v${config.app.version}` }),
      ),
      el(
        'span',
        { class: 'site-footer__badge' },
        el('span', { html: icon('shield', { size: 13 }), attrs: { 'aria-hidden': 'true' } }),
        el('span', { text: 'Datos guardados en tu navegador' }),
      ),
    ),
  );
}
