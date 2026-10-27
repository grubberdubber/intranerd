import { ANNOUNCEMENT_CATEGORIES, AUTHOR_ROLES } from '../data/constants.js';
import { announcementsRepo } from '../services/resources.js';
import { getProfile } from '../services/session.js';
import { el, qs } from '../utils/dom.js';
import { formatDateTime, initials, relativeTime } from '../utils/format.js';
import { icon } from '../components/icon.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let posts = [];
let filters = { query: '', category: 'all' };

const CATEGORY_MAP = Object.fromEntries(
  ANNOUNCEMENT_CATEGORIES.map((category) => [category.id, category]),
);
const ROLE_MAP = Object.fromEntries(AUTHOR_ROLES.map((role) => [role.id, role.label]));

function categoryOf(post) {
  return CATEGORY_MAP[post.category] || CATEGORY_MAP.general;
}

function roleLabel(post) {
  return ROLE_MAP[post.role] || 'Comunidad';
}

function filteredPosts() {
  const query = filters.query.trim().toLowerCase();
  return posts
    .slice()
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt),
    )
    .filter((post) => {
      if (filters.category !== 'all' && post.category !== filters.category) return false;
      if (!query) return true;
      return [post.title, post.body, post.author].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      );
    });
}

function statCard({ iconName, label, value, hint, tone = '' }) {
  return el(
    'article',
    { class: 'stat-card' },
    el('span', {
      class: `stat-card__icon${tone ? ` stat-card__icon--${tone}` : ''}`,
      html: icon(iconName, { size: 20 }),
    }),
    el(
      'div',
      { class: 'stat-card__body' },
      el('span', { class: 'stat-card__label', text: label }),
      el('strong', { class: 'stat-card__value', text: value }),
      hint ? el('span', { class: 'stat-card__hint', text: hint }) : null,
    ),
  );
}

function announcementCard(post) {
  const category = categoryOf(post);
  const pinned = Boolean(post.pinned);

  return el(
    'article',
    { class: `announcement-card${pinned ? ' is-pinned' : ''}`, dataset: { id: post.id } },
    el(
      'div',
      { class: 'announcement-card__top' },
      el(
        'div',
        { class: 'announcement-card__author' },
        el('span', { class: 'avatar avatar--sm', text: initials(post.author) || 'IN' }),
        el(
          'div',
          { class: 'announcement-card__author-meta' },
          el('span', {
            class: 'announcement-card__author-name',
            text: post.author || 'Comunidad IntraNerd',
          }),
          el('span', { class: 'announcement-card__author-role', text: roleLabel(post) }),
        ),
      ),
      el(
        'div',
        { class: 'announcement-card__badges' },
        pinned
          ? el(
              'span',
              { class: 'badge badge--brand' },
              el('span', { html: icon('pin', { size: 11 }) }),
              'Fijado',
            )
          : null,
        el('span', { class: `badge badge--${category.tone}`, text: category.label }),
      ),
    ),
    el('h2', { class: 'announcement-card__title', text: post.title }),
    el('p', { class: 'announcement-card__body', text: post.body }),
    el(
      'div',
      { class: 'announcement-card__footer' },
      el('span', {
        class: 'announcement-card__date',
        text: `${formatDateTime(post.createdAt)} · ${relativeTime(post.createdAt)}`,
      }),
      el(
        'div',
        { class: 'btn-row' },
        el('button', {
          class: 'btn btn--ghost btn--sm',
          type: 'button',
          html: `${icon('pin', { size: 13 })}<span>${pinned ? 'Quitar fijado' : 'Fijar'}</span>`,
          on: { click: () => togglePinned(post) },
        }),
        el('button', {
          class: 'btn btn--danger-soft btn--sm',
          type: 'button',
          html: `${icon('trash', { size: 13 })}<span>Eliminar</span>`,
          on: { click: () => deletePost(post) },
        }),
      ),
    ),
  );
}

function renderSummary() {
  const summary = qs('#announcements-summary');
  if (!summary) return;
  const pinned = posts.filter((post) => post.pinned).length;
  const urgent = posts.filter(
    (post) => post.category === 'urgente' || post.category === 'suspension',
  ).length;
  const authors = new Set(posts.map((post) => post.author)).size;

  summary.replaceChildren(
    statCard({
      iconName: 'announcements',
      label: 'Comunicados publicados',
      value: String(posts.length),
      hint: 'Historial oficial del establecimiento',
      tone: '',
    }),
    statCard({
      iconName: 'pin',
      label: 'Avisos fijados',
      value: String(pinned),
      hint: 'Siempre visibles al inicio del tablón',
      tone: 'warning',
    }),
    statCard({
      iconName: 'alert',
      label: 'Avisos urgentes',
      value: String(urgent),
      hint: `${authors} ${authors === 1 ? 'autor distinto' : 'autores distintos'}`,
      tone: urgent ? 'danger' : 'success',
    }),
  );
}

function renderFeed() {
  const feed = qs('#announcements-feed');
  if (!feed) return;
  const visible = filteredPosts();

  if (!visible.length) {
    feed.replaceChildren(
      emptyState({
        iconName: 'announcements',
        title: posts.length ? 'No hay coincidencias' : 'El tablón está vacío',
        text: posts.length
          ? 'Prueba con otra categoría o término de búsqueda.'
          : 'Publica el primer comunicado para mantener informada a la comunidad.',
        action: posts.length
          ? el('button', {
              class: 'btn btn--ghost',
              type: 'button',
              text: 'Limpiar filtros',
              on: { click: resetFilters },
            })
          : el('button', {
              class: 'btn btn--primary',
              type: 'button',
              html: `${icon('plus', { size: 16 })}<span>Nuevo comunicado</span>`,
              on: { click: openComposerModal },
            }),
      }),
    );
    return;
  }

  feed.replaceChildren(...visible.map(announcementCard));
}

function renderAll() {
  renderSummary();
  renderFeed();
}

function resetFilters() {
  filters = { query: '', category: 'all' };
  const search = qs('#announcements-search');
  const category = qs('#announcements-category');
  if (search) search.value = '';
  if (category) category.value = 'all';
  renderFeed();
}

async function togglePinned(post) {
  try {
    const updated = await announcementsRepo.update(post.id, { pinned: !post.pinned });
    posts = posts.map((item) => (item.id === post.id ? { ...item, ...updated } : item));
    renderAll();
    toast.success(!post.pinned ? 'Comunicado fijado en el tablón.' : 'Comunicado desfijado.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo actualizar el comunicado.', error);
    toast.error(error.message || 'No se pudo actualizar el comunicado.');
  }
}

async function deletePost(post) {
  const confirmed = await confirmDialog({
    title: 'Eliminar comunicado',
    message: `Se eliminará "${post.title}" del tablón. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar comunicado',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await announcementsRepo.remove(post.id);
    posts = posts.filter((item) => item.id !== post.id);
    renderAll();
    toast.success('Comunicado eliminado.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar el comunicado.', error);
    toast.error(error.message || 'No se pudo eliminar el comunicado.');
  }
}

function openComposerModal() {
  const profile = getProfile();
  const titleInput = el('input', {
    class: 'input',
    id: 'announcement-title',
    placeholder: 'Ej: Suspensión de clases presenciales',
    maxlength: '120',
    required: true,
  });
  const authorInput = el('input', {
    class: 'input',
    id: 'announcement-author',
    placeholder: 'Ej: Dirección Académica',
    value: profile.name === 'Visitante' ? '' : profile.name,
    required: true,
  });
  const roleSelect = el(
    'select',
    { class: 'select', id: 'announcement-role' },
    ...AUTHOR_ROLES.map((role) =>
      el('option', {
        value: role.id,
        text: role.label,
        selected:
          role.id ===
          (profile.role === 'profesor'
            ? 'profesor'
            : profile.role === 'direccion'
              ? 'direccion'
              : 'alumno'),
      }),
    ),
  );
  const categorySelect = el(
    'select',
    { class: 'select', id: 'announcement-category' },
    ...ANNOUNCEMENT_CATEGORIES.map((category) =>
      el('option', { value: category.id, text: category.label }),
    ),
  );
  const bodyInput = el('textarea', {
    class: 'textarea',
    id: 'announcement-body',
    rows: '6',
    placeholder:
      'Escribe el comunicado con claridad: qué ocurre, a quién afecta y qué debe hacer la comunidad.',
    required: true,
  });
  const pinnedInput = el('input', { type: 'checkbox', id: 'announcement-pinned' });

  const form = el(
    'form',
    { class: 'form announcement-composer', id: 'announcement-form' },
    el(
      'div',
      { class: 'announcement-composer__row' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Título',
          attrs: { for: 'announcement-title' },
        }),
        titleInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Categoría',
          attrs: { for: 'announcement-category' },
        }),
        categorySelect,
      ),
    ),
    el(
      'div',
      { class: 'announcement-composer__row' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Publicado por',
          attrs: { for: 'announcement-author' },
        }),
        authorInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Rol', attrs: { for: 'announcement-role' } }),
        roleSelect,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Contenido del comunicado',
        attrs: { for: 'announcement-body' },
      }),
      bodyInput,
    ),
    el(
      'label',
      { class: 'checkbox' },
      pinnedInput,
      el('span', { text: 'Fijar en la parte superior del tablón' }),
    ),
    el(
      'div',
      { class: 'lostfound-note' },
      el('span', { html: icon('info', { size: 15 }) }),
      el('span', {
        text:
          'Los comunicados son visibles para toda la comunidad escolar. ' +
          'Revisa la ortografía y los datos antes de publicar.',
      }),
    ),
  );

  const modal = openModal({
    title: 'Nuevo comunicado',
    eyebrow: 'Tablón oficial',
    description: 'Publica un aviso para alumnos, profesores y apoderados.',
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
        text: 'Publicar comunicado',
        attrs: { form: 'announcement-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title || !author || !body) {
      toast.warning('Completa el título, el autor y el contenido del comunicado.');
      if (!title) titleInput.setAttribute('aria-invalid', 'true');
      if (!author) authorInput.setAttribute('aria-invalid', 'true');
      if (!body) bodyInput.setAttribute('aria-invalid', 'true');
      return;
    }

    const submitButton = qs('button[type="submit"]', modal.element);
    submitButton.disabled = true;
    submitButton.textContent = 'Publicando…';

    try {
      const created = await announcementsRepo.create({
        title,
        body,
        author,
        role: roleSelect.value,
        category: categorySelect.value,
        pinned: pinnedInput.checked,
      });
      posts = [created, ...posts];
      modal.close();
      renderAll();
      toast.success('Comunicado publicado en el tablón.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo publicar el comunicado.', error);
      toast.error(error.message || 'No se pudo publicar el comunicado.');
      submitButton.disabled = false;
      submitButton.textContent = 'Publicar comunicado';
    }
  });

  requestAnimationFrame(() => titleInput.focus());
}

function bindToolbar() {
  const search = qs('#announcements-search');
  const category = qs('#announcements-category');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderFeed();
  });
  category?.addEventListener('change', () => {
    filters.category = category.value;
    renderFeed();
  });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Comunidad',
      title: 'Tablón de comunicados oficiales',
      description:
        'Avisos de dirección, profesores y centro de alumnos: suspensiones, eventos, ' +
        'noticias y acuerdos de la comunidad.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Nuevo comunicado</span>`,
          on: { click: openComposerModal },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'announcements-summary', class: 'grid-3' }, skeletonRows(1)),
      el(
        'div',
        { class: 'toolbar' },
        el('input', {
          class: 'input input--search toolbar__search',
          id: 'announcements-search',
          type: 'search',
          placeholder: 'Buscar comunicados por título, contenido o autor…',
          attrs: { 'aria-label': 'Buscar comunicados' },
        }),
        el(
          'select',
          {
            class: 'select',
            id: 'announcements-category',
            attrs: { 'aria-label': 'Filtrar por categoría' },
          },
          el('option', { value: 'all', text: 'Todas las categorías' }),
          ...ANNOUNCEMENT_CATEGORIES.map((category) =>
            el('option', { value: category.id, text: category.label }),
          ),
        ),
      ),
      el('div', { id: 'announcements-feed', class: 'announcement-feed' }, skeletonRows(4)),
    ),
  );

  bindToolbar();

  try {
    posts = await announcementsRepo.list();
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar comunicados.', error);
    toast.error('No fue posible cargar los comunicados.');
    qs('#announcements-feed')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar el tablón',
        text: 'Vuelve a intentarlo en unos segundos.',
        action: el('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Reintentar',
          on: { click: () => mount(container) },
        }),
      }),
    );
  }
}
