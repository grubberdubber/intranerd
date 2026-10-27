import { LOSTFOUND_CATEGORIES } from '../data/constants.js';
import { foundRepo, lostRepo } from '../services/resources.js';
import { el, qs } from '../utils/dom.js';
import { prepareUpload } from '../utils/files.js';
import { formatDate, relativeTime } from '../utils/format.js';
import { filterLostFoundItems } from '../utils/reports.js';
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

function itemCard(item, type) {
  const category = categoryOf(item);
  const resolved = Boolean(item.resolved);
  const image = item.photo || item.image || category.image;
  const actionLabel = resolved ? 'Reabrir' : type === 'found' ? 'Entregado' : 'Resuelto';
  const actionIcon = resolved ? 'refresh' : 'check';
  const typeLabel = type === 'found' ? 'Encontrado por' : 'Aviso de';

  return el(
    'article',
    { class: `item-card${resolved ? ' is-resolved' : ''}`, dataset: { id: item.id } },
    el(
      'div',
      { class: 'item-card__media' },
      el('img', { src: image, alt: item.desc, loading: 'lazy' }),
      el('span', { class: 'item-card__badge badge badge--solid', text: category.label }),
    ),
    el(
      'div',
      { class: 'item-card__body' },
      el(
        'div',
        { class: 'cluster' },
        el('h2', { class: 'item-card__title', text: item.desc }),
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
              })
            : null,
          el('button', {
            class: `btn btn--sm ${resolved ? 'btn--ghost' : 'btn--success-soft'}`,
            type: 'button',
            html: `${icon(actionIcon, { size: 13 })}<span>${actionLabel}</span>`,
            on: { click: () => toggleResolved(item, type) },
          }),
          el('button', {
            class: 'icon-btn icon-btn--danger',
            type: 'button',
            attrs: { 'aria-label': 'Eliminar publicación' },
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

function renderAll() {
  renderSummary();
  renderLists();
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
    { class: 'form', id: 'item-form' },
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const by = byInput.value.trim();
    const contact = contactInput.value.trim();
    const desc = descInput.value.trim();
    const place = placeInput.value.trim();
    const category = categorySelect.value;

    if (!by || !contact || !desc || (isFound && !place)) {
      toast.warning(
        isFound
          ? 'Completa tu nombre, contacto, descripción y lugar.'
          : 'Completa tu nombre, contacto y descripción.',
      );
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
