import { el } from '../utils/dom.js';

export function pageHeader({ eyebrow, title, description, actions = [] } = {}) {
  return el(
    'header',
    { class: 'page-header' },
    el(
      'div',
      { class: 'page-header__text' },
      eyebrow ? el('span', { class: 'page-header__eyebrow', text: eyebrow }) : null,
      el('h1', { class: 'page-header__title', text: title || '' }),
      description ? el('p', { class: 'page-header__description', text: description }) : null,
    ),
    actions.length ? el('div', { class: 'page-header__actions' }, ...actions) : null,
  );
}
