import { LOSTFOUND_CATEGORIES } from '../data/constants.js';
import { foundRepo, lostRepo } from '../services/resources.js';
import { bindFieldErrorClearing, el, qs, setFieldError } from '../utils/dom.js';
import { prepareUpload } from '../utils/files.js';
import { formatDate, relativeTime } from '../utils/format.js';
import { filterLostFoundItems } from '../utils/reports.js';
import { findLostFoundMatches } from '../utils/lostFoundMatches.js';
import { icon } from '../components/icon.js';
import { createFilePicker } from '../components/filePicker.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let foundItems = [];
let lostItems = [];
let filters = { query: '', category: 'all' };

const CATEGORY_MAP = Object.fromEntries(
  LOSTFOUND_CATEGORIES.map((category) => [category.id, category]),
);
const EXAMPLE_IMAGES = LOSTFOUND_CATEGORIES.map((category) => category.image);

function categoryOf(item) {
  return CATEGORY_MAP[item.category] || CATEGORY_MAP.otro;
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

/** Localiza una tarjeta visible para devolver el foco después de re-renderizar. */
function cardById(type, id) {
  const list = qs(type === 'found' ? '#found-list' : '#lost-list');
  if (!list) return null;
  return Array.from(list.querySelectorAll('.item-card')).find((card) => card.dataset.id === id);
}

function focusCardAction(type, id, action = 'toggle') {
  const target = cardById(type, id)?.querySelector(`[data-action="${action}"]`);
  target?.focus();
  return Boolean(target);
}

function focusFirstCardAction(type) {
  const list = qs(type === 'found' ? '#found-list' : '#lost-list');
  const target = list?.querySelector('.item-card [data-action="toggle"]');
  if (target) {
    target.focus();
    return;
  }
  qs('#lostfound-search')?.focus();
}

function itemCard(item, type) {
  const category = categoryOf(item);
  const resolved = Boolean(item.resolved);
  const image = item.photo || item.image || category.image;
  const actionLabel = resolved ? 'Reabrir' : type === 'found' ? 'Entregado' : 'Resuelto';
  const actionIcon = resolved ? 'refresh' : 'check';
  const typeLabel = type === 'found' ? 'Encontrado por' : 'Aviso de';
  const titleId = `lostfound-title-${type}-${item.id}`;

  return el(
    'article',
    { class: `item-card${resolved ? ' is-resolved' : ''}`, dataset: { id: item.id } },
    el(
      'div',
      { class: 'item-card__media' },
      el('img', {
        src: image,
        alt: item.photo
          ? 'Fotografía del objeto publicado'
          : `Imagen de referencia de ${category.label.toLowerCase()}`,
        loading: 'lazy',
      }),
      el('span', { class: 'item-card__badge badge badge--solid', text: category.label }),
    ),
    el(
      'div',
      { class: 'item-card__body' },
      el(
        'div',
        { class: 'cluster' },
        el('h2', { class: 'item-card__title', id: titleId, text: item.desc }),
        resolved
          ? el('span', {
              class: 'badge badge--success',
              text: type === 'found' ? 'Entregado' : 'Resuelto',
            })
          : null,
      ),
      el(
        'div',
        { class: 'item-card__meta' },
        el('span', {}, el('strong', { text: `${typeLabel}: ` }), item.by),
        el('span', {}, el('strong', { text: 'Contacto: ' }), item.contact),
        el(
          'span',
          {},
          el('strong', { text: type === 'found' ? 'Lugar: ' : 'Último lugar: ' }),
          item.place || 'No especificado',
        ),
      ),
      el(
        'div',
        { class: 'item-card__footer' },
        el('span', {
          class: 'item-card__date',
          text: `${relativeTime(item.createdAt)} · ${formatDate(item.createdAt)}`,
        }),
        el(
          'div',
          { class: 'btn-row' },
          item.photo
            ? el('a', {
                class: 'btn btn--ghost btn--sm',
                href: item.photo,
                target: '_blank',
                rel: 'noopener',
                text: 'Ver foto',
                attrs: { 'aria-describedby': titleId },
              })
            : null,
          el('button', {
            class: `btn btn--sm ${resolved ? 'btn--ghost' : 'btn--success-soft'}`,
            type: 'button',
            dataset: { action: 'toggle' },
            attrs: { 'aria-describedby': titleId },
            html: `${icon(actionIcon, { size: 13 })}<span>${actionLabel}</span>`,
            on: { click: () => toggleResolved(item, type) },
          }),
          el('button', {
            class: 'icon-btn icon-btn--danger',
            type: 'button',
            attrs: { 'aria-label': 'Eliminar publicación', 'aria-describedby': titleId },
            html: icon('trash', { size: 15 }),
            on: { click: () => deleteItem(item, type) },
          }),
        ),
      ),
    ),
  );
}

function renderSummary() {
  const summary = qs('#lostfound-summary');
  if (!summary) return;
  const foundOpen = foundItems.filter((item) => !item.resolved).length;
  const lostOpen = lostItems.filter((item) => !item.resolved).length;
  summary.replaceChildren(
    statCard({
      iconName: 'lostfound',
      label: 'Objetos encontrados',
      value: String(foundItems.length),
      hint: `${foundOpen} disponibles para reclamar`,
      tone: 'success',
    }),
    statCard({
      iconName: 'search',
      label: 'Avisos de perdidos',
      value: String(lostItems.length),
      hint: `${lostOpen} aún sin resolver`,
      tone: 'warning',
    }),
    statCard({
      iconName: 'checkCircle',
      label: 'Casos resueltos',
      value: String(
        foundItems.filter((item) => item.resolved).length +
          lostItems.filter((item) => item.resolved).length,
      ),
      hint: 'Objetos devueltos a sus dueños',
      tone: '',
    }),
  );
}

function renderLists() {
  const foundList = qs('#found-list');
  const lostList = qs('#lost-list');
  if (!foundList || !lostList) return;

  const visibleFound = filterLostFoundItems(foundItems, filters);
  const visibleLost = filterLostFoundItems(lostItems, filters);

  foundList.replaceChildren(
    ...(visibleFound.length
      ? visibleFound.map((item) => itemCard(item, 'found'))
      : [
          emptyState({
            iconName: 'lostfound',
            title: foundItems.length
              ? 'No hay coincidencias'
              : 'Todavía no hay objetos encontrados',
            text: foundItems.length
              ? 'Prueba con otra búsqueda o categoría.'
              : 'Cuando alguien entregue un objeto al colegio, aparecerá aquí.',
            compact: true,
          }),
        ]),
  );

  lostList.replaceChildren(
    ...(visibleLost.length
      ? visibleLost.map((item) => itemCard(item, 'lost'))
      : [
          emptyState({
            iconName: 'search',
            title: lostItems.length ? 'No hay coincidencias' : 'No hay avisos de objetos perdidos',
            text: lostItems.length
              ? 'Prueba con otra búsqueda o categoría.'
              : 'Si perdiste algo, publica un aviso con una descripción y una foto.',
            compact: true,
          }),
        ]),
  );

  qs('#found-count')?.replaceChildren(
    document.createTextNode(String(foundItems.filter((item) => !item.resolved).length)),
  );
  qs('#lost-count')?.replaceChildren(
    document.createTextNode(String(lostItems.filter((item) => !item.resolved).length)),
  );
}

function matchSide(item, type) {
  const category = categoryOf(item);
  const image = item.photo || item.image || category.image;
  return el(
    'div',
    { class: 'match-card__item' },
    el('img', {
      class: 'match-card__thumb',
      src: image,
      alt: item.photo
        ? 'Fotografía del objeto publicado'
        : `Imagen de referencia de ${category.label.toLowerCase()}`,
      loading: 'lazy',
    }),
    el(
      'div',
      { class: 'match-card__content' },
      el('span', {
        class: 'match-card__kind',
        text: type === 'found' ? 'Encontrado' : 'Aviso de perdido',
      }),
      el('strong', { class: 'match-card__title', text: item.desc }),
      el('span', {
        class: 'match-card__meta',
        text: `${item.place || 'Sin lugar'} · ${item.by}`,
      }),
    ),
  );
}

function matchCard(match) {
  return el(
    'article',
    { class: 'match-card' },
    matchSide(match.found, 'found'),
    el(
      'div',
      { class: 'match-card__score' },
      el('strong', { text: `${match.score}%` }),
      el('span', { text: 'coincidencia' }),
    ),
    matchSide(match.lost, 'lost'),
    el(
      'ul',
      { class: 'match-card__reasons' },
      ...match.reasons.map((reason) => el('li', { text: reason })),
    ),
    el(
      'div',
      { class: 'match-card__actions' },
      el('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        text: 'Ver encontrado',
        on: { click: () => revealItem('found', match.found.id) },
      }),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        text: 'Ver aviso',
        on: { click: () => revealItem('lost', match.lost.id) },
      }),
    ),
  );
}

function renderMatches() {
  const container = qs('#lostfound-matches');
  if (!container) return;

  const openFound = foundItems.filter((item) => !item.resolved);
  const openLost = lostItems.filter((item) => !item.resolved);
  if (!openFound.length || !openLost.length) {
    container.replaceChildren();
    return;
  }

  const matches = findLostFoundMatches(foundItems, lostItems);
  if (!matches.length) {
    container.replaceChildren(
      el(
        'section',
        { class: 'card match-panel match-panel--empty' },
        el(
          'div',
          { class: 'card__body match-empty' },
          el('span', {
            class: 'match-empty__icon',
            html: icon('sparkles', { size: 20 }),
            attrs: { 'aria-hidden': 'true' },
          }),
          el(
            'div',
            {},
            el('h2', { class: 'match-empty__title', text: 'Coincidencias inteligentes' }),
            el('p', {
              class: 'match-empty__text',
              text:
                'Todavía no hay pistas suficientes para sugerir un cruce. ' +
                'Añade color, marcas y el lugar donde se perdió o encontró cada objeto.',
            }),
          ),
        ),
      ),
    );
    return;
  }

  container.replaceChildren(
    el(
      'section',
      { class: 'card match-panel' },
      el(
        'header',
        { class: 'card__header' },
        el(
          'div',
          {},
          el(
            'h2',
            { class: 'card__title' },
            el('span', { html: icon('sparkles', { size: 18 }) }),
            'Coincidencias sugeridas',
          ),
          el('p', {
            class: 'card__subtitle',
            text: 'Comparamos categoría, palabras, lugar y fechas. Confirma los detalles antes de entregar un objeto.',
          }),
        ),
        el('span', {
          class: 'badge badge--brand',
          text: `${matches.length} ${matches.length === 1 ? 'sugerencia' : 'sugerencias'}`,
        }),
      ),
      el(
        'div',
        { class: 'card__body' },
        el('div', { class: 'match-list' }, ...matches.map(matchCard)),
      ),
    ),
  );
}

function revealItem(type, id) {
  let card = cardById(type, id);
  if (!card) {
    filters = { query: '', category: 'all' };
    const search = qs('#lostfound-search');
    const category = qs('#lostfound-category');
    if (search) search.value = '';
    if (category) category.value = 'all';
    renderLists();
    card = cardById(type, id);
  }
  if (!card) return;

  const reduceMotion =
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  card.classList.add('is-highlighted');
  card.querySelector('[data-action="toggle"]')?.focus({ preventScroll: true });
  window.setTimeout(() => card.classList.remove('is-highlighted'), 2600);
}

function renderAll() {
  renderSummary();
  renderLists();
  renderMatches();
}

async function toggleResolved(item, type) {
  const repo = type === 'found' ? foundRepo : lostRepo;
  try {
    const updated = await repo.update(item.id, {
      resolved: !item.resolved,
      resolvedAt: !item.resolved ? new Date().toISOString() : null,
    });
    const next = { ...item, ...updated };
    if (type === 'found')
      foundItems = foundItems.map((entry) => (entry.id === item.id ? next : entry));
    else lostItems = lostItems.map((entry) => (entry.id === item.id ? next : entry));
    renderAll();
    focusCardAction(type, item.id);
    toast.success(next.resolved ? 'Publicación marcada como resuelta.' : 'Publicación reabierta.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo actualizar la publicación.', error);
    toast.error(error.message || 'No se pudo actualizar la publicación.');
  }
}

async function deleteItem(item, type) {
  const confirmed = await confirmDialog({
    title: 'Eliminar publicación',
    message: 'Se eliminará esta publicación de objetos perdidos. Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar',
    tone: 'danger',
  });
  if (!confirmed) return;

  const repo = type === 'found' ? foundRepo : lostRepo;
  try {
    await repo.remove(item.id);
    if (type === 'found') foundItems = foundItems.filter((entry) => entry.id !== item.id);
    else lostItems = lostItems.filter((entry) => entry.id !== item.id);
    renderAll();
    focusFirstCardAction(type);
    toast.success('Publicación eliminada.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar la publicación.', error);
    toast.error(error.message || 'No se pudo eliminar la publicación.');
  }
}

function openItemModal(type) {
  const isFound = type === 'found';
  const title = isFound ? 'Reportar objeto encontrado' : 'Publicar aviso de objeto perdido';

  const byInput = el('input', {
    class: 'input',
    id: 'item-by',
    placeholder: 'Ej: María Pérez',
    required: true,
  });
  const contactInput = el('input', {
    class: 'input',
    id: 'item-contact',
    placeholder: 'Teléfono, correo o curso',
    required: true,
  });
  const descInput = el('input', {
    class: 'input',
    id: 'item-desc',
    placeholder: 'Ej: Mochila negra con stickers',
    required: true,
  });
  const placeInput = el('input', {
    class: 'input',
    id: 'item-place',
    placeholder: isFound ? 'Ej: Patio central' : 'Ej: Aula 12',
    required: isFound,
  });

  const categorySelect = el(
    'select',
    { class: 'select', id: 'item-category', required: true },
    ...LOSTFOUND_CATEGORIES.map((category) =>
      el('option', { value: category.id, text: category.label }),
    ),
  );

  const photoPicker = createFilePicker({
    label: 'Foto del objeto',
    accept: 'image/*',
    maxSizeLabel: 'Máx. 4 MB',
    examples: EXAMPLE_IMAGES,
    examplesLabel: 'O usa una miniatura de referencia:',
  });

  const form = el(
    'form',
    { class: 'form', id: 'item-form', noValidate: true },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Tu nombre', attrs: { for: 'item-by' } }),
        byInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Contacto', attrs: { for: 'item-contact' } }),
        contactInput,
      ),
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Categoría', attrs: { for: 'item-category' } }),
        categorySelect,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: isFound ? '¿Dónde lo encontraste?' : 'Último lugar visto',
          attrs: { for: 'item-place' },
        }),
        placeInput,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', text: 'Descripción', attrs: { for: 'item-desc' } }),
      descInput,
    ),
    photoPicker.field,
    el(
      'div',
      { class: 'lostfound-note' },
      el('span', { html: icon('info', { size: 15 }) }),
      el('span', {
        text: isFound
          ? 'Si el objeto tiene datos personales, evita publicarlos completos.'
          : 'Mientras más detalles incluyas, más fácil será reconocerlo.',
      }),
    ),
  );

  const modal = openModal({
    title,
    eyebrow: 'Objetos perdidos y encontrados',
    description: isFound
      ? 'Registra el objeto que fue entregado al colegio.'
      : 'Cuéntale a la comunidad qué perdiste y dónde lo viste por última vez.',
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
        class: `btn ${isFound ? 'btn--success' : 'btn--primary'}`,
        type: 'submit',
        text: isFound ? 'Publicar encontrado' : 'Publicar aviso',
        attrs: { form: 'item-form' },
      }),
    ],
  });

  bindFieldErrorClearing(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const by = byInput.value.trim();
    const contact = contactInput.value.trim();
    const desc = descInput.value.trim();
    const place = placeInput.value.trim();
    const category = categorySelect.value;

    const errors = [
      [!by, byInput, 'Escribe tu nombre.'],
      [!contact, contactInput, 'Agrega un teléfono, correo o curso de contacto.'],
      [!desc, descInput, 'Describe el objeto con el mayor detalle posible.'],
      [isFound && !place, placeInput, 'Indica dónde encontraste el objeto.'],
    ];

    const firstInvalid = errors.find(([invalid]) => invalid);
    if (firstInvalid) {
      errors.forEach(([invalid, input, message]) => {
        if (invalid) setFieldError(input, message);
      });
      firstInvalid[1].focus();
      return;
    }

    const submitButton = qs('button[type="submit"]', modal.element);
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando…';

    try {
      const file = photoPicker.getFile();
      const photo = file
        ? await prepareUpload(file, { maxSize: 4 * 1024 * 1024, accept: 'image/' })
        : null;
      const categoryData = CATEGORY_MAP[category] || CATEGORY_MAP.otro;
      const payload = {
        category,
        desc,
        by,
        contact,
        place,
        photo,
        image: photoPicker.getExample() || categoryData.image,
        resolved: false,
        resolvedAt: null,
      };
      const repo = isFound ? foundRepo : lostRepo;
      const created = await repo.create(payload);

      if (isFound) foundItems = [created, ...foundItems];
      else lostItems = [created, ...lostItems];

      modal.close();
      renderAll();
      focusCardAction(type, created.id);
      toast.success(
        isFound ? 'Objeto encontrado publicado.' : 'Aviso de objeto perdido publicado.',
      );
    } catch (error) {
      console.error('[IntraNerd] No se pudo publicar el objeto.', error);
      toast.error(error.message || 'No se pudo publicar el objeto.');
      submitButton.disabled = false;
      submitButton.textContent = isFound ? 'Publicar encontrado' : 'Publicar aviso';
    }
  });

  requestAnimationFrame(() => byInput.focus());
}

function bindFilters() {
  const search = qs('#lostfound-search');
  const category = qs('#lostfound-category');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderLists();
  });
  category?.addEventListener('change', () => {
    filters.category = category.value;
    renderLists();
  });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Convivencia',
      title: 'Objetos perdidos y encontrados',
      description:
        'Un espacio transparente para devolver objetos a sus dueños y avisar cuando algo se pierde.',
      actions: [
        el('button', {
          class: 'btn btn--success',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Reportar encontrado</span>`,
          on: { click: () => openItemModal('found') },
        }),
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('search', { size: 16 })}<span>Publicar perdido</span>`,
          on: { click: () => openItemModal('lost') },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'lostfound-summary', class: 'grid-3' }, skeletonRows(1)),
      el('div', { id: 'lostfound-matches' }),
      el(
        'div',
        { class: 'toolbar' },
        el('input', {
          class: 'input input--search toolbar__search',
          id: 'lostfound-search',
          type: 'search',
          placeholder: 'Buscar por descripción, persona o lugar…',
          attrs: { 'aria-label': 'Buscar objetos' },
        }),
        el(
          'select',
          {
            class: 'select',
            id: 'lostfound-category',
            attrs: { 'aria-label': 'Filtrar por categoría' },
          },
          el('option', { value: 'all', text: 'Todas las categorías' }),
          ...LOSTFOUND_CATEGORIES.map((category) =>
            el('option', { value: category.id, text: category.label }),
          ),
        ),
      ),
      el(
        'section',
        { class: 'card' },
        el(
          'header',
          { class: 'card__header' },
          el(
            'div',
            {},
            el(
              'h2',
              { class: 'card__title' },
              el('span', { html: icon('lostfound', { size: 18 }) }),
              'Objetos encontrados',
            ),
            el('p', {
              class: 'card__subtitle',
              text: 'Objetos que ya fueron entregados al colegio y esperan a su dueño.',
            }),
          ),
          el(
            'div',
            { class: 'cluster' },
            el(
              'span',
              { class: 'badge badge--success' },
              el('span', { id: 'found-count', text: '0' }),
              ' disponibles',
            ),
            el('button', {
              class: 'btn btn--ghost btn--sm',
              type: 'button',
              text: 'Reportar encontrado',
              on: { click: () => openItemModal('found') },
            }),
          ),
        ),
        el(
          'div',
          { class: 'card__body' },
          el('div', { class: 'lostfound-grid', id: 'found-list' }, skeletonRows(2)),
        ),
      ),
      el(
        'section',
        { class: 'card' },
        el(
          'header',
          { class: 'card__header' },
          el(
            'div',
            {},
            el(
              'h2',
              { class: 'card__title' },
              el('span', { html: icon('search', { size: 18 }) }),
              'Avisos de objetos perdidos',
            ),
            el('p', {
              class: 'card__subtitle',
              text: 'Publicaciones de personas que buscan sus cosas.',
            }),
          ),
          el(
            'div',
            { class: 'cluster' },
            el(
              'span',
              { class: 'badge badge--warning' },
              el('span', { id: 'lost-count', text: '0' }),
              ' sin resolver',
            ),
            el('button', {
              class: 'btn btn--ghost btn--sm',
              type: 'button',
              text: 'Publicar aviso',
              on: { click: () => openItemModal('lost') },
            }),
          ),
        ),
        el(
          'div',
          { class: 'card__body' },
          el('div', { class: 'lostfound-grid', id: 'lost-list' }, skeletonRows(2)),
        ),
      ),
    ),
  );

  bindFilters();

  try {
    const [found, lost] = await Promise.all([foundRepo.list(), lostRepo.list()]);
    foundItems = found;
    lostItems = lost;
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar objetos perdidos.', error);
    toast.error('No fue posible cargar los objetos perdidos.');
  }
}
