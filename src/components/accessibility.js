import {
  CONTRAST_MODES,
  MOTION_MODES,
  TEXT_SIZES,
  getPreferences,
  resetPreferences,
  savePreferences,
} from '../services/preferences.js';
import { el, qsa } from '../utils/dom.js';
import { icon } from './icon.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';

/**
 * Centro de accesibilidad: tamaño de texto, contraste y movimiento.
 *
 * Usa un formulario con radios nativos para conservar la navegación por
 * teclado y el anuncio del lector de pantalla. Los cambios se aplican al
 * guardar; "Restablecer" vuelve a los valores del sistema.
 */

function choice({ name, value, label, hint, checked }) {
  return el(
    'label',
    { class: 'a11y-choice' },
    el(
      'span',
      { class: 'a11y-choice__body' },
      el('span', { class: 'a11y-choice__label', text: label }),
      el('span', { class: 'a11y-choice__hint', text: hint }),
    ),
    el('input', {
      class: 'a11y-choice__input',
      type: 'radio',
      name,
      value,
      checked,
    }),
  );
}

function group({ legend, hint, name, options, current }) {
  return el(
    'fieldset',
    { class: 'a11y-group' },
    el('legend', { class: 'a11y-group__legend', text: legend }),
    hint ? el('p', { class: 'a11y-group__hint', text: hint }) : null,
    el(
      'div',
      { class: 'a11y-group__options' },
      ...Object.entries(options).map(([value, option]) =>
        choice({
          name,
          value,
          label: option.label,
          hint: option.hint,
          checked: current === value,
        }),
      ),
    ),
  );
}

function syncForm(form, preferences) {
  qsa('input[type="radio"]', form).forEach((input) => {
    input.checked = preferences[input.name] === input.value;
  });
}

export function openAccessibilityPreferences() {
  const preferences = getPreferences();

  const form = el(
    'form',
    {
      class: 'a11y-form',
      id: 'a11y-form',
      novalidate: true,
    },
    group({
      legend: 'Tamaño del texto',
      hint: 'Ajusta el texto y los espacios de toda la plataforma.',
      name: 'textSize',
      options: TEXT_SIZES,
      current: preferences.textSize,
    }),
    group({
      legend: 'Contraste',
      hint: 'El alto contraste refuerza bordes y textos sobre fondos blancos.',
      name: 'contrast',
      options: CONTRAST_MODES,
      current: preferences.contrast,
    }),
    group({
      legend: 'Movimiento',
      hint: 'Si tu equipo ya pide movimiento reducido, IntraNerd lo respeta igualmente.',
      name: 'motion',
      options: MOTION_MODES,
      current: preferences.motion,
    }),
  );

  const body = el(
    'div',
    { class: 'a11y-panel' },
    el('p', {
      class: 'a11y-panel__intro',
      text:
        'Estos ajustes cambian solo la presentación y se guardan en este navegador. ' +
        'Puedes modificarlos o restablecerlos cuando quieras.',
    }),
    form,
    el(
      'p',
      { class: 'a11y-panel__note' },
      el('span', { class: 'a11y-panel__note-icon', html: icon('info', { size: 16 }) }),
      el('span', {
        text:
          'Consejo: usa Tab para moverte, las flechas para elegir una opción y ' +
          'Enter para guardar. El botón de accesibilidad también está en el pie de página.',
      }),
    ),
  );

  const modal = openModal({
    title: 'Accesibilidad',
    eyebrow: 'A tu medida',
    description: 'Adapta la lectura, el contraste y el movimiento de IntraNerd.',
    body,
    size: 'md',
    footer: [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Restablecer',
        on: {
          click: () => {
            try {
              syncForm(form, resetPreferences());
              toast.info('Preferencias de accesibilidad restablecidas.');
            } catch (error) {
              console.error('[IntraNerd] No se pudieron restablecer las preferencias.', error);
              toast.error('No pudimos restablecer las preferencias en este navegador.');
            }
          },
        },
      }),
      el('button', {
        class: 'btn btn--primary',
        type: 'submit',
        text: 'Guardar preferencias',
        attrs: { form: 'a11y-form' },
      }),
    ],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const next = savePreferences({
        textSize: data.get('textSize'),
        contrast: data.get('contrast'),
        motion: data.get('motion'),
      });
      syncForm(form, next);
      toast.success('Preferencias de accesibilidad guardadas.');
      modal.close('save');
    } catch (error) {
      console.error('[IntraNerd] No se pudieron guardar las preferencias.', error);
      toast.error(
        error.message || 'No pudimos guardar las preferencias. Revisa el almacenamiento.',
      );
    }
  });

  return modal;
}
