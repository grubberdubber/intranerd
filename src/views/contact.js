import { config } from '../config.js';
import { CONTACT_ROLES, CONTACT_TOPICS } from '../data/constants.js';
import { connection } from '../services/api.js';
import { http } from '../services/http.js';
import { contactRepo } from '../services/resources.js';
import { getProfile } from '../services/session.js';
import { clearFieldErrors, el, qs, setFieldError } from '../utils/dom.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { toast } from '../components/toast.js';

/**
 * Módulo 9 · Contacto, soporte y accesibilidad.
 *
 * El formulario es la vía oficial para reportar problemas técnicos, barreras
 * de accesibilidad, consultas académicas o ideas para la comunidad. Se apoya
 * en la API (Express + SQLite) y degrada a localStorage si el backend no está
 * disponible, igual que el resto de módulos de IntraNerd.
 */

const ROLE_TO_API = {
  student: 'STUDENT',
  guardian: 'GUARDIAN',
  teacher: 'TEACHER',
  direction: 'DIRECTION',
  other: 'OTHER',
};

const TOPIC_TO_API = {
  support: 'SUPPORT',
  accessibility: 'ACCESSIBILITY',
  academic: 'ACADEMIC',
  community: 'COMMUNITY',
  suggestion: 'SUGGESTION',
  other: 'OTHER',
};

function defaultRole() {
  const role = getProfile().role;
  return (
    {
      alumno: 'student',
      apoderado: 'guardian',
      profesor: 'teacher',
      direccion: 'direction',
    }[role] || 'other'
  );
}

function field({ id, label, hint, optional = false, input, hintId }) {
  return el(
    'div',
    { class: 'field' },
    el(
      'label',
      { class: 'field__label', attrs: { for: id } },
      label,
      optional ? el('span', { class: 'field__optional', text: '(opcional)' }) : null,
    ),
    input,
    hint
      ? el('span', {
          class: 'field__hint',
          id: hintId || `${id}-hint`,
          text: hint,
        })
      : null,
  );
}

function serviceModeLabel() {
  if (!config.api.enabled) return 'Modo local seguro';
  return connection.isApi ? 'API conectada' : 'Respaldo local disponible';
}

function serviceModeDetail() {
  if (!config.api.enabled) {
    return 'La API está desactivada en este entorno. Los mensajes quedan en este navegador.';
  }
  return connection.isApi
    ? 'Tu mensaje se guarda en la bandeja del colegio mediante la API REST.'
    : 'Si la API no responde, el mensaje se guarda en este navegador y puedes reintentar.';
}

export async function mount(container) {
  const profile = getProfile();
  const nameValue = profile.name === 'Visitante' ? '' : profile.name;

  const nameInput = el('input', {
    class: 'input',
    id: 'contact-name',
    name: 'name',
    type: 'text',
    value: nameValue,
    placeholder: 'Ej: Camila Rojas',
    required: true,
    autocomplete: 'name',
    maxlength: '120',
  });

  const emailInput = el('input', {
    class: 'input',
    id: 'contact-email',
    name: 'email',
    type: 'email',
    placeholder: 'tu.correo@colegio.cl',
    required: true,
    autocomplete: 'email',
    inputmode: 'email',
    maxlength: '180',
    attrs: { 'aria-describedby': 'contact-email-hint' },
  });

  const roleSelect = el(
    'select',
    { class: 'select', id: 'contact-role', name: 'role', required: true },
    ...CONTACT_ROLES.map((role) =>
      el('option', {
        value: role.id,
        text: role.label,
        selected: role.id === defaultRole(),
      }),
    ),
  );

  const topicSelect = el(
    'select',
    { class: 'select', id: 'contact-topic', name: 'topic', required: true },
    ...CONTACT_TOPICS.map((topic) =>
      el('option', {
        value: topic.id,
        text: topic.label,
        selected: topic.id === 'support',
      }),
    ),
  );

  const subjectInput = el('input', {
    class: 'input',
    id: 'contact-subject',
    name: 'subject',
    type: 'text',
    placeholder: 'Resumen breve de tu mensaje',
    required: true,
    maxlength: '140',
  });

  const messageInput = el('textarea', {
    class: 'textarea',
    id: 'contact-message',
    name: 'message',
    placeholder: 'Cuéntanos qué necesitas, qué módulo usabas y qué esperabas que ocurriera…',
    required: true,
    rows: '6',
    maxlength: '4000',
    attrs: { 'aria-describedby': 'contact-message-hint contact-message-counter' },
  });

  const messageCounter = el('span', {
    class: 'field__hint contact-form__counter',
    id: 'contact-message-counter',
    attrs: { 'aria-live': 'polite' },
    text: '0 / 4000 caracteres',
  });

  const consentInput = el('input', {
    type: 'checkbox',
    id: 'contact-consent',
    name: 'consent',
    required: true,
  });

  const consentField = el(
    'div',
    { class: 'field field--consent' },
    el(
      'label',
      { class: 'checkbox', attrs: { for: 'contact-consent' } },
      consentInput,
      el('span', {
        text:
          'Autorizo a IntraNerd a usar estos datos únicamente para responder mi consulta ' +
          'y hacer seguimiento del caso.',
      }),
    ),
  );

  const statusRegion = el('div', {
    class: 'contact-form__status',
    id: 'contact-form-status',
    attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
  });

  const form = el(
    'form',
    {
      class: 'form contact-form',
      id: 'contact-form',
      novalidate: true,
      attrs: { 'aria-describedby': 'contact-form-help' },
    },
    el(
      'p',
      { class: 'contact-form__help', id: 'contact-form-help' },
      'Los campos marcados con ',
      el('span', { class: 'required-mark', text: '*' }),
      ' son obligatorios. ',
      config.contact.responseTime,
    ),
    el(
      'div',
      { class: 'form-grid' },
      field({
        id: 'contact-name',
        label: 'Nombre completo',
        input: nameInput,
      }),
      field({
        id: 'contact-email',
        label: 'Correo electrónico',
        hint: 'Lo usaremos solo para responderte.',
        hintId: 'contact-email-hint',
        input: emailInput,
      }),
    ),
    el(
      'div',
      { class: 'form-grid' },
      field({
        id: 'contact-role',
        label: 'Soy parte de la comunidad como',
        input: roleSelect,
      }),
      field({
        id: 'contact-topic',
        label: 'Motivo de contacto',
        input: topicSelect,
      }),
    ),
    field({
      id: 'contact-subject',
      label: 'Asunto',
      input: subjectInput,
    }),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', attrs: { for: 'contact-message' } }, 'Mensaje'),
      messageInput,
      el(
        'div',
        { class: 'contact-form__field-meta' },
        el('span', {
          class: 'field__hint',
          id: 'contact-message-hint',
          text: 'Incluye el módulo y el paso donde ocurrió, si es un problema técnico.',
        }),
        messageCounter,
      ),
    ),
    consentField,
    el(
      'div',
      { class: 'contact-form__actions' },
      el('button', {
        class: 'btn btn--primary btn--lg',
        type: 'submit',
        html: `${icon('mail', { size: 18 })}<span>Enviar mensaje</span>`,
      }),
      el('span', { class: 'contact-form__privacy' }, 'No compartimos tus datos con terceros.'),
    ),
    statusRegion,
  );

  const serviceStatus = el('strong', {
    class: 'contact-service__status',
    text: serviceModeLabel(),
  });
  const serviceDetail = el('span', {
    class: 'contact-service__detail',
    text: serviceModeDetail(),
  });

  const serviceBox = el(
    'div',
    { class: 'contact-service', attrs: { 'aria-live': 'polite' } },
    el('span', { class: 'contact-service__dot', attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'contact-service__text' }, serviceStatus, serviceDetail),
  );

  const serviceTest = el('button', {
    class: 'btn btn--ghost btn--sm',
    type: 'button',
    html: `${icon('refresh', { size: 15 })}<span>Probar conexión</span>`,
    on: {
      click: async () => {
        serviceTest.disabled = true;
        serviceTest.setAttribute('aria-busy', 'true');
        try {
          await http.get('/health');
          serviceStatus.textContent = 'API conectada';
          serviceDetail.textContent =
            'La API REST respondió correctamente. El formulario se enviará a la bandeja del colegio.';
          toast.success('Conexión con la API verificada.');
        } catch (error) {
          serviceStatus.textContent = 'Respaldo local activo';
          serviceDetail.textContent =
            'No fue posible contactar la API. El mensaje se guardará en este navegador.';
          toast.warning('La API no respondió. Se usará el respaldo local.', {
            title: 'Conexión no disponible',
          });
        } finally {
          serviceTest.disabled = false;
          serviceTest.removeAttribute('aria-busy');
        }
      },
    },
  });

  // La suscripción se cancela desde el router al desmontar la vista, evitando
  // listeners acumulados tras navegar repetidamente por el módulo.
  const unsubscribeConnection = connection.subscribe(({ mode, enabled }) => {
    serviceStatus.textContent = serviceModeLabel();
    serviceDetail.textContent = serviceModeDetail();
    serviceStatus.dataset.mode = enabled && mode === 'api' ? 'api' : 'local';
  });

  const mascot = el(
    'figure',
    { class: 'contact-mascot' },
    el('img', {
      src: 'assets/mascots/nerdi.webp',
      alt: 'Nerdi, el búho mascota de IntraNerd, señalando una pizarra con fórmulas.',
      width: '470',
      height: '520',
      loading: 'lazy',
      decoding: 'async',
    }),
    el(
      'figcaption',
      { class: 'contact-mascot__caption' },
      el('strong', { text: 'Nerdi te responde' }),
      el('span', {
        text: 'Cuéntanos qué necesitas y llevaremos tu mensaje al equipo correcto.',
      }),
    ),
  );

  const supportCard = el(
    'section',
    { class: 'contact-card', attrs: { 'aria-labelledby': 'contact-channels-title' } },
    el('h2', {
      class: 'contact-card__title',
      id: 'contact-channels-title',
      text: 'Canales directos',
    }),
    el(
      'ul',
      { class: 'contact-channels' },
      el(
        'li',
        {},
        el('span', { class: 'contact-channels__icon', html: icon('mail', { size: 17 }) }),
        el(
          'span',
          {},
          'Correo',
          el('a', { href: `mailto:${config.contact.email}`, text: config.contact.email }),
        ),
      ),
      el(
        'li',
        {},
        el('span', { class: 'contact-channels__icon', html: icon('phone', { size: 17 }) }),
        el(
          'span',
          {},
          'Teléfono',
          el('a', {
            href: `tel:${config.contact.phone.replace(/\s+/g, '')}`,
            text: config.contact.phone,
          }),
        ),
      ),
      el(
        'li',
        {},
        el('span', { class: 'contact-channels__icon', html: icon('clock', { size: 17 }) }),
        el('span', {}, 'Horario', el('span', { text: config.contact.hours })),
      ),
    ),
  );

  const techCard = el(
    'section',
    {
      class: 'contact-card contact-card--tech',
      attrs: { 'aria-labelledby': 'contact-tech-title' },
    },
    el(
      'div',
      { class: 'contact-card__heading' },
      el('span', { class: 'contact-card__icon', html: icon('code', { size: 18 }) }),
      el('h2', {
        class: 'contact-card__title',
        id: 'contact-tech-title',
        text: 'Solución tecnológica',
      }),
    ),
    el('p', {
      class: 'contact-card__text',
      text:
        'Este formulario viaja por la API REST de IntraNerd (Express + SQLite) y tiene ' +
        'respaldo en localStorage. Sin recargas, sin servicios externos y sin compartir tus datos.',
    }),
    serviceBox,
    el(
      'div',
      { class: 'contact-card__actions' },
      serviceTest,
      el('a', {
        class: 'contact-card__link',
        href: 'docs/openapi.yaml',
        target: '_blank',
        rel: 'noopener',
        html: `${icon('code', { size: 15 })}<span>Ver la solución tecnológica (OpenAPI)</span>`,
      }),
    ),
  );

  const accessibilityCard = el(
    'section',
    {
      class: 'contact-card contact-card--accessibility',
      attrs: { 'aria-labelledby': 'contact-accessibility-title' },
    },
    el(
      'div',
      { class: 'contact-card__heading' },
      el('span', { class: 'contact-card__icon', html: icon('shield', { size: 18 }) }),
      el('h2', {
        class: 'contact-card__title',
        id: 'contact-accessibility-title',
        text: 'Accesibilidad WCAG 2.2 AA',
      }),
    ),
    el('p', {
      class: 'contact-card__text',
      text:
        'Trabajamos con navegación por teclado, foco visible, contraste AA, textos alternativos ' +
        'y soporte para movimiento reducido. Si encuentras una barrera, queremos saberlo.',
    }),
    el('button', {
      class: 'btn btn--secondary btn--sm',
      type: 'button',
      html: `${icon('alert', { size: 15 })}<span>Reportar una barrera</span>`,
      on: {
        click: () => {
          topicSelect.value = 'accessibility';
          subjectInput.value = 'Barrera de accesibilidad en IntraNerd';
          messageInput.focus();
          form.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
            block: 'start',
          });
          statusRegion.textContent =
            'Motivo de accesibilidad seleccionado. Cuéntanos qué barrera encontraste.';
        },
      },
    }),
  );

  const faq = el(
    'section',
    { class: 'contact-card contact-card--faq', attrs: { 'aria-labelledby': 'contact-faq-title' } },
    el('h2', {
      class: 'contact-card__title',
      id: 'contact-faq-title',
      text: 'Preguntas frecuentes',
    }),
    el(
      'details',
      {},
      el('summary', { text: '¿Dónde queda mi mensaje?' }),
      el('p', {
        text:
          'Si la API está conectada, en la bandeja privada del colegio. Si no, en el ' +
          'almacenamiento local de este navegador, identificado como respaldo.',
      }),
    ),
    el(
      'details',
      {},
      el('summary', { text: '¿Necesito una cuenta?' }),
      el('p', {
        text:
          'No. IntraNerd no pide inicio de sesión para contactar al equipo. El perfil local ' +
          'solo sirve para autocompletar tu nombre.',
      }),
    ),
    el(
      'details',
      {},
      el('summary', { text: '¿Cuánto demora la respuesta?' }),
      el('p', { text: config.contact.responseTime }),
    ),
  );

  container.replaceChildren(
    pageHeader({
      eyebrow: 'Comunidad y soporte',
      title: 'Hablemos de IntraNerd',
      description:
        'Un canal único para soporte técnico, accesibilidad, consultas académicas y buenas ideas. ' +
        'Nerdi se encarga de que tu mensaje llegue al equipo correcto.',
    }),
    el(
      'div',
      { class: 'contact-layout' },
      el(
        'section',
        { class: 'contact-form-card', attrs: { 'aria-labelledby': 'contact-form-title' } },
        el(
          'header',
          { class: 'contact-form-card__header' },
          el('span', { class: 'contact-form-card__eyebrow', text: 'Formulario oficial' }),
          el('h2', {
            class: 'contact-form-card__title',
            id: 'contact-form-title',
            text: 'Cuéntanos qué necesitas',
          }),
          el('p', {
            class: 'contact-form-card__text',
            text: 'Completa los datos y te responderemos por correo.',
          }),
        ),
        form,
      ),
      el(
        'aside',
        { class: 'contact-aside', attrs: { 'aria-label': 'Información de contacto' } },
        mascot,
        supportCard,
        techCard,
        accessibilityCard,
        faq,
      ),
    ),
  );

  messageInput.addEventListener('input', () => {
    messageCounter.textContent = `${messageInput.value.length} / 4000 caracteres`;
  });

  const validators = [
    {
      input: nameInput,
      validate: (value) => value.trim().length >= 2,
      message: 'Escribe tu nombre completo.',
    },
    {
      input: emailInput,
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      message: 'Escribe un correo electrónico válido.',
    },
    {
      input: roleSelect,
      validate: (value) => Boolean(value),
      message: 'Selecciona tu rol en la comunidad.',
    },
    {
      input: topicSelect,
      validate: (value) => Boolean(value),
      message: 'Selecciona el motivo de contacto.',
    },
    {
      input: subjectInput,
      validate: (value) => value.trim().length >= 4,
      message: 'Escribe un asunto de al menos 4 caracteres.',
    },
    {
      input: messageInput,
      validate: (value) => value.trim().length >= 20,
      message: 'Cuéntanos un poco más: el mensaje debe tener al menos 20 caracteres.',
    },
    {
      input: consentInput,
      validate: () => consentInput.checked,
      message: 'Debes autorizar el uso de tus datos para enviar la consulta.',
    },
  ];

  function validateForm() {
    clearFieldErrors(form);
    let firstInvalid = null;
    validators.forEach(({ input, validate, message }) => {
      if (validate(input.value)) return;
      setFieldError(input, message);
      if (!firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusRegion.replaceChildren();

    const firstInvalid = validateForm();
    if (firstInvalid) {
      statusRegion.textContent = 'Revisa los campos marcados. Hay datos obligatorios pendientes.';
      firstInvalid.focus();
      return;
    }

    const submitButton = qs('button[type="submit"]', form);
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.innerHTML = `${icon('clock', { size: 18 })}<span>Enviando…</span>`;
    form.setAttribute('aria-busy', 'true');

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      role: ROLE_TO_API[roleSelect.value] || 'OTHER',
      topic: TOPIC_TO_API[topicSelect.value] || 'OTHER',
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim(),
      consent: true,
    };

    try {
      const created = await contactRepo.create(payload);
      const usedApi = connection.isApi;

      const success = el(
        'div',
        { class: 'contact-success', attrs: { tabindex: '-1' } },
        el(
          'span',
          { class: 'contact-success__icon', html: icon('checkCircle', { size: 24 }) },
          el('span', {
            class: 'sr-only',
            text: usedApi ? 'Mensaje recibido.' : 'Mensaje guardado localmente.',
          }),
        ),
        el(
          'div',
          {},
          el('h3', { class: 'contact-success__title', text: '¡Mensaje registrado!' }),
          el('p', {
            class: 'contact-success__text',
            text: usedApi
              ? `Tu consulta quedó en la bandeja del colegio con el folio ${created.id}. ${config.contact.responseTime}`
              : `La API no estaba disponible, así que guardamos tu consulta en este navegador ` +
                `con el folio ${created.id}. Puedes reintentar cuando recuperes la conexión.`,
          }),
        ),
      );

      statusRegion.replaceChildren(success);
      form.reset();
      roleSelect.value = defaultRole();
      topicSelect.value = 'support';
      messageCounter.textContent = '0 / 4000 caracteres';
      success.focus();
      toast.success('Mensaje registrado. Gracias por escribirnos.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo registrar el mensaje de contacto.', error);
      statusRegion.textContent =
        error.message || 'No pudimos registrar el mensaje. Inténtalo de nuevo.';
      toast.error(error.message || 'No pudimos registrar el mensaje de contacto.');
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.innerHTML = `${icon('mail', { size: 18 })}<span>Enviar mensaje</span>`;
      form.removeAttribute('aria-busy');
    }
  });

  return () => unsubscribeConnection();
}
