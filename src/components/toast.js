import { config } from '../config.js';
import { el } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * Notificaciones no bloqueantes. Se apilan en la esquina inferior derecha
 * y se eliminan automáticamente sin interrumpir el flujo de la vista.
 */
const TYPE_META = {
  success: { icon: 'checkCircle', title: 'Listo' },
  error: { icon: 'xCircle', title: 'No se pudo completar' },
  warning: { icon: 'alert', title: 'Atención' },
  info: { icon: 'info', title: 'Información' },
};

function getRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = el('div', {
      id: 'toast-root',
      class: 'toast-stack',
      attrs: { role: 'status', 'aria-live': 'polite' },
    });
    document.body.appendChild(root);
  }
  return root;
}

function removeToast(node) {
  if (!node || !node.isConnected) return;
  node.classList.add('is-leaving');
  window.setTimeout(() => node.remove(), 200);
}

export function toast(message, options = {}) {
  const { type = 'info', title, duration = config.ui.toastDuration, action = null } = options;

  const meta = TYPE_META[type] || TYPE_META.info;
  const root = getRoot();

  const closeButton = el('button', {
    class: 'toast__close',
    type: 'button',
    attrs: { 'aria-label': 'Cerrar notificación' },
    html: icon('x', { size: 14 }),
    on: { click: () => removeToast(node) },
  });

  const body = el(
    'div',
    { class: 'toast__body' },
    el('strong', { class: 'toast__title', text: title || meta.title }),
    el('span', { class: 'toast__message', text: String(message || '') }),
  );

  if (action?.label && typeof action.onClick === 'function') {
    body.appendChild(
      el('button', {
        class: 'btn btn--link',
        type: 'button',
        text: action.label,
        on: {
          click: () => {
            action.onClick();
            removeToast(node);
          },
        },
      }),
    );
  }

  const node = el(
    'div',
    { class: `toast toast--${type}`, attrs: { role: 'status' } },
    el('span', { class: 'toast__icon', html: icon(meta.icon, { size: 15 }) }),
    body,
    closeButton,
  );

  root.appendChild(node);

  while (root.children.length > 4) {
    root.firstElementChild?.remove();
  }

  if (duration > 0) {
    const timer = window.setTimeout(() => removeToast(node), duration);
    node.addEventListener('mouseenter', () => window.clearTimeout(timer), { once: true });
  }

  return {
    close: () => removeToast(node),
    element: node,
  };
}

toast.success = (message, options) => toast(message, { ...options, type: 'success' });
toast.error = (message, options) => toast(message, { ...options, type: 'error', duration: 6500 });
toast.warning = (message, options) => toast(message, { ...options, type: 'warning' });
toast.info = (message, options) => toast(message, { ...options, type: 'info' });
