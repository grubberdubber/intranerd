import { APP_NAME, config } from '../config.js';
import { NAV_ITEMS } from '../data/constants.js';
import { el, qs, qsa } from '../utils/dom.js';
import { formatLongDate } from '../utils/format.js';
import { connection } from '../services/api.js';
import {
  getProfile,
  profileInitials,
  saveProfile,
  subscribeProfile,
  ROLE_LABELS,
} from '../services/session.js';
import { icon } from './icon.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';

/**
 * Shell principal: sidebar, topbar, contenido y estado de conexión.
 * Es el único componente que conoce la lista de módulos y el perfil activo.
 */
export function createLayout(root) {
  const profile = getProfile();
  const today = formatLongDate(new Date());

  const nav = el('nav', { class: 'sidebar__nav', attrs: { 'aria-label': 'Módulos de IntraNerd' } });
  NAV_ITEMS.forEach((item) => {
    const iconMarkup = icon(item.icon, { size: 18, className: 'nav-link__icon' });
    nav.appendChild(
      el('a', {
        class: 'nav-link',
        href: `#${item.path}`,
        dataset: { route: item.id },
        attrs: { 'aria-label': item.label },
        html: `${iconMarkup}<span class="nav-link__label">${item.label}</span>`,
      }),
    );
  });

  const storageChip = el('button', {
    class: 'storage-chip',
    type: 'button',
    attrs: {
      'aria-label': 'Estado del almacenamiento. Haz clic para reintentar la conexión con la API.',
      title: 'Haz clic para reintentar la conexión con la API',
    },
    on: {
      click: () => {
        connection.retry();
        toast.info('Reintentando conexión con la API…');
      },
    },
  });

  const sidebar = el(
    'aside',
    { class: 'sidebar', id: 'sidebar' },
    el(
      'a',
      { class: 'sidebar__brand', href: '#/panel' },
      el('span', { class: 'sidebar__mark', text: 'IN' }),
      el(
        'span',
        { class: 'sidebar__brand-text' },
        el('span', { class: 'sidebar__name', text: APP_NAME }),
        el('span', { class: 'sidebar__tagline', text: 'Gestión escolar' }),
      ),
    ),
    el('span', { class: 'sidebar__section-label', text: 'Módulos' }),
    nav,
    el(
      'div',
      { class: 'sidebar__footer' },
      storageChip,
      el('span', {
        class: 'sidebar__legal',
        text: `© ${new Date().getFullYear()} ${APP_NAME} · v${config.app.version}`,
      }),
    ),
  );

  const overlay = el('button', {
    class: 'sidebar-overlay',
    type: 'button',
    attrs: { 'aria-label': 'Cerrar menú de navegación', tabindex: '-1' },
    on: { click: () => closeNav() },
  });

  const menuButton = el('button', {
    class: 'icon-btn topbar__menu',
    type: 'button',
    attrs: {
      'aria-label': 'Abrir menú de navegación',
      'aria-controls': 'sidebar',
      'aria-expanded': 'false',
    },
    html: icon('menu', { size: 19 }),
    on: { click: () => toggleNav() },
  });

  const topbarTitle = el('h2', { class: 'topbar__title', text: 'Panel general' });
  const userChip = el('button', {
    class: 'user-chip',
    type: 'button',
    attrs: { 'aria-label': 'Editar perfil' },
  });

  const topbar = el(
    'header',
    { class: 'topbar' },
    menuButton,
    el(
      'div',
      { class: 'topbar__heading' },
      el('span', { class: 'topbar__eyebrow', text: config.app.school }),
      topbarTitle,
    ),
    el(
      'div',
      { class: 'topbar__actions' },
      el(
        'span',
        { class: 'topbar__date' },
        el('span', { html: icon('calendar', { size: 14 }) }),
        el('span', { text: today }),
      ),
      userChip,
    ),
  );

  const main = el('main', {
    class: 'page',
    id: 'main-content',
    attrs: { tabindex: '-1' },
  });

  const layout = el(
    'div',
    { class: 'app-layout' },
    overlay,
    sidebar,
    el('div', { class: 'app-main' }, topbar, main),
  );

  root.replaceChildren(layout);
  root.dataset.ready = 'true';

  function closeNav() {
    root.classList.remove('is-nav-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    const open = !root.classList.contains('is-nav-open');
    root.classList.toggle('is-nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) {
      requestAnimationFrame(() => qs('.nav-link', sidebar)?.focus());
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-nav-open')) closeNav();
  });

  function renderConnection({ mode, enabled }) {
    const isApi = mode === 'api';
    const label = isApi ? 'API conectada' : enabled ? 'Almacenamiento local' : 'Modo local';
    const detail = isApi ? 'Sincronización REST activa' : 'Datos guardados en este navegador';
    storageChip.dataset.mode = isApi ? 'api' : 'local';
    storageChip.replaceChildren(
      el('span', { class: 'storage-chip__dot', attrs: { 'aria-hidden': 'true' } }),
      el(
        'span',
        { class: 'storage-chip__text' },
        el('strong', { text: label }),
        el('span', { text: detail }),
      ),
    );
  }

  function renderProfile(current = getProfile()) {
    userChip.replaceChildren(
      el('span', { class: 'user-chip__avatar', text: profileInitials(current) }),
      el(
        'span',
        { class: 'user-chip__meta' },
        el('span', { class: 'user-chip__name', text: current.name || 'Visitante' }),
        el('span', { class: 'user-chip__role', text: current.roleLabel }),
      ),
    );
    userChip.title = `${current.name} · ${current.roleLabel}`;
  }

  function openProfileModal() {
    const current = getProfile();
    const nameInput = el('input', {
      class: 'input',
      id: 'profile-name',
      value: current.name === 'Visitante' ? '' : current.name,
      placeholder: 'Ej: Camila Rojas',
      required: true,
      autocomplete: 'name',
    });

    const roleSelect = el(
      'select',
      { class: 'select', id: 'profile-role' },
      ...Object.entries(ROLE_LABELS).map(([value, label]) =>
        el('option', {
          value,
          text: label,
          selected: current.role === value,
        }),
      ),
    );

    const form = el(
      'form',
      { class: 'form', id: 'profile-form' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Nombre visible',
          attrs: { for: 'profile-name' },
        }),
        nameInput,
        el('span', {
          class: 'field__hint',
          text: 'Se usará para firmar opiniones, pruebas y comunicados.',
        }),
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Rol en la comunidad',
          attrs: { for: 'profile-role' },
        }),
        roleSelect,
      ),
      el(
        'div',
        { class: 'lostfound-note' },
        el('span', { html: icon('shield', { size: 15 }) }),
        el('span', {
          text: 'Tu perfil se guarda solo en este navegador. No es un inicio de sesión.',
        }),
      ),
    );

    const modal = openModal({
      title: 'Mi perfil',
      eyebrow: 'Identidad local',
      description: 'Personaliza cómo apareces en IntraNerd.',
      body: form,
      size: 'sm',
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
          text: 'Guardar perfil',
          attrs: { form: 'profile-form' },
        }),
      ],
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        return;
      }
      saveProfile({ name, role: roleSelect.value });
      toast.success('Perfil actualizado.');
      modal.close();
    });
  }

  userChip.addEventListener('click', openProfileModal);
  subscribeProfile((current) => renderProfile(current));
  connection.subscribe((state) => renderConnection(state));

  return {
    main,
    sidebar,
    nav,
    setActive(routeId) {
      qsa('.nav-link', nav).forEach((link) => {
        const active = link.dataset.route === routeId;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      closeNav();
    },
    setTitle(title) {
      topbarTitle.textContent = title;
      document.title = `${title} · ${APP_NAME}`;
    },
    mountView(node) {
      main.replaceChildren(node);
      main.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'auto' });
      main.focus({ preventScroll: true });
    },
    openProfileModal,
  };
}
