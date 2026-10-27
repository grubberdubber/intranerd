import { EXAMPLE_PEOPLE } from '../data/constants.js';
import { missingRepo } from '../services/resources.js';
import { el, qs } from '../utils/dom.js';
import { prepareUpload } from '../utils/files.js';
import { formatDateTime, relativeTime } from '../utils/format.js';
import { filterMissingReports } from '../utils/reports.js';
import { icon } from '../components/icon.js';
import { createFilePicker } from '../components/filePicker.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let reports = [];
let filters = { query: '', status: 'all' };

function filteredReports() {
  return filterMissingReports(reports, filters);
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

function reportCard(report) {
  const photo = report.photo || report.exampleImg || EXAMPLE_PEOPLE[0];
  const isFound = Boolean(report.found);
  const foundLabel = isFound ? 'Marcar activo' : 'Marcar encontrado';
  const foundIcon = isFound ? 'refresh' : 'checkCircle';

  return el(
    'article',
    { class: `report-card${isFound ? ' is-found' : ''}`, dataset: { id: report.id } },
    el(
      'div',
      { class: 'report-card__thumb' },
      el('img', { src: photo, alt: `Fotografía de ${report.name}`, loading: 'lazy' }),
    ),
    el(
      'div',
      { class: 'report-card__body' },
      el(
        'div',
        { class: 'report-card__top' },
        el('h2', { class: 'report-card__name', text: report.name }),
        el('span', {
          class: `badge ${isFound ? 'badge--solid-success' : 'badge--solid-danger'}`,
          text: isFound ? 'ENCONTRADO' : 'ACTIVO',
        }),
        report.age ? el('span', { class: 'badge', text: `${report.age} años` }) : null,
      ),
      el('p', { class: 'report-card__desc', text: report.desc }),
      el(
        'div',
        { class: 'report-card__meta' },
        el('span', {}, el('span', { html: icon('mapPin', { size: 13 }) }), report.place),
        el('span', {}, el('span', { html: icon('phone', { size: 13 }) }), report.contact),
        el(
          'span',
          {},
          el('span', { html: icon('clock', { size: 13 }) }),
          relativeTime(report.createdAt),
        ),
      ),
      isFound && report.foundAt
        ? el('span', {
            class: 'badge badge--success',
            text: `Ubicado ${formatDateTime(report.foundAt)}`,
          })
        : null,
      report.photo
        ? el('a', {
            class: 'report-card__link',
            href: report.photo,
            target: '_blank',
            rel: 'noopener',
            text: 'Ver foto o evidencia adjunta',
          })
        : null,
    ),
    el(
      'div',
      { class: 'report-card__actions' },
      el('button', {
        class: `btn btn--sm ${isFound ? 'btn--ghost' : 'btn--success-soft'}`,
        type: 'button',
        html: `${icon(foundIcon, { size: 14 })}<span>${foundLabel}</span>`,
        on: { click: () => toggleFound(report) },
      }),
      el('button', {
        class: 'btn btn--danger-soft btn--sm',
        type: 'button',
        html: `${icon('trash', { size: 14 })}<span>Eliminar</span>`,
        on: { click: () => deleteReport(report) },
      }),
    ),
  );
}

function renderList() {
  const list = qs('#missing-list');
  if (!list) return;
  const visible = filteredReports();

  if (!visible.length) {
    list.replaceChildren(
      emptyState({
        iconName: 'missing',
        title: reports.length ? 'No hay coincidencias' : 'Sin reportes activos',
        text: reports.length
          ? 'Prueba con otro nombre, lugar o estado.'
          : 'Cuando la comunidad reporte una persona extraviada, aparecerá aquí de inmediato.',
        action: reports.length
          ? el('button', {
              class: 'btn btn--ghost',
              type: 'button',
              text: 'Limpiar filtros',
              on: { click: () => resetFilters() },
            })
          : el('button', {
              class: 'btn btn--primary',
              type: 'button',
              html: `${icon('plus', { size: 16 })}<span>Crear reporte</span>`,
              on: { click: openReportModal },
            }),
      }),
    );
    return;
  }

  list.replaceChildren(...visible.map(reportCard));
}

function renderSummary() {
  const summary = qs('#missing-summary');
  if (!summary) return;
  const active = reports.filter((report) => !report.found).length;
  const found = reports.filter((report) => report.found).length;
  summary.replaceChildren(
    statCard({
      iconName: 'alert',
      label: 'Reportes activos',
      value: String(active),
      hint: 'Requieren atención',
      tone: active ? 'danger' : '',
    }),
    statCard({
      iconName: 'checkCircle',
      label: 'Personas ubicadas',
      value: String(found),
      hint: 'Reportes resueltos',
      tone: 'success',
    }),
    statCard({
      iconName: 'users',
      label: 'Total de reportes',
      value: String(reports.length),
      hint: 'Historial de la comunidad',
      tone: '',
    }),
  );
}

function renderAll() {
  renderSummary();
  renderList();
}

async function toggleFound(report) {
  try {
    const updated = await missingRepo.update(report.id, {
      found: !report.found,
      foundAt: !report.found ? new Date().toISOString() : null,
    });
    reports = reports.map((item) => (item.id === report.id ? { ...item, ...updated } : item));
    renderAll();
    toast.success(
      !report.found
        ? `${report.name} marcado/a como encontrado/a.`
        : `Reporte de ${report.name} reactivado.`,
    );
  } catch (error) {
    console.error('[IntraNerd] No se pudo actualizar el reporte.', error);
    toast.error(error.message || 'No se pudo actualizar el reporte.');
  }
}

async function deleteReport(report) {
  const confirmed = await confirmDialog({
    title: 'Eliminar reporte',
    message: `Se eliminará el reporte de ${report.name}. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar reporte',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await missingRepo.remove(report.id);
    reports = reports.filter((item) => item.id !== report.id);
    renderAll();
    toast.success('Reporte eliminado.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar el reporte.', error);
    toast.error(error.message || 'No se pudo eliminar el reporte.');
  }
}

function resetFilters() {
  filters = { query: '', status: 'all' };
  const search = qs('#missing-search');
  if (search) search.value = '';
  document.querySelectorAll('#missing-filters .filter-pill').forEach((pill) => {
    pill.classList.toggle('is-active', pill.dataset.status === 'all');
  });
  renderList();
}

function openReportModal() {
  const nameInput = el('input', {
    class: 'input',
    id: 'missing-name',
    placeholder: 'Ej: Sofía Ramos',
    required: true,
  });
  const ageInput = el('input', {
    class: 'input',
    id: 'missing-age',
    type: 'number',
    min: '0',
    max: '120',
    placeholder: 'Ej: 13',
  });
  const placeInput = el('input', {
    class: 'input',
    id: 'missing-place',
    placeholder: 'Ej: Patio central / Aula 5',
    required: true,
  });
  const contactInput = el('input', {
    class: 'input',
    id: 'missing-contact',
    placeholder: 'Nombre, teléfono o correo',
    required: true,
  });
  const descInput = el('textarea', {
    class: 'textarea',
    id: 'missing-desc',
    placeholder: 'Ropa, rasgos, contextura, cualquier detalle que ayude a identificarla.',
    required: true,
  });

  const photoPicker = createFilePicker({
    label: 'Foto o evidencia',
    accept: 'image/*',
    maxSizeLabel: 'Máx. 4 MB',
    hint: 'Se comprime automáticamente para ocupar menos espacio.',
    examples: EXAMPLE_PEOPLE,
    examplesLabel: 'O usa una imagen de ejemplo:',
  });

  const form = el(
    'form',
    { class: 'form', id: 'missing-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Nombre de la persona',
          attrs: { for: 'missing-name' },
        }),
        nameInput,
      ),
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label' },
          'Edad aproximada ',
          el('span', { class: 'field__optional', text: '(opcional)' }),
        ),
        ageInput,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Descripción y vestimenta',
        attrs: { for: 'missing-desc' },
      }),
      descInput,
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Último lugar visto',
          attrs: { for: 'missing-place' },
        }),
        placeInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Contacto de reporte',
          attrs: { for: 'missing-contact' },
        }),
        contactInput,
      ),
    ),
    photoPicker.field,
  );

  const modal = openModal({
    title: 'Reportar persona extraviada',
    eyebrow: 'Seguridad escolar',
    description:
      'Entrega la mayor cantidad de información posible. El reporte se guarda de inmediato.',
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
        class: 'btn btn--danger',
        type: 'submit',
        text: 'Publicar reporte',
        attrs: { form: 'missing-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const place = placeInput.value.trim();
    const contact = contactInput.value.trim();
    const desc = descInput.value.trim();
    const age = ageInput.value.trim();

    if (!name || !place || !contact || !desc) {
      toast.warning('Completa nombre, descripción, último lugar y contacto.');
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
      const created = await missingRepo.create({
        name,
        age: age ? Number(age) : null,
        desc,
        place,
        contact,
        photo,
        exampleImg: photoPicker.getExample() || null,
        found: false,
        foundAt: null,
      });
      reports = [created, ...reports];
      modal.close();
      renderAll();
      toast.success('Reporte publicado. La comunidad podrá verlo de inmediato.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo crear el reporte.', error);
      toast.error(error.message || 'No se pudo crear el reporte.');
      submitButton.disabled = false;
      submitButton.textContent = 'Publicar reporte';
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

function bindFilters() {
  const search = qs('#missing-search');
  const pills = document.querySelectorAll('#missing-filters .filter-pill');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderList();
  });

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filters.status = pill.dataset.status;
      pills.forEach((item) => item.classList.toggle('is-active', item === pill));
      renderList();
    });
  });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Seguridad escolar',
      title: 'Personas extraviadas',
      description:
        'Un canal rápido y visible para reportar personas extraviadas dentro del recinto y coordinar su búsqueda.',
      actions: [
        el('button', {
          class: 'btn btn--danger',
          type: 'button',
          html: `${icon('alert', { size: 16 })}<span>Reportar persona</span>`,
          on: { click: openReportModal },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'missing-summary', class: 'grid-3' }, skeletonRows(1)),
      el(
        'div',
        { class: 'toolbar missing-filters', id: 'missing-filters' },
        el('input', {
          class: 'input input--search',
          id: 'missing-search',
          type: 'search',
          placeholder: 'Buscar por nombre, lugar o contacto…',
          attrs: { 'aria-label': 'Buscar reportes' },
        }),
        el(
          'div',
          { class: 'filter-pills' },
          el('button', {
            class: 'filter-pill is-active',
            type: 'button',
            dataset: { status: 'all' },
            text: 'Todos',
          }),
          el('button', {
            class: 'filter-pill',
            type: 'button',
            dataset: { status: 'active' },
            text: 'Activos',
          }),
          el('button', {
            class: 'filter-pill',
            type: 'button',
            dataset: { status: 'found' },
            text: 'Encontrados',
          }),
        ),
        el('span', { class: 'toolbar__spacer' }),
        el('span', { class: 'text-xs text-muted', text: 'Guardado en este navegador' }),
      ),
      el('div', { id: 'missing-list', class: 'report-list' }, skeletonRows(3)),
    ),
  );

  bindFilters();

  try {
    reports = await missingRepo.list();
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar reportes.', error);
    toast.error('No fue posible cargar los reportes.');
    qs('#missing-list')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar los reportes',
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
