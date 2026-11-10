import { LEGAL_DOCUMENTS, LEGAL_UPDATED, LEGAL_VERSION } from '../data/legal.js';
import { el } from '../utils/dom.js';
import { icon } from './icon.js';
import { openModal } from './modal.js';

/**
 * Renderiza un documento legal completo como nodo de DOM.
 * Las secciones viven en `src/data/legal.js`; aquí solo se da formato.
 */
export function renderLegalDocument(document) {
  const sections = document.sections.map((section) =>
    el(
      'section',
      { class: 'legal-doc__section' },
      el('h3', { class: 'legal-doc__heading', text: section.heading }),
      ...(section.paragraphs || []).map((text) => el('p', { class: 'legal-doc__text', text })),
      section.bullets
        ? el(
            'ul',
            { class: 'legal-doc__list' },
            ...section.bullets.map((text) => el('li', { text })),
          )
        : null,
    ),
  );

  return el(
    'article',
    { class: 'legal-doc' },
    el(
      'div',
      { class: 'legal-doc__meta' },
      el(
        'span',
        { class: 'legal-doc__badge' },
        el('span', { class: 'legal-doc__badge-icon', html: icon('shield', { size: 14 }) }),
        el('span', { text: `Versión ${LEGAL_VERSION}` }),
      ),
      el('span', { class: 'legal-doc__updated', text: `Actualizado: ${LEGAL_UPDATED}` }),
    ),
    el('p', { class: 'legal-doc__intro', text: document.intro }),
    ...sections,
    el(
      'p',
      { class: 'legal-doc__note' },
      el('span', { class: 'legal-doc__note-icon', html: icon('info', { size: 16 }) }),
      el('span', { text: document.footerNote }),
    ),
  );
}

/**
 * Abre un documento legal en un modal accesible.
 * @param {'terms'|'privacy'|'cookies'} documentId
 */
export function openLegalModal(documentId) {
  const document = LEGAL_DOCUMENTS[documentId];
  if (!document) return null;

  const modal = openModal({
    title: document.title,
    eyebrow: document.eyebrow,
    description: document.description,
    body: renderLegalDocument(document),
    size: 'lg',
    footer: [
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Entendido',
        on: { click: () => modal.close('accept') },
      }),
    ],
  });

  return modal;
}
