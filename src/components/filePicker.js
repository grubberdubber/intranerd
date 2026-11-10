import { el, qs, qsa } from '../utils/dom.js';
import { formatBytes } from '../utils/files.js';
import { icon } from './icon.js';

let pickerCounter = 0;

/**
 * Selector de imagen/evidencia con vista previa y galería de ejemplos.
 * No persiste nada: la vista decide cuándo comprimir y guardar el archivo.
 *
 * Accesibilidad:
 * - El input real está oculto, pero el foco se dibuja con `.file-drop:focus-within`.
 * - El input referencia sus ayudas con `aria-describedby`.
 * - Las miniaturas de ejemplo exponen su estado con `aria-pressed`.
 */
export function createFilePicker({
  label = 'Foto o evidencia',
  optional = true,
  accept = 'image/*',
  maxSizeLabel = 'Máx. 4 MB',
  hint = '',
  examples = [],
  examplesLabel = 'O elige una imagen de ejemplo:',
  previewKind = 'image',
} = {}) {
  let file = null;
  let example = '';
  let objectUrl = '';
  let previewUrl = '';

  pickerCounter += 1;
  const pickerId = `file-picker-${pickerCounter}`;
  const hintId = `${pickerId}-hint`;
  const extraHintId = `${pickerId}-extra-hint`;
  const errorId = `${pickerId}-error`;
  const examplesLabelId = `${pickerId}-examples-label`;

  const errorNode = el('span', {
    class: 'field__error',
    id: errorId,
    hidden: true,
  });

  const describedBy = [hintId, hint ? extraHintId : ''].filter(Boolean).join(' ');
  const input = el('input', {
    type: 'file',
    accept,
    attrs: {
      'aria-label': label,
      'aria-describedby': describedBy,
    },
  });

  const previewImage = el('img', {
    class: 'file-preview__thumb',
    alt: '',
    hidden: true,
  });
  const previewName = el('span', { class: 'file-preview__name', text: '' });
  const previewSize = el('span', { class: 'file-preview__size', text: '' });
  const preview = el(
    'div',
    { class: 'file-preview', hidden: true },
    previewImage,
    el('div', { class: 'file-preview__meta' }, previewName, previewSize),
    el('button', {
      class: 'icon-btn icon-btn--danger',
      type: 'button',
      attrs: { 'aria-label': 'Quitar archivo seleccionado' },
      html: icon('x', { size: 15 }),
      on: {
        click: () => {
          reset({ focus: true });
        },
      },
    }),
  );

  const dropTitle = el('span', {
    class: 'file-drop__title',
    text: 'Haz clic o arrastra un archivo aquí',
  });
  const dropHint = el('span', {
    class: 'file-drop__hint',
    id: hintId,
    text: `${maxSizeLabel}${accept.includes('image') ? ' · JPG, PNG o WebP' : ''}`,
  });

  const drop = el(
    'label',
    { class: 'file-drop' },
    el('span', { class: 'file-drop__icon', html: icon('upload', { size: 19 }) }),
    dropTitle,
    dropHint,
    input,
  );

  const gallery = el('div', {
    class: 'example-gallery',
    attrs: {
      role: 'group',
      'aria-labelledby': examplesLabelId,
    },
  });
  examples.forEach((url, index) => {
    gallery.appendChild(
      el('button', {
        class: 'example-gallery__item',
        type: 'button',
        attrs: {
          'aria-label': `Usar imagen de ejemplo ${index + 1}`,
          'aria-pressed': 'false',
          'data-url': url,
        },
        html: `<img src="${url}" alt="" loading="lazy" />`,
        on: {
          click: () => {
            file = null;
            input.value = '';
            example = url;
            clearError();
            Array.from(gallery.children).forEach((item) => {
              const selected = item.dataset.url === url;
              item.classList.toggle('is-selected', selected);
              item.setAttribute('aria-pressed', String(selected));
            });
            showPreview(url, 'Imagen de ejemplo', 'Seleccionada');
          },
        },
      }),
    );
  });

  function clearPreview() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    previewUrl = '';
    previewImage.removeAttribute('src');
    previewImage.alt = '';
    previewImage.hidden = true;
    preview.hidden = true;
    previewName.textContent = '';
    previewSize.textContent = '';
  }

  function showPreview(url, name, size) {
    clearPreview();
    previewUrl = url;
    previewImage.src = url;
    previewImage.alt =
      name === 'Imagen de ejemplo'
        ? 'Vista previa de la imagen de ejemplo seleccionada'
        : `Vista previa de ${name}`;
    previewImage.hidden = false;
    preview.hidden = false;
    previewName.textContent = name;
    previewSize.textContent = size;
  }

  function clearError() {
    errorNode.hidden = true;
    errorNode.textContent = '';
    input.removeAttribute('aria-invalid');
    setDescribedBy(false);
  }

  function setError(message) {
    errorNode.textContent = message;
    errorNode.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    setDescribedBy(true);
  }

  /**
   * Mantiene las ayudas del campo y añade/retira el error sin pisar otros ids.
   */
  function setDescribedBy(includeError) {
    const ids = new Set(
      (input.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((token) => token && token !== errorId),
    );
    if (includeError) ids.add(errorId);
    input.setAttribute(
      'aria-describedby',
      [...ids].filter(Boolean).join(' ') || (includeError ? errorId : ''),
    );
    if (!ids.size && !includeError) input.removeAttribute('aria-describedby');
  }

  function reset({ focus = false } = {}) {
    file = null;
    example = '';
    input.value = '';
    clearPreview();
    clearError();
    Array.from(gallery.children).forEach((item) => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    if (focus) input.focus();
  }

  input.addEventListener('change', () => {
    const selected = input.files?.[0];
    if (!selected) return;
    file = selected;
    example = '';
    clearError();
    Array.from(gallery.children).forEach((item) => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });

    if (previewKind === 'image' && selected.type.startsWith('image/')) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(selected);
      showPreview(objectUrl, selected.name, formatBytes(selected.size));
    } else {
      clearPreview();
      preview.hidden = false;
      previewName.textContent = selected.name;
      previewSize.textContent = `${formatBytes(selected.size)} · listo para adjuntar`;
    }
  });

  const field = el(
    'div',
    { class: 'field' },
    el(
      'span',
      { class: 'field__label' },
      label,
      optional ? el('span', { class: 'field__optional', text: '(opcional)' }) : null,
    ),
    drop,
    preview,
    errorNode,
    hint
      ? el('span', {
          class: 'field__hint',
          id: extraHintId,
          text: hint,
        })
      : null,
    examples.length
      ? el(
          'div',
          { class: 'photo-picker' },
          el('span', {
            class: 'photo-picker__label',
            id: examplesLabelId,
            text: examplesLabel,
          }),
          gallery,
        )
      : null,
  );

  return {
    field,
    input,
    getFile: () => file,
    getExample: () => example,
    getValue: () => (file ? previewUrl : example),
    hasSelection: () => Boolean(file || example),
    reset,
    setError,
    clearError,
    setDisabled(value) {
      input.disabled = value;
      qsa('button', gallery).forEach((button) => {
        button.disabled = value;
      });
      drop.classList.toggle('is-disabled', value);
    },
  };
}

/** Expuesto para pruebas de integración y depuración. */
export function firstPickerInput(root) {
  return qs('.file-drop input[type="file"]', root);
}
