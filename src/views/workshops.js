import { WORKSHOP_CATEGORIES } from '../data/constants.js';
import { workshopsRepo } from '../services/resources.js';
import { el, qs } from '../utils/dom.js';
import { icon } from '../components/icon.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonCards } from '../components/states.js';
import { toast } from '../components/toast.js';
import { uid } from '../utils/id.js';

let workshops = [];
let filters = { query: '', category: 'all' };

const CATEGORY_MAP = Object.fromEntries(
  WORKSHOP_CATEGORIES.map((category) => [category.id, category]),
);

function categoryOf(workshop) {
  return CATEGORY_MAP[workshop.category] || WORKSHOP_CATEGORIES[0];
}

function enrollmentCount(workshop) {
  return Array.isArray(workshop.enrollments) ? workshop.enrollments.length : 0;
}

function availableSpots(workshop) {
  return Math.max(0, Number(workshop.capacity || 0) - enrollmentCount(workshop));
}

function capacityClass(workshop) {
  const count = enrollmentCount(workshop);
  const capacity = Number(workshop.capacity || 0);
  if (!capacity) return '';
  const ratio = count / capacity;
  if (ratio >= 1) return 'capacity__fill--full';
  if (ratio >= 0.75) return 'capacity__fill--warning';
  return '';
}

function filteredWorkshops() {
  const query = filters.query.trim().toLowerCase();
  return workshops.filter((workshop) => {
    if (filters.category !== 'all' && workshop.category !== filters.category) return false;
    if (!query) return true;
    return [workshop.name, workshop.teacher, workshop.description, workshop.location].some(
      (value) =>
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

function workshopCard(workshop) {
  const category = categoryOf(workshop);
  const count = enrollmentCount(workshop);
  const capacity = Number(workshop.capacity || 0);
  const spots = availableSpots(workshop);
  const full = spots <= 0;
  const percentage = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;

  return el(
    'article',
    { class: 'workshop-card', dataset: { id: workshop.id } },
    el(
      'div',
      { class: 'workshop-card__cover' },
      el('span', { class: 'workshop-card__icon', html: icon(category.icon, { size: 22 }) }),
      el(
        'div',
        { class: 'workshop-card__cover-meta' },
        el('span', { class: 'badge badge--brand', text: category.label }),
        el('span', {
          class: `badge ${full ? 'badge--danger' : spots <= 3 ? 'badge--warning' : 'badge--success'}`,
          text: full ? 'Cupo lleno' : `${spots} ${spots === 1 ? 'cupo' : 'cupos'}`,
        }),
      ),
    ),
    el(
      'div',
      { class: 'workshop-card__body' },
      el('h2', { class: 'workshop-card__title', text: workshop.name }),
      el('p', { class: 'workshop-card__desc', text: workshop.description }),
      el(
        'div',
        { class: 'workshop-card__details' },
        el('span', {}, el('span', { html: icon('user', { size: 13 }) }), workshop.teacher),
        el('span', {}, el('span', { html: icon('clock', { size: 13 }) }), workshop.schedule),
        el('span', {}, el('span', { html: icon('mapPin', { size: 13 }) }), workshop.location),
      ),
      el(
        'div',
        { class: 'capacity' },
        el(
          'div',
          { class: 'capacity__label' },
          el('span', {}, el('strong', { text: String(count) }), ` / ${capacity} inscritos`),
          el('span', { text: `${percentage}%` }),
        ),
        el(
          'div',
          { class: 'capacity__track' },
          el('span', {
            class: `capacity__fill ${capacityClass(workshop)}`.trim(),
            cssVar: { '--capacity': `${percentage}%` },
          }),
        ),
      ),
    ),
    el(
      'div',
      { class: 'workshop-card__footer' },
      el(
        'span',
        { class: 'workshop-card__count' },
        el('strong', { text: String(count) }),
        ' inscripciones',
      ),
      el(
        'div',
        { class: 'btn-row' },
        el('button', {
          class: 'btn btn--ghost btn--sm',
          type: 'button',
          text: 'Ver inscritos',
          on: { click: () => openWorkshopDetail(workshop) },
        }),
        el('button', {
          class: `btn btn--sm ${full ? 'btn--ghost' : 'btn--primary'}`,
          type: 'button',
          text: full ? 'Cupo lleno' : 'Inscribirme',
          disabled: full,
          on: { click: () => openEnrollModal(workshop) },
        }),
      ),
    ),
  );
}

function renderSummary() {
  const summary = qs('#workshops-summary');
  if (!summary) return;
  const totalEnrollments = workshops.reduce((sum, workshop) => sum + enrollmentCount(workshop), 0);
  const totalSpots = workshops.reduce((sum, workshop) => sum + availableSpots(workshop), 0);
  const categories = new Set(workshops.map((workshop) => workshop.category)).size;

  summary.replaceChildren(
    statCard({
      iconName: 'workshops',
      label: 'Talleres activos',
      value: String(workshops.length),
      hint: `${categories} categorías distintas`,
      tone: '',
    }),
    statCard({
      iconName: 'users',
      label: 'Cupos disponibles',
      value: String(totalSpots),
      hint: 'Para nuevas inscripciones',
      tone: totalSpots ? 'success' : 'danger',
    }),
    statCard({
      iconName: 'checkCircle',
      label: 'Inscripciones',
      value: String(totalEnrollments),
      hint: 'Alumnos participando',
      tone: 'warning',
    }),
  );
}

function renderList() {
  const list = qs('#workshops-list');
  if (!list) return;
  const visible = filteredWorkshops();

  if (!visible.length) {
    list.replaceChildren(
      emptyState({
        iconName: 'workshops',
        title: workshops.length ? 'No hay coincidencias' : 'Aún no hay talleres',
        text: workshops.length
          ? 'Prueba con otra categoría o término de búsqueda.'
          : 'Crea el primer taller para abrir las inscripciones.',
        action: el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Nuevo taller</span>`,
          on: { click: openCreateModal },
        }),
      }),
    );
    return;
  }

  list.replaceChildren(...visible.map(workshopCard));
}

function renderAll() {
  renderSummary();
  renderList();
}

async function saveWorkshop(workshop, patch, { successMessage = 'Taller actualizado.' } = {}) {
  const updated = await workshopsRepo.update(workshop.id, patch);
  workshops = workshops.map((item) => (item.id === workshop.id ? { ...item, ...updated } : item));
  renderAll();
  if (successMessage) toast.success(successMessage);
  return updated;
}

function openEnrollModal(workshop) {
  const current = workshops.find((item) => item.id === workshop.id) || workshop;
  if (availableSpots(current) <= 0) {
    toast.warning('Este taller ya no tiene cupos disponibles.');
    return;
  }

  const nameInput = el('input', {
    class: 'input',
    id: 'enroll-name',
    placeholder: 'Nombre del alumno/a',
    required: true,
  });
  const courseInput = el('input', {
    class: 'input',
    id: 'enroll-course',
    placeholder: 'Ej: 7° B / 2° medio',
    required: true,
  });

  const form = el(
    'form',
    { class: 'form', id: 'enroll-form' },
    el(
      'div',
      { class: 'lostfound-note' },
      el('span', { html: icon('info', { size: 15 }) }),
      el('span', {
        text:
          `Quedan ${availableSpots(current)} cupos disponibles de ${current.capacity}. ` +
          'La inscripción se guarda en este navegador.',
      }),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Nombre del alumno/a',
        attrs: { for: 'enroll-name' },
      }),
      nameInput,
    ),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', text: 'Curso', attrs: { for: 'enroll-course' } }),
      courseInput,
    ),
  );

  const modal = openModal({
    title: `Inscribirse en ${current.name}`,
    eyebrow: 'Talleres extracurriculares',
    description: current.schedule,
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
        text: 'Confirmar inscripción',
        attrs: { form: 'enroll-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const course = courseInput.value.trim();
    if (!name || !course) {
      toast.warning('Completa el nombre y el curso.');
      return;
    }

    const fresh = workshops.find((item) => item.id === current.id) || current;
    if (availableSpots(fresh) <= 0) {
      toast.error('El taller se llenó mientras completabas el formulario.');
      modal.close();
      renderAll();
      return;
    }

    const duplicate = (fresh.enrollments || []).some(
      (enrollment) =>
        enrollment.name.toLowerCase() === name.toLowerCase() &&
        enrollment.course.toLowerCase() === course.toLowerCase(),
    );
    if (duplicate) {
      toast.warning('Ese alumno ya está inscrito en este taller.');
      return;
    }

    try {
      const enrollment = {
        id: uid('enroll'),
        name,
        course,
        createdAt: new Date().toISOString(),
      };
      await saveWorkshop(
        fresh,
        {
          enrollments: [...(fresh.enrollments || []), enrollment],
        },
        { successMessage: `${name} quedó inscrito/a en ${fresh.name}.` },
      );
      modal.close();
    } catch (error) {
      console.error('[IntraNerd] No se pudo completar la inscripción.', error);
      toast.error(error.message || 'No se pudo completar la inscripción.');
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

async function removeEnrollment(workshop, enrollment, modal) {
  const confirmed = await confirmDialog({
    title: 'Cancelar inscripción',
    message: `Se quitará a ${enrollment.name} del taller "${workshop.name}".`,
    confirmLabel: 'Quitar inscripción',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    const fresh = workshops.find((item) => item.id === workshop.id) || workshop;
    await saveWorkshop(
      fresh,
      {
        enrollments: (fresh.enrollments || []).filter((item) => item.id !== enrollment.id),
      },
      { successMessage: 'Inscripción eliminada.' },
    );
    modal.close();
  } catch (error) {
    console.error('[IntraNerd] No se pudo quitar la inscripción.', error);
    toast.error(error.message || 'No se pudo quitar la inscripción.');
  }
}

function openWorkshopDetail(workshop) {
  const current = workshops.find((item) => item.id === workshop.id) || workshop;
  const enrollments = current.enrollments || [];
  const category = categoryOf(current);

  const list = enrollments.length
    ? el(
        'div',
        { class: 'enrollment-list' },
        ...enrollments.map((enrollment) =>
          el(
            'div',
            { class: 'enrollment-item' },
            el('span', {
              class: 'avatar avatar--sm',
              text: enrollment.name.slice(0, 1).toUpperCase(),
            }),
            el('span', { class: 'enrollment-item__name', text: enrollment.name }),
            el('span', { class: 'enrollment-item__course', text: enrollment.course }),
            el('button', {
              class: 'enrollment-item__remove',
              type: 'button',
              attrs: { 'aria-label': `Quitar a ${enrollment.name}` },
              html: icon('x', { size: 13 }),
              on: { click: () => removeEnrollment(current, enrollment, modal) },
            }),
          ),
        ),
      )
    : emptyState({
        iconName: 'users',
        title: 'Sin inscripciones',
        text: 'Todavía no hay alumnos inscritos en este taller.',
        compact: true,
      });

  const body = el(
    'div',
    { class: 'stack' },
    el(
      'div',
      { class: 'cluster' },
      el('span', { class: 'badge badge--brand', text: category.label }),
      el('span', { class: 'badge', text: `${enrollments.length} / ${current.capacity} inscritos` }),
      el('span', {
        class: 'badge badge--success',
        text: `${availableSpots(current)} cupos libres`,
      }),
    ),
    el('p', { class: 'text-sm text-soft', text: current.description }),
    el(
      'div',
      { class: 'meta-list' },
      el(
        'span',
        { class: 'meta-list__item' },
        el('span', { html: icon('user', { size: 13 }) }),
        current.teacher,
      ),
      el(
        'span',
        { class: 'meta-list__item' },
        el('span', { html: icon('clock', { size: 13 }) }),
        current.schedule,
      ),
      el(
        'span',
        { class: 'meta-list__item' },
        el('span', { html: icon('mapPin', { size: 13 }) }),
        current.location,
      ),
    ),
    el('hr', { class: 'divider' }),
    el('h3', { class: 'section__title', text: 'Alumnos inscritos' }),
    list,
  );

  const modal = openModal({
    title: current.name,
    eyebrow: 'Detalle del taller',
    description: current.schedule,
    body,
    size: 'lg',
    footer: [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Cerrar',
        on: { click: () => modal.close() },
      }),
      availableSpots(current) > 0
        ? el('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Inscribir alumno',
            on: {
              click: () => {
                modal.close();
                openEnrollModal(current);
              },
            },
          })
        : el('span', { class: 'workshop-full-note', text: 'Taller completo' }),
    ],
  });
}

function openCreateModal() {
  const nameInput = el('input', {
    class: 'input',
    id: 'workshop-name',
    placeholder: 'Ej: Club de ajedrez',
    required: true,
  });
  const teacherInput = el('input', {
    class: 'input',
    id: 'workshop-teacher',
    placeholder: 'Ej: Prof. Ana Pérez',
    required: true,
  });
  const scheduleInput = el('input', {
    class: 'input',
    id: 'workshop-schedule',
    placeholder: 'Ej: Martes · 16:00 a 17:30',
    required: true,
  });
  const locationInput = el('input', {
    class: 'input',
    id: 'workshop-location',
    placeholder: 'Ej: Biblioteca',
    required: true,
  });
  const capacityInput = el('input', {
    class: 'input',
    id: 'workshop-capacity',
    type: 'number',
    min: '1',
    max: '200',
    value: '20',
    required: true,
  });
  const categorySelect = el(
    'select',
    { class: 'select', id: 'workshop-category' },
    ...WORKSHOP_CATEGORIES.map((category) =>
      el('option', { value: category.id, text: category.label }),
    ),
  );
  const descriptionInput = el('textarea', {
    class: 'textarea',
    id: 'workshop-description',
    placeholder: 'Describe el objetivo, la metodología y a quién está dirigido.',
    required: true,
  });

  const form = el(
    'form',
    { class: 'form', id: 'workshop-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Nombre del taller',
          attrs: { for: 'workshop-name' },
        }),
        nameInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Categoría',
          attrs: { for: 'workshop-category' },
        }),
        categorySelect,
      ),
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Profesor/a a cargo',
          attrs: { for: 'workshop-teacher' },
        }),
        teacherInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Cupos disponibles',
          attrs: { for: 'workshop-capacity' },
        }),
        capacityInput,
      ),
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Horario',
          attrs: { for: 'workshop-schedule' },
        }),
        scheduleInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Lugar', attrs: { for: 'workshop-location' } }),
        locationInput,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Descripción',
        attrs: { for: 'workshop-description' },
      }),
      descriptionInput,
    ),
  );

  const modal = openModal({
    title: 'Nuevo taller',
    eyebrow: 'Oferta extracurricular',
    description: 'Abre una nueva actividad para la comunidad escolar.',
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
        text: 'Crear taller',
        attrs: { form: 'workshop-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const teacher = teacherInput.value.trim();
    const schedule = scheduleInput.value.trim();
    const location = locationInput.value.trim();
    const description = descriptionInput.value.trim();
    const capacity = Number(capacityInput.value);

    if (
      !name ||
      !teacher ||
      !schedule ||
      !location ||
      !description ||
      !Number.isFinite(capacity) ||
      capacity < 1
    ) {
      toast.warning('Completa todos los campos y define una capacidad válida.');
      return;
    }

    try {
      const created = await workshopsRepo.create({
        name,
        category: categorySelect.value,
        teacher,
        schedule,
        location,
        capacity,
        description,
        enrollments: [],
      });
      workshops = [created, ...workshops];
      modal.close();
      renderAll();
      toast.success(`Taller "${name}" creado.`);
    } catch (error) {
      console.error('[IntraNerd] No se pudo crear el taller.', error);
      toast.error(error.message || 'No se pudo crear el taller.');
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

function bindFilters() {
  const search = qs('#workshops-search');
  const category = qs('#workshops-category');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderList();
  });
  category?.addEventListener('change', () => {
    filters.category = category.value;
    renderList();
  });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Vida escolar',
      title: 'Talleres y actividades extracurriculares',
      description:
        'Explora la oferta de talleres, revisa horarios y asegura tu cupo en las actividades que más te interesan.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Nuevo taller</span>`,
          on: { click: openCreateModal },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'workshops-summary', class: 'grid-3' }, skeletonCards(3)),
      el(
        'div',
        { class: 'toolbar' },
        el('input', {
          class: 'input input--search toolbar__search',
          id: 'workshops-search',
          type: 'search',
          placeholder: 'Buscar taller, profesor o lugar…',
          attrs: { 'aria-label': 'Buscar talleres' },
        }),
        el(
          'select',
          {
            class: 'select',
            id: 'workshops-category',
            attrs: { 'aria-label': 'Filtrar talleres por categoría' },
          },
          el('option', { value: 'all', text: 'Todas las categorías' }),
          ...WORKSHOP_CATEGORIES.map((category) =>
            el('option', { value: category.id, text: category.label }),
          ),
        ),
      ),
      el('div', { id: 'workshops-list', class: 'workshop-grid' }, skeletonCards(6)),
    ),
  );

  bindFilters();

  try {
    workshops = await workshopsRepo.list();
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar talleres.', error);
    toast.error('No fue posible cargar los talleres.');
    qs('#workshops-list')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar los talleres',
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
