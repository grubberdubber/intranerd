import { el } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * Componentes compartidos para carga y vacío.
 */

export function skeletonBlock(className = '') {
  return el('div', { class: `skeleton ${className}`.trim(), attrs: { 'aria-hidden': 'true' } });
}

export function skeletonRows(count = 3) {
  return el(
    'div',
    { class: 'skeleton-group', attrs: { 'aria-label': 'Cargando contenido', role: 'status' } },
    ...Array.from({ length: count }, () =>
      el(
        'div',
        { class: 'skeleton-group--row' },
        skeletonBlock('skeleton--thumb'),
        el(
          'div',
          { class: 'skeleton--body' },
          skeletonBlock('skeleton--title'),
          skeletonBlock('skeleton--text'),
          skeletonBlock('skeleton--text'),
        ),
      ),
    ),
  );
}

export function skeletonCards(count = 3) {
  return el(
    'div',
    { class: 'grid-auto', attrs: { 'aria-label': 'Cargando contenido', role: 'status' } },
    ...Array.from({ length: count }, () => skeletonBlock('skeleton--card')),
  );
}

export function loadingBlock(message = 'Cargando información…') {
  return el(
    'div',
    { class: 'loading-block', attrs: { role: 'status', 'aria-live': 'polite' } },
    el('span', { class: 'spinner' }),
    el('span', { text: message }),
  );
}

export function emptyState({
  iconName = 'info',
  title = 'Sin información',
  text = '',
  action = null,
  compact = false,
} = {}) {
  return el(
    'div',
    { class: `empty-state${compact ? ' empty-state--compact' : ''}` },
    el('span', { class: 'empty-state__icon', html: icon(iconName, { size: 24 }) }),
    el('h3', { class: 'empty-state__title', text: title }),
    text ? el('p', { class: 'empty-state__text', text }) : null,
    action || null,
  );
}
