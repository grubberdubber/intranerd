import { CHAT_ROLES } from '../data/constants.js';
import {
  createChatContact,
  listChatContacts,
  listChatThreads,
  markChatThreadRead,
  sendChatMessage,
} from '../services/chat.js';
import {
  chatLastMessage,
  chatMessagePreview,
  chatRole,
  chatThreadFor,
  chatUnreadCount,
  filterChatContacts,
  isValidChatMessage,
  sortChatContacts,
} from '../utils/chat.js';
import { bindFieldErrorClearing, clearFieldErrors, el, qs, setFieldError } from '../utils/dom.js';
import { formatDate, initials, isSameDay, relativeTime, truncate } from '../utils/format.js';
import { icon } from '../components/icon.js';
import { openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

/**
 * Módulo 10 · Mensajes internos.
 *
 * Directorio de contactos y conversaciones 1:1 para profesores, alumnos,
 * inspectoría y dirección. La persistencia es local: no hay respuestas
 * automáticas ni envío a otras personas. Es la base para conectar más adelante
 * un backend con sesiones y mensajería en tiempo real.
 */

const MOBILE_QUERY = '(max-width: 900px)';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function shortTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (isSameDay(date, new Date())) return clock(date);
  return formatDate(date, { year: undefined });
}

function dayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (isSameDay(date, new Date())) return 'Hoy';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Ayer';
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function roleBadge(contact) {
  const role = chatRole(contact.role);
  return el(
    'span',
    { class: `badge${role.tone ? ` badge--${role.tone}` : ''}` },
    el('span', { html: icon(role.icon, { size: 12 }) }),
    el('span', { text: role.label }),
  );
}

function contactAvatar(contact, extraClass = '') {
  return el('span', {
    class: `avatar chat-avatar chat-avatar--${contact.role}${extraClass ? ` ${extraClass}` : ''}`,
    attrs: { 'aria-hidden': 'true' },
    text: initials(contact.name),
  });
}

function contactModal(onCreated = () => {}) {
  const nameInput = el('input', {
    class: 'input',
    id: 'chat-contact-name',
    name: 'name',
    type: 'text',
    placeholder: 'Ej: Prof. Camila Soto',
    required: true,
    maxlength: '80',
    autocomplete: 'name',
  });

  const roleSelect = el(
    'select',
    { class: 'select', id: 'chat-contact-role', name: 'role' },
    ...CHAT_ROLES.map((role) =>
      el('option', {
        value: role.id,
        text: role.label,
        selected: role.id === 'profesor',
      }),
    ),
  );

  const detailInput = el('input', {
    class: 'input',
    id: 'chat-contact-detail',
    name: 'detail',
    type: 'text',
    placeholder: 'Ej: Matemáticas · 3° Medio B',
    maxlength: '100',
  });

  const emailInput = el('input', {
    class: 'input',
    id: 'chat-contact-email',
    name: 'email',
    type: 'email',
    placeholder: 'contacto@colegio.cl',
    maxlength: '120',
    autocomplete: 'email',
  });

  const noteInput = el('textarea', {
    class: 'textarea',
    id: 'chat-contact-note',
    name: 'note',
    rows: '3',
    placeholder: 'Horario de atención, temas que puede ayudar o cualquier dato útil.',
    maxlength: '240',
  });

  const form = el(
    'form',
    { class: 'form', id: 'chat-contact-form', novalidate: true },
    el(
      'p',
      { class: 'chat-form__help' },
      'Agrega a una persona de la comunidad para iniciar una conversación. ',
      'Los campos con ',
      el('span', { class: 'required-mark', text: '*' }),
      ' son obligatorios.',
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'chat-contact-name' } },
          'Nombre ',
          el('span', { class: 'required-mark', text: '*' }),
        ),
        nameInput,
      ),
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'chat-contact-role' } },
          'Rol ',
          el('span', { class: 'required-mark', text: '*' }),
        ),
        roleSelect,
      ),
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'chat-contact-detail' } },
          'Curso o área',
        ),
        detailInput,
        el('span', {
          class: 'field__hint',
          text: 'Por ejemplo: 2° Medio A, Inspectoría o Lenguaje.',
        }),
      ),
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'chat-contact-email' } },
          'Correo ',
          el('span', { class: 'field__optional', text: '(opcional)' }),
        ),
        emailInput,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el(
        'label',
        { class: 'field__label', attrs: { for: 'chat-contact-note' } },
        'Nota de contacto ',
        el('span', { class: 'field__optional', text: '(opcional)' }),
      ),
      noteInput,
    ),
    el(
      'p',
      { class: 'chat-form__privacy' },
      el('span', { html: icon('shield', { size: 15 }), attrs: { 'aria-hidden': 'true' } }),
      el('span', {
        text: 'El contacto y la conversación se guardan solo en este navegador.',
      }),
    ),
  );

  const modal = openModal({
    title: 'Nuevo contacto',
    eyebrow: 'Mensajes internos',
    description: 'Agrega a un profesor, alumno, inspector o miembro de dirección.',
    body: form,
    size: 'lg',
    footer: [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Cancelar',
        on: { click: () => modal.close() },
      }),
      el('button', {
        class: 'btn btn--primary',
        type: 'submit',
        text: 'Agregar contacto',
        attrs: { form: 'chat-contact-form' },
      }),
    ],
  });

  bindFieldErrorClearing(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const errors = [
      [name.length < 2, nameInput, 'Escribe un nombre de al menos 2 caracteres.'],
      [
        Boolean(email) && !EMAIL_PATTERN.test(email),
        emailInput,
        'Escribe un correo válido o déjalo vacío.',
      ],
    ];
    const firstInvalid = errors.find(([invalid]) => invalid);
    if (firstInvalid) {
      errors.forEach(([invalid, input, message]) => {
        if (invalid) setFieldError(input, message);
      });
      firstInvalid[1].focus();
      return;
    }

    try {
      const created = createChatContact({
        name,
        role: roleSelect.value,
        detail: detailInput.value,
        email,
        note: noteInput.value,
      });
      modal.close();
      onCreated(created.id);
      toast.success(`Contacto agregado: ${created.name}.`);
    } catch (error) {
      console.error('[IntraNerd] No se pudo agregar el contacto.', error);
      toast.error(error.message || 'No se pudo agregar el contacto.');
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

export async function mount(container) {
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const state = {
    contacts: [],
    threads: [],
    selectedId: null,
    filters: { query: '', role: 'all' },
  };

  let layout = null;
  let contactListHost = null;
  let conversationHost = null;
  let contactCount = null;
  let searchInput = null;
  let roleFilter = null;

  function selectedContact() {
    return state.contacts.find((contact) => contact.id === state.selectedId) || null;
  }

  function refreshThreads() {
    state.threads = listChatThreads();
  }

  function openContact(contactId, { focus = true } = {}) {
    state.contacts = listChatContacts();
    state.threads = listChatThreads();
    state.selectedId = contactId;
    markChatThreadRead(contactId);
    refreshThreads();
    if (mobileQuery.matches) document.body.classList.add('chat-conversation-open');
    renderAll();
    if (layout) layout.classList.add('is-conversation-open');
    if (focus) {
      requestAnimationFrame(() => {
        qs('#chat-input')?.focus({ preventScroll: true });
        if (mobileQuery.matches) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    }
  }

  function handleAddContact() {
    contactModal(openContact);
  }

  function closeConversation() {
    state.selectedId = null;
    document.body.classList.remove('chat-conversation-open');
    renderAll();
    layout?.classList.remove('is-conversation-open');
    requestAnimationFrame(
      () => qs('.chat-contact.is-active')?.focus() || qs('.chat-contact')?.focus(),
    );
  }

  function resetFilters() {
    state.filters = { query: '', role: 'all' };
    if (searchInput) searchInput.value = '';
    if (roleFilter) roleFilter.value = 'all';
    renderContactList();
    searchInput?.focus();
  }

  function renderContactList() {
    if (!contactListHost) return;
    const visible = sortChatContacts(
      filterChatContacts(state.contacts, state.filters),
      state.threads,
    );

    if (contactCount) {
      contactCount.textContent = String(state.contacts.length);
    }

    if (!visible.length) {
      contactListHost.replaceChildren(
        emptyState({
          iconName: 'users',
          title: state.contacts.length ? 'No encontramos contactos' : 'Aún no hay contactos',
          text: state.contacts.length
            ? 'Prueba con otro nombre o cambia el filtro de rol.'
            : 'Agrega a la primera persona para comenzar una conversación.',
          compact: true,
          action: state.contacts.length
            ? el('button', {
                class: 'btn btn--ghost btn--sm',
                type: 'button',
                text: 'Limpiar filtros',
                on: { click: resetFilters },
              })
            : el('button', {
                class: 'btn btn--primary btn--sm',
                type: 'button',
                html: `${icon('userPlus', { size: 15 })}<span>Nuevo contacto</span>`,
                on: { click: handleAddContact },
              }),
        }),
      );
      return;
    }

    contactListHost.replaceChildren(
      ...visible.map((contact) => {
        const thread = chatThreadFor(state.threads, contact.id);
        const last = chatLastMessage(thread);
        const unread = chatUnreadCount(thread);
        const active = contact.id === state.selectedId;
        const preview = truncate(chatMessagePreview(thread), 64);
        const time = last ? shortTime(last.createdAt) : '';

        return el(
          'button',
          {
            class: `chat-contact${active ? ' is-active' : ''}${unread ? ' has-unread' : ''}`,
            type: 'button',
            dataset: { contactId: contact.id },
            attrs: {
              'aria-pressed': String(active),
              'aria-label': [
                contact.name,
                chatRole(contact.role).label,
                unread ? `${unread} mensajes sin leer` : '',
                preview,
              ]
                .filter(Boolean)
                .join('. '),
            },
            on: { click: () => openContact(contact.id) },
          },
          contactAvatar(contact),
          el(
            'span',
            { class: 'chat-contact__body' },
            el(
              'span',
              { class: 'chat-contact__top' },
              el('strong', { class: 'chat-contact__name', text: contact.name }),
              time ? el('span', { class: 'chat-contact__time', text: time }) : null,
            ),
            el('span', { class: 'chat-contact__preview', text: preview }),
          ),
          unread
            ? el('span', {
                class: 'badge badge--solid chat-contact__unread',
                text: String(unread),
                attrs: { 'aria-label': `${unread} sin leer` },
              })
            : null,
        );
      }),
    );
  }

  function messageNode(message, contact) {
    const mine = message.author === 'me';
    return el(
      'article',
      {
        class: `chat-message${mine ? ' chat-message--me' : ' chat-message--contact'}`,
        dataset: { author: message.author },
      },
      el(
        'div',
        { class: 'chat-message__bubble' },
        el('p', { class: 'chat-message__text', text: message.body }),
      ),
      el('span', {
        class: 'chat-message__meta',
        text: `${mine ? 'Tú' : contact.name} · ${clock(message.createdAt)}`,
      }),
    );
  }

  function renderConversation() {
    if (!conversationHost) return;
    const contact = selectedContact();
    layout?.classList.toggle('is-conversation-open', Boolean(contact));
    layout?.closest('.view')?.classList.toggle('is-chat-conversation', Boolean(contact));

    if (!contact) {
      conversationHost.replaceChildren(
        emptyState({
          iconName: 'chat',
          title: 'Elige una conversación',
          text: 'Selecciona un contacto del directorio para leer el historial y escribir un mensaje.',
          action: el('button', {
            class: 'btn btn--ghost btn--sm',
            type: 'button',
            html: `${icon('userPlus', { size: 15 })}<span>Nuevo contacto</span>`,
            on: { click: handleAddContact },
          }),
        }),
      );
      return;
    }

    const thread = chatThreadFor(state.threads, contact.id);
    const messages = thread?.messages || [];

    const backButton = el('button', {
      class: 'icon-btn chat-back',
      type: 'button',
      attrs: { 'aria-label': 'Volver a la lista de contactos' },
      html: icon('chevronLeft', { size: 18 }),
      on: { click: closeConversation },
    });

    const header = el(
      'header',
      { class: 'chat-panel__header' },
      backButton,
      contactAvatar(contact, 'avatar--lg'),
      el(
        'div',
        { class: 'chat-panel__identity' },
        el(
          'div',
          { class: 'chat-panel__title-row' },
          el('h2', { class: 'chat-panel__name', text: contact.name }),
          roleBadge(contact),
        ),
        el('p', {
          class: 'chat-panel__detail',
          text: contact.detail || chatRole(contact.role).label,
        }),
      ),
      contact.email
        ? el(
            'a',
            {
              class: 'chat-panel__mail',
              href: `mailto:${contact.email}`,
              title: `Escribir a ${contact.email}`,
            },
            el('span', { html: icon('mail', { size: 15 }), attrs: { 'aria-hidden': 'true' } }),
            el('span', { text: truncate(contact.email, 24) }),
          )
        : null,
    );

    const privacy = el(
      'p',
      { class: 'chat-panel__notice' },
      el('span', { html: icon('shield', { size: 14 }), attrs: { 'aria-hidden': 'true' } }),
      el('span', {
        text: 'Los mensajes se guardan en este navegador; no se envían a otras personas.',
      }),
    );

    const log = el('div', {
      class: 'chat-messages',
      id: 'chat-messages',
      attrs: {
        role: 'log',
        'aria-live': 'polite',
        'aria-relevant': 'additions',
        'aria-label': `Conversación con ${contact.name}`,
        tabindex: '0',
      },
    });

    if (!messages.length) {
      log.appendChild(
        el(
          'div',
          { class: 'chat-empty' },
          el('span', { class: 'chat-empty__icon', html: icon('chat', { size: 22 }) }),
          el('p', { class: 'chat-empty__title', text: 'Todavía no hay mensajes' }),
          el('p', {
            class: 'chat-empty__text',
            text: `Escribe el primer mensaje para ${contact.name}.`,
          }),
        ),
      );
    } else {
      let currentDay = '';
      messages.forEach((message) => {
        const day = dayLabel(message.createdAt);
        if (day !== currentDay) {
          currentDay = day;
          log.appendChild(
            el('div', { class: 'chat-day' }, el('span', { class: 'chat-day__label', text: day })),
          );
        }
        log.appendChild(messageNode(message, contact));
      });
    }

    const input = el('textarea', {
      class: 'textarea chat-composer__input',
      id: 'chat-input',
      rows: '1',
      maxlength: '2000',
      placeholder: `Escribe a ${contact.name}…`,
      attrs: {
        'aria-label': `Mensaje para ${contact.name}`,
        'aria-describedby': 'chat-compose-help',
      },
    });

    const form = el(
      'form',
      { class: 'chat-composer', id: 'chat-form' },
      el(
        'div',
        { class: 'chat-composer__row' },
        input,
        el('button', {
          class: 'btn btn--primary chat-send',
          type: 'submit',
          html: `${icon('send', { size: 17 })}<span>Enviar</span>`,
        }),
      ),
      el(
        'p',
        { class: 'chat-composer__hint', id: 'chat-compose-help' },
        'Enter envía · Shift + Enter agrega un salto de línea. ',
        'Los mensajes no salen de este navegador.',
      ),
    );

    function autoGrow() {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
    }

    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      form.requestSubmit();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const body = input.value;
      if (!isValidChatMessage(body)) {
        if (!String(body).trim()) input.focus();
        else toast.warning('El mensaje no puede superar los 2000 caracteres.');
        return;
      }

      try {
        sendChatMessage(contact.id, body);
        refreshThreads();
        input.value = '';
        autoGrow();
        renderContactList();
        renderConversation();
        requestAnimationFrame(() => {
          qs('#chat-input')?.focus();
          const messagesBox = qs('#chat-messages');
          if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
        });
      } catch (error) {
        console.error('[IntraNerd] No se pudo enviar el mensaje.', error);
        toast.error(error.message || 'No se pudo enviar el mensaje.');
      }
    });

    conversationHost.replaceChildren(header, privacy, log, form);
    requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
  }

  function renderAll() {
    renderContactList();
    renderConversation();
  }

  searchInput = el('input', {
    class: 'input input--search',
    id: 'chat-search',
    type: 'search',
    placeholder: 'Buscar por nombre, curso o correo…',
    attrs: { 'aria-label': 'Buscar contactos' },
  });

  roleFilter = el(
    'select',
    { class: 'select', id: 'chat-role-filter', attrs: { 'aria-label': 'Filtrar por rol' } },
    el('option', { value: 'all', text: 'Todos los roles' }),
    ...CHAT_ROLES.map((role) => el('option', { value: role.id, text: role.label })),
  );

  contactCount = el('span', {
    class: 'badge',
    text: '0',
    attrs: { 'aria-label': 'Contactos en el directorio' },
  });

  contactListHost = el(
    'div',
    { class: 'chat-contact-list', id: 'chat-contact-list' },
    skeletonRows(3),
  );
  conversationHost = el('div', { class: 'chat-panel', id: 'chat-panel' }, skeletonRows(2));

  layout = el(
    'div',
    { class: 'chat-layout', id: 'chat-layout' },
    el(
      'section',
      { class: 'chat-sidebar', attrs: { 'aria-labelledby': 'chat-contacts-title' } },
      el(
        'header',
        { class: 'chat-sidebar__header' },
        el(
          'div',
          { class: 'chat-sidebar__title-row' },
          el('h2', { class: 'chat-sidebar__title', id: 'chat-contacts-title', text: 'Contactos' }),
          contactCount,
        ),
        el('p', {
          class: 'chat-sidebar__text',
          text: 'Profesores, alumnos, inspectoría y dirección en un solo lugar.',
        }),
      ),
      el('div', { class: 'chat-sidebar__filters' }, searchInput, roleFilter),
      contactListHost,
      el(
        'div',
        { class: 'chat-sidebar__footer' },
        el('button', {
          class: 'btn btn--ghost btn--sm chat-sidebar__add',
          type: 'button',
          html: `${icon('userPlus', { size: 15 })}<span>Agregar contacto</span>`,
          on: { click: handleAddContact },
        }),
      ),
    ),
    conversationHost,
  );

  container.replaceChildren(
    pageHeader({
      eyebrow: 'Comunidad y convivencia',
      title: 'Mensajes internos',
      description:
        'Conversa con profesores, alumnos, inspectoría y dirección. ' +
        'Puedes agregar contactos y retomar cada conversación cuando quieras.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('userPlus', { size: 16 })}<span>Nuevo contacto</span>`,
          on: { click: handleAddContact },
        }),
      ],
    }),
    layout,
  );

  searchInput.addEventListener('input', () => {
    state.filters.query = searchInput.value;
    renderContactList();
  });

  roleFilter.addEventListener('change', () => {
    state.filters.role = roleFilter.value;
    renderContactList();
  });

  function handleViewportChange(event) {
    if (!event.matches && !state.selectedId && state.contacts.length) {
      openContact(sortChatContacts(state.contacts, state.threads)[0].id, { focus: false });
    }
  }
  mobileQuery.addEventListener('change', handleViewportChange);

  try {
    state.contacts = listChatContacts();
    state.threads = listChatThreads();

    if (!mobileQuery.matches && state.contacts.length) {
      const first = sortChatContacts(state.contacts, state.threads)[0];
      state.selectedId = first.id;
      markChatThreadRead(first.id);
      refreshThreads();
    }

    renderAll();
  } catch (error) {
    console.error('[IntraNerd] No se pudieron cargar los mensajes.', error);
    contactListHost.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar los mensajes',
        text: 'Vuelve a intentarlo en unos segundos.',
        compact: true,
        action: el('button', {
          class: 'btn btn--primary btn--sm',
          type: 'button',
          text: 'Reintentar',
          on: { click: () => mount(container) },
        }),
      }),
    );
    conversationHost.replaceChildren(
      emptyState({
        iconName: 'chat',
        title: 'Mensajería no disponible',
        text: 'El almacenamiento del navegador no respondió.',
      }),
    );
    toast.error('No fue posible cargar los mensajes.');
  }

  return () => {
    mobileQuery.removeEventListener('change', handleViewportChange);
    document.body.classList.remove('chat-conversation-open');
  };
}
