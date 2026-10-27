import { el, focusFirst, qsa } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * Modal accesible con focus trap, cierre por Escape y bloqueo de scroll.
 * Devuelve una API mínima para que las vistas controlen su contenido.
 */
const openModals = [];

function getRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = el('div', { id: 'modal-root' });
    document.body.appendChild(root);
  }
  return root;
}

function lockBody() {
  if (openModals.length === 1) document.body.classList.add('is-locked');
}

function unlockBody() {
  if (openModals.length === 0) document.body.classList.remove('is-locked');
}

function focusableElements(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return qsa(selector, container).filter(
    (node) => node.offsetParent !== null || node === document.activeElement,
  );
}

export function openModal(options = {}) {
  const {
    title = '',
    eyebrow = '',
    description = '',
    body = null,
    footer = null,
    size = 'md',
    onClose = null,
    closeOnBackdrop = true,
    initialFocus = null,
  } = options;

  const previousFocus = document.activeElement;
  const titleId = `modal-title-${Date.now()}`;
  const root = getRoot();

  const close = (reason = 'dismiss') => {
    const index = openModals.findIndex((modal) => modal.element === backdrop);
    if (index === -1) return;
    openModals.splice(index, 1);
    backdrop.remove();
    unlockBody();
    document.removeEventListener('keydown', onKeyDown);
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
    if (typeof onClose === 'function') onClose(reason);
  };

  const closeButton = el('button', {
    class: 'icon-btn modal__close',
    type: 'button',
    attrs: { 'aria-label': 'Cerrar ventana' },
    html: icon('x', { size: 18 }),
    on: { click: () => close('close-button') },
  });

  const heading = el(
    'div',
    { class: 'modal__heading' },
    eyebrow ? el('span', { class: 'modal__eyebrow', text: eyebrow }) : null,
    el('h2', { class: 'modal__title', id: titleId, text: title }),
    description ? el('p', { class: 'modal__description', text: description }) : null,
  );

  const header = el('header', { class: 'modal__header' }, heading, closeButton);

  const bodyNode = el('div', { class: 'modal__body' });
  if (body instanceof Node) {
    bodyNode.appendChild(body);
  } else if (typeof body === 'string') {
    bodyNode.innerHTML = body;
  }

  const modal = el(
    'section',
    {
      class: `modal${size === 'sm' ? ' modal--sm' : size === 'lg' ? ' modal--lg' : size === 'xl' ? ' modal--xl' : ''}`,
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabindex: '-1' },
    },
    header,
    bodyNode,
  );

  if (footer) {
    const footerNode = el('footer', { class: 'modal__footer' });
    if (footer instanceof Node) footerNode.appendChild(footer);
    else if (Array.isArray(footer))
      footer.forEach((child) => child && footerNode.appendChild(child));
    else if (typeof footer === 'string') footerNode.innerHTML = footer;
    modal.appendChild(footerNode);
  }

  const backdrop = el(
    'div',
    {
      class: 'modal-backdrop',
      attrs: { 'data-modal-backdrop': 'true' },
      on: {
        mousedown: (event) => {
          if (closeOnBackdrop && event.target === backdrop) close('backdrop');
        },
      },
    },
    modal,
  );

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close('escape');
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = focusableElements(modal);
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  root.appendChild(backdrop);
  openModals.push({ element: backdrop, close });
  lockBody();
  document.addEventListener('keydown', onKeyDown);

  requestAnimationFrame(() => {
    if (initialFocus instanceof HTMLElement && initialFocus.isConnected) {
      initialFocus.focus();
      return;
    }
    focusFirst(modal);
  });

  return {
    element: modal,
    backdrop,
    body: bodyNode,
    close,
  };
}

export function confirmDialog({
  title = '¿Confirmar acción?',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
} = {}) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value, modal) => {
      if (settled) return;
      settled = true;
      resolve(value);
      modal.close(value ? 'confirm' : 'cancel');
    };

    const body = el(
      'div',
      { class: 'confirm' },
      el('span', {
        class: `confirm__icon${tone === 'danger' ? '' : ' confirm__icon--soft'}`,
        html: icon(tone === 'danger' ? 'alert' : 'info', { size: 22 }),
      }),
      el('p', { class: 'confirm__text', text: message }),
    );

    const modal = openModal({
      title,
      body,
      size: 'sm',
      onClose: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      },
      footer: [
        el('button', {
          class: 'btn btn--ghost',
          type: 'button',
          text: cancelLabel,
          on: { click: () => finish(false, modal) },
        }),
        el('button', {
          class: `btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`,
          type: 'button',
          text: confirmLabel,
          on: { click: () => finish(true, modal) },
        }),
      ],
    });
  });
}

export function closeAllModals() {
  [...openModals].reverse().forEach((modal) => modal.close('all'));
}
