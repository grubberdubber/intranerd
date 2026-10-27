/**
 * Helpers de DOM sin dependencias.
 * Prioriza textContent para datos de usuario y deja innerHTML solo para
 * fragmentos construidos internamente (iconos, plantillas controladas).
 */

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const escapeAttr = escapeHtml;

/**
 * Crea un elemento con una API declarativa.
 * el('button', { class: 'btn', text: 'Guardar', on: { click: save } })
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  Object.entries(props || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;

    if (key === 'class' || key === 'className') {
      node.className = value;
      return;
    }
    if (key === 'text') {
      node.textContent = value;
      return;
    }
    if (key === 'html') {
      node.innerHTML = value;
      return;
    }
    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        if (dataValue !== undefined && dataValue !== null) node.dataset[dataKey] = dataValue;
      });
      return;
    }
    if (key === 'attrs') {
      Object.entries(value).forEach(([attr, attrValue]) => {
        if (attrValue === undefined || attrValue === null || attrValue === false) return;
        node.setAttribute(attr, attrValue === true ? '' : attrValue);
      });
      return;
    }
    if (key === 'on') {
      Object.entries(value).forEach(([event, handler]) => {
        if (typeof handler === 'function') node.addEventListener(event, handler);
      });
      return;
    }
    if (key === 'cssVar') {
      Object.entries(value).forEach(([name, cssValue]) => node.style.setProperty(name, cssValue));
      return;
    }
    if (key in node && key !== 'list' && key !== 'form') {
      node[key] = value;
      return;
    }
    node.setAttribute(key, value === true ? '' : value);
  });

  appendChildren(node, children);
  return node;
}

export function appendChildren(node, children) {
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String(child)));
    }
  });
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function replaceContent(node, ...children) {
  clear(node);
  appendChildren(node, children);
  return node;
}

/**
 * Delegación de eventos: evita reasignar listeners al re-renderizar listas.
 */
export function delegate(root, eventName, selector, handler) {
  const listener = (event) => {
    const target = event.target.closest(selector);
    if (!target || !root.contains(target)) return;
    handler(event, target);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

export function debounce(fn, wait = 220) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function setFieldError(input, message) {
  if (!input) return;
  input.setAttribute('aria-invalid', 'true');
  const field = input.closest('.field');
  if (!field) return;
  let error = field.querySelector('.field__error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'field__error';
    field.appendChild(error);
  }
  error.textContent = message;
}

export function clearFieldErrors(root) {
  qsa('[aria-invalid="true"]', root).forEach((input) => input.removeAttribute('aria-invalid'));
  qsa('.field__error', root).forEach((error) => error.remove());
}

export function onEscape(handler) {
  const listener = (event) => {
    if (event.key === 'Escape') handler(event);
  };
  document.addEventListener('keydown', listener);
  return () => document.removeEventListener('keydown', listener);
}

export function focusFirst(root) {
  const selector = [
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  const target = root.querySelector(selector);
  target?.focus();
}

export function isImageFile(file) {
  return Boolean(file && file.type.startsWith('image/'));
}

export function safeUrl(value) {
  if (!value) return '';
  const url = String(value).trim();
  if (/^(https?:|data:image\/|data:video\/|data:application\/pdf|assets\/|blob:)/i.test(url))
    return url;
  return '';
}
