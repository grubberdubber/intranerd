import { el } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * Estrellas estáticas y selector interactivo accesible.
 */

export function staticStars(value = 0, { size = 15, className = '', decorative = false } = {}) {
  const rounded = Math.round(Number(value) || 0);
  const wrapper = el('span', {
    class: `stars stars--sm ${className}`.trim(),
    attrs: decorative
      ? { 'aria-hidden': 'true' }
      : {
          role: 'img',
          'aria-label': `${Number(value).toFixed(1)} de 5 estrellas`,
        },
  });

  for (let index = 1; index <= 5; index += 1) {
    wrapper.appendChild(
      el('span', {
        class: `stars__star${index <= rounded ? ' is-filled' : ''}`,
        html: icon('star', { size, strokeWidth: 1.6 }),
        attrs: { 'aria-hidden': 'true' },
      }),
    );
  }
  return wrapper;
}

export function ratingSummary(value = 0, count = 0) {
  return el(
    'span',
    {
      class: 'rating-summary',
      attrs: {
        role: 'img',
        'aria-label': `${Number(value || 0).toFixed(1)} de 5 estrellas, ${count} ${
          count === 1 ? 'calificación' : 'calificaciones'
        }`,
      },
    },
    // El resumen ya tiene un nombre accesible completo; las estrellas son decorativas.
    staticStars(value, { size: 14, decorative: true }),
    el('span', {
      class: 'rating-summary__value',
      text: Number(value || 0).toFixed(1),
      attrs: { 'aria-hidden': 'true' },
    }),
    el('span', {
      class: 'rating-summary__count',
      text: `(${count} ${count === 1 ? 'calificación' : 'calificaciones'})`,
      attrs: { 'aria-hidden': 'true' },
    }),
  );
}

/**
 * Selector de 1 a 5 estrellas. Expone getValue/setValue en el nodo.
 */
export function createStarRating({ value = 0, onChange = null, label = 'Calificación' } = {}) {
  let current = Number(value) || 0;
  const wrapper = el('div', {
    class: 'stars stars--interactive stars--lg',
    attrs: {
      role: 'radiogroup',
      'aria-label': label,
      'aria-orientation': 'horizontal',
    },
  });

  const buttons = [];
  const paint = (preview = null) => {
    const active = preview ?? current;
    const focusable = current >= 1 && current <= 5 ? current : 1;
    buttons.forEach((button, index) => {
      const isActive = index + 1 <= active;
      button.classList.toggle('is-filled', isActive);
      button.classList.toggle('is-preview', preview !== null && isActive);
      button.setAttribute('aria-checked', String(current === index + 1));
      // Roving tabindex: el grupo ocupa un solo tab stop (patrón radiogroup).
      button.tabIndex = index + 1 === focusable ? 0 : -1;
    });
  };

  const select = (value) => {
    current = value;
    paint();
    if (typeof onChange === 'function') onChange(current);
  };

  for (let index = 1; index <= 5; index += 1) {
    const button = el('button', {
      class: 'stars__star',
      type: 'button',
      attrs: {
        role: 'radio',
        'aria-checked': String(current === index),
        'aria-label': `${index} ${index === 1 ? 'estrella' : 'estrellas'}`,
        'data-value': index,
      },
      html: icon('star', { size: 29, strokeWidth: 1.5 }),
      on: {
        click: () => select(index),
        mouseenter: () => paint(index),
        mouseleave: () => paint(),
        focus: () => paint(index),
        blur: () => paint(),
      },
    });
    buttons.push(button);
    wrapper.appendChild(button);
  }

  wrapper.addEventListener('keydown', (event) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const focused = buttons.indexOf(document.activeElement);
    const from = focused === -1 ? Math.max(current - 1, 0) : focused;
    let next = from;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (from + 1) % buttons.length;
    } else {
      next = (from - 1 + buttons.length) % buttons.length;
    }

    select(next + 1);
    buttons[next].focus();
  });

  wrapper.getValue = () => current;
  wrapper.setValue = (nextValue) => {
    current = Number(nextValue) || 0;
    paint();
  };
  paint();
  return wrapper;
}
