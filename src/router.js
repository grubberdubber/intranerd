import { NAV_ITEMS } from './data/constants.js';
import { el } from './utils/dom.js';
import { icon } from './components/icon.js';
import { emptyState } from './components/states.js';
import { pageHeader } from './components/pageHeader.js';
import { mount as mountDashboard } from './views/dashboard.js';
import { mount as mountGrades } from './views/grades.js';
import { mount as mountMissing } from './views/missing.js';
import { mount as mountTeachers } from './views/teachers.js';
import { mount as mountLostFound } from './views/lostfound.js';
import { mount as mountCalendar } from './views/calendar.js';
import { mount as mountWorkshops } from './views/workshops.js';
import { mount as mountAnnouncements } from './views/announcements.js';
import { mount as mountTasks } from './views/tasks.js';

/**
 * Router por hash. No requiere servidor especial ni recarga de página:
 * cada módulo se monta dentro del contenedor principal del layout.
 */
const VIEWS = {
  dashboard: mountDashboard,
  grades: mountGrades,
  missing: mountMissing,
  teachers: mountTeachers,
  lostfound: mountLostFound,
  calendar: mountCalendar,
  workshops: mountWorkshops,
  announcements: mountAnnouncements,
  tasks: mountTasks,
};

const DEFAULT_ROUTE = NAV_ITEMS[0];

function currentPath() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return DEFAULT_ROUTE.path;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function normalizePath(path) {
  const clean = path.split('?')[0].replace(/\/+$/, '');
  return clean || '/';
}

function routeForPath(path) {
  const normalized = normalizePath(path);
  return NAV_ITEMS.find((item) => normalizePath(item.path) === normalized) || null;
}

function renderNotFound(container, path) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Error 404',
      title: 'Página no encontrada',
    }),
    el(
      'section',
      { class: 'not-found' },
      el('span', { class: 'not-found__code', text: '404' }),
      el('h2', { class: 'not-found__title', text: 'No encontramos esta sección' }),
      el('p', {
        class: 'not-found__text',
        text:
          `La dirección "${path}" no corresponde a ningún módulo de IntraNerd. ` +
          'Revisa el enlace o vuelve al panel general.',
      }),
      el('a', {
        class: 'btn btn--primary',
        href: `#${DEFAULT_ROUTE.path}`,
        html: `${icon('dashboard', { size: 16 })}<span>Volver al panel</span>`,
      }),
    ),
  );
}

function renderError(container, route, error) {
  console.error(`[IntraNerd] Error al montar la vista "${route.id}".`, error);
  container.replaceChildren(
    pageHeader({ eyebrow: route.label, title: route.label }),
    emptyState({
      iconName: 'alert',
      title: 'No pudimos abrir este módulo',
      text: 'Ocurrió un problema inesperado. Puedes reintentar o volver al panel general.',
      action: el(
        'div',
        { class: 'btn-row' },
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Reintentar',
          on: { click: () => navigate(route.id, { force: true }) },
        }),
        el('a', {
          class: 'btn btn--ghost',
          href: `#${DEFAULT_ROUTE.path}`,
          text: 'Ir al panel',
        }),
      ),
    }),
  );
}

export function createRouter(layout) {
  let activeRouteId = null;
  let renderToken = 0;

  async function render(route, { force = false } = {}) {
    if (!force && activeRouteId === route.id) return;
    activeRouteId = route.id;
    const token = ++renderToken;

    layout.setActive(route.id);
    layout.setTitle(route.label);

    const container = el('div', { class: 'view', dataset: { route: route.id } });
    layout.mountView(container);

    const mountView = VIEWS[route.id];
    if (!mountView) {
      renderNotFound(container, route.path);
      return;
    }

    try {
      await mountView(container);
    } catch (error) {
      if (token !== renderToken) return;
      renderError(container, route, error);
    }
  }

  function resolve() {
    const path = currentPath();
    const route = routeForPath(path);

    if (!route) {
      activeRouteId = null;
      layout.setActive(null);
      layout.setTitle('Página no encontrada');
      const container = el('div', { class: 'view', dataset: { route: 'not-found' } });
      layout.mountView(container);
      renderNotFound(container, path);
      return;
    }

    render(route);
  }

  function navigate(routeId, { force = false } = {}) {
    const route = NAV_ITEMS.find((item) => item.id === routeId);
    if (!route) return;
    if (currentPath() !== route.path) {
      window.location.hash = `#${route.path}`;
      return;
    }
    render(route, { force });
  }

  return {
    start() {
      window.addEventListener('hashchange', resolve);
      if (!window.location.hash) {
        window.history.replaceState(null, '', `#${DEFAULT_ROUTE.path}`);
      }
      resolve();
    },
    resolve,
    navigate,
    get current() {
      return activeRouteId;
    },
  };
}
