import { el, qs } from '../utils/dom.js';
import { formatBytes } from '../utils/files.js';
import { icon } from './icon.js';

/**
 * Selector de imagen/evidencia con vista previa y galería de ejemplos.
 * No persiste nada: la vista decide cuándo comprimir y guardar el archivo.
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

  const input = el('input', {
    type: 'file',
    accept,
    attrs: { 'aria-label': label },
  });

  const previewImage = el('img', {
    class: 'file-preview__thumb',
    alt: 'Vista previa',
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
      attrs: { 'aria-label': 'Quitar archivo' },
      html: icon('x', { size: 15 }),
      on: {
        click: () => {
          reset();
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

  const gallery = el('div', { class: 'example-gallery' });
  examples.forEach((url, index) => {
    gallery.appendChild(
      el('button', {
        class: 'example-gallery__item',
        type: 'button',
        attrs: { 'aria-label': `Usar imagen de ejemplo ${index + 1}`, 'data-url': url },
        html: `<img src="${url}" alt="" loading="lazy" />`,
        on: {
          click: () => {
            file = null;
            input.value = '';
            example = url;
            Array.from(gallery.children).forEach((item) =>
              item.classList.toggle('is-selected', item.dataset.url === url),
            );
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
    previewImage.hidden = true;
    preview.hidden = true;
    previewName.textContent = '';
    previewSize.textContent = '';
  }

  function showPreview(url, name, size) {
    clearPreview();
    previewUrl = url;
    previewImage.src = url;
    previewImage.hidden = false;
    preview.hidden = false;
    previewName.textContent = name;
    previewSize.textContent = size;
  }

  function reset() {
    file = null;
    example = '';
    input.value = '';
    clearPreview();
    Array.from(gallery.children).forEach((item) => item.classList.remove('is-selected'));
  }

  input.addEventListener('change', () => {
    const selected = input.files?.[0];
    if (!selected) return;
    file = selected;
    example = '';
    Array.from(gallery.children).forEach((item) => item.classList.remove('is-selected'));

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
    hint ? el('span', { class: 'field__hint', text: hint }) : null,
    examples.length
      ? el(
          'div',
          { class: 'photo-picker' },
          el('span', { class: 'photo-picker__label', text: examplesLabel }),
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
    setDisabled(value) {
      input.disabled = value;
      qs('button', gallery)?.toggleAttribute('disabled', value);
    },
  };
}
