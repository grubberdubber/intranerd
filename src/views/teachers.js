import { EXAMPLE_AVATARS, SUBJECTS } from '../data/constants.js';
import { teachersRepo } from '../services/resources.js';
import { getProfile } from '../services/session.js';
import { el, qs } from '../utils/dom.js';
import { prepareUpload } from '../utils/files.js';
import { initials, relativeTime } from '../utils/format.js';
import { icon } from '../components/icon.js';
import { createFilePicker } from '../components/filePicker.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { createStarRating, ratingSummary, staticStars } from '../components/stars.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let teachers = [];
let filters = { query: '', subject: 'all', sort: 'rating' };
const expanded = new Set();

function teacherStats(teacher) {
  const reviews = Array.isArray(teacher.reviews) ? teacher.reviews : [];
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const count = reviews.length;
  return {
    reviews,
    count,
    total,
    average: count ? total / count : 0,
  };
}

function subjectOptions() {
  return Array.from(new Set(teachers.map((teacher) => teacher.subject).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, 'es'),
  );
}

function filteredTeachers() {
  const query = filters.query.trim().toLowerCase();
  const result = teachers.filter((teacher) => {
    if (filters.subject !== 'all' && teacher.subject !== filters.subject) return false;
    if (!query) return true;
    return [teacher.name, teacher.subject].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(query),
    );
  });

  return result.sort((a, b) => {
    if (filters.sort === 'name') return a.name.localeCompare(b.name, 'es');
    if (filters.sort === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    const statsA = teacherStats(a);
    const statsB = teacherStats(b);
    return statsB.average - statsA.average || statsB.count - statsA.count;
  });
}

function renderEvidence(evidence) {
  if (!evidence) return null;
  const wrapper = el('div', { class: 'review-evidence' });

  if (evidence.startsWith('data:image/')) {
    wrapper.appendChild(el('img', { src: evidence, alt: 'Evidencia adjunta', loading: 'lazy' }));
  } else if (evidence.startsWith('data:video/')) {
    wrapper.appendChild(el('video', { src: evidence, controls: true, preload: 'metadata' }));
  } else if (evidence.startsWith('data:')) {
    wrapper.appendChild(
      el('a', { href: evidence, target: '_blank', rel: 'noopener', text: 'Abrir archivo adjunto' }),
    );
  } else if (/^https?:/i.test(evidence)) {
    if (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(evidence)) {
      wrapper.appendChild(el('img', { src: evidence, alt: 'Evidencia adjunta', loading: 'lazy' }));
    } else {
      wrapper.appendChild(
        el('a', { href: evidence, target: '_blank', rel: 'noopener', text: 'Abrir evidencia' }),
      );
    }
  }
  return wrapper.children.length ? wrapper : null;
}

function reviewItem(review) {
  return el(
    'div',
    { class: 'review-item' },
    el(
      'div',
      { class: 'review-item__top' },
      el('span', { class: 'review-item__student', text: review.student }),
      staticStars(review.rating, { size: 12 }),
    ),
    el('p', { class: 'review-item__text', text: review.text }),
    el('div', { class: 'review-item__meta', text: relativeTime(review.createdAt || review.when) }),
    renderEvidence(review.evidence),
  );
}

function teacherCard(teacher) {
  const stats = teacherStats(teacher);
  const isExpanded = expanded.has(teacher.id);
  const visibleReviews = isExpanded ? stats.reviews : stats.reviews.slice(0, 2);
  const photo = teacher.photo;

  const photoNode = photo
    ? el('img', { src: photo, alt: `Foto de ${teacher.name}`, loading: 'lazy' })
    : el('span', { class: 'avatar avatar--xl', text: initials(teacher.name) || 'P' });

  const reviewsNode = stats.count
    ? el(
        'div',
        { class: 'teacher-card__reviews' },
        ...visibleReviews.map(reviewItem),
        stats.count > 2
          ? el('button', {
              class: 'btn btn--link',
              type: 'button',
              text: isExpanded ? 'Mostrar menos' : `Ver las ${stats.count} opiniones`,
              on: {
                click: () => {
                  if (isExpanded) expanded.delete(teacher.id);
                  else expanded.add(teacher.id);
                  renderList();
                },
              },
            })
          : null,
      )
    : el('p', {
        class: 'teacher-empty-reviews',
        text: 'Todavía no tiene opiniones. Sé la primera persona en calificarlo.',
      });

  return el(
    'article',
    { class: 'teacher-card', dataset: { id: teacher.id } },
    el('div', { class: 'teacher-card__photo' }, photoNode),
    el(
      'div',
      { class: 'teacher-card__body' },
      el(
        'div',
        { class: 'teacher-card__top' },
        el(
          'div',
          {},
          el('h2', { class: 'teacher-card__name', text: teacher.name }),
          el('p', {
            class: 'teacher-card__subject',
            text: teacher.subject || 'Asignatura no especificada',
          }),
        ),
        el(
          'div',
          { class: 'teacher-card__rating' },
          el(
            'div',
            { class: 'teacher-card__score' },
            el('span', { text: stats.average.toFixed(1) }),
            el('small', { text: '★' }),
          ),
          ratingSummary(stats.average, stats.count),
        ),
      ),
      el(
        'div',
        { class: 'meta-list' },
        el(
          'span',
          { class: 'meta-list__item' },
          el('span', { html: icon('star', { size: 13 }) }),
          `${stats.total} puntos acumulados`,
        ),
        el(
          'span',
          { class: 'meta-list__item' },
          el('span', { html: icon('users', { size: 13 }) }),
          `${stats.count} ${stats.count === 1 ? 'calificación' : 'calificaciones'}`,
        ),
      ),
      reviewsNode,
    ),
    el(
      'div',
      { class: 'teacher-card__actions' },
      el('button', {
        class: 'btn btn--primary btn--sm',
        type: 'button',
        html: `${icon('star', { size: 14 })}<span>Calificar</span>`,
        on: { click: () => openReviewModal(teacher) },
      }),
      el('button', {
        class: 'btn btn--danger-soft btn--sm',
        type: 'button',
        html: `${icon('trash', { size: 14 })}<span>Eliminar</span>`,
        on: { click: () => deleteTeacher(teacher) },
      }),
    ),
  );
}

function renderSummary() {
  const summary = qs('#teachers-summary');
  if (!summary) return;
  const totalReviews = teachers.reduce((sum, teacher) => sum + teacherStats(teacher).count, 0);
  const rated = teachers.filter((teacher) => teacherStats(teacher).count > 0);
  const general = rated.length
    ? rated.reduce((sum, teacher) => sum + teacherStats(teacher).average, 0) / rated.length
    : 0;

  summary.replaceChildren(
    el(
      'article',
      { class: 'stat-card' },
      el('span', { class: 'stat-card__icon', html: icon('users', { size: 20 }) }),
      el(
        'div',
        { class: 'stat-card__body' },
        el('span', { class: 'stat-card__label', text: 'Profesores en el directorio' }),
        el('strong', { class: 'stat-card__value', text: String(teachers.length) }),
        el('span', { class: 'stat-card__hint', text: 'Comunidad docente' }),
      ),
    ),
    el(
      'article',
      { class: 'stat-card' },
      el('span', {
        class: 'stat-card__icon stat-card__icon--warning',
        html: icon('star', { size: 20 }),
      }),
      el(
        'div',
        { class: 'stat-card__body' },
        el('span', { class: 'stat-card__label', text: 'Promedio de valoraciones' }),
        el('strong', { class: 'stat-card__value', text: general ? general.toFixed(1) : '—' }),
        el('span', { class: 'stat-card__hint', text: 'Sobre 5 estrellas' }),
      ),
    ),
    el(
      'article',
      { class: 'stat-card' },
      el('span', {
        class: 'stat-card__icon stat-card__icon--success',
        html: icon('checkCircle', { size: 20 }),
      }),
      el(
        'div',
        { class: 'stat-card__body' },
        el('span', { class: 'stat-card__label', text: 'Opiniones publicadas' }),
        el('strong', { class: 'stat-card__value', text: String(totalReviews) }),
        el('span', { class: 'stat-card__hint', text: 'Aportes de la comunidad' }),
      ),
    ),
  );
}

function renderList() {
  const list = qs('#teachers-list');
  if (!list) return;
  const visible = filteredTeachers();

  if (!visible.length) {
    list.replaceChildren(
      emptyState({
        iconName: 'teachers',
        title: teachers.length ? 'No hay coincidencias' : 'Directorio vacío',
        text: teachers.length
          ? 'Prueba con otro nombre, asignatura o criterio de orden.'
          : 'Agrega al primer profesor para comenzar a recibir opiniones.',
        action: teachers.length
          ? el('button', {
              class: 'btn btn--ghost',
              type: 'button',
              text: 'Limpiar filtros',
              on: { click: resetFilters },
            })
          : el('button', {
              class: 'btn btn--primary',
              type: 'button',
              html: `${icon('userPlus', { size: 16 })}<span>Agregar profesor</span>`,
              on: { click: openAddTeacherModal },
            }),
      }),
    );
    return;
  }

  list.replaceChildren(...visible.map(teacherCard));
}

function renderAll() {
  renderSummary();
  renderList();
}

function resetFilters() {
  filters = { query: '', subject: 'all', sort: 'rating' };
  const search = qs('#teachers-search');
  const subject = qs('#teachers-subject');
  const sort = qs('#teachers-sort');
  if (search) search.value = '';
  if (subject) subject.value = 'all';
  if (sort) sort.value = 'rating';
  renderList();
}

async function deleteTeacher(teacher) {
  const confirmed = await confirmDialog({
    title: 'Eliminar profesor',
    message: `Se eliminará a ${teacher.name} y todas sus opiniones del directorio.`,
    confirmLabel: 'Eliminar profesor',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await teachersRepo.remove(teacher.id);
    teachers = teachers.filter((item) => item.id !== teacher.id);
    renderAll();
    toast.success('Profesor eliminado del directorio.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar al profesor.', error);
    toast.error(error.message || 'No se pudo eliminar al profesor.');
  }
}

function openAddTeacherModal() {
  const nameInput = el('input', {
    class: 'input',
    id: 'teacher-name',
    placeholder: 'Ej: Prof. Ana Pérez',
    required: true,
  });
  const subjectInput = el('input', {
    class: 'input',
    id: 'teacher-subject',
    placeholder: 'Ej: Física',
    list: 'teacher-subject-suggestions',
  });
  const suggestions = el(
    'datalist',
    { id: 'teacher-subject-suggestions' },
    ...SUBJECTS.map((subject) => el('option', { value: subject })),
  );

  const photoPicker = createFilePicker({
    label: 'Foto del profesor',
    accept: 'image/*',
    maxSizeLabel: 'Máx. 4 MB',
    examples: EXAMPLE_AVATARS,
    examplesLabel: 'O elige un avatar de ejemplo:',
  });

  const form = el(
    'form',
    { class: 'form', id: 'teacher-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Nombre del profesor',
          attrs: { for: 'teacher-name' },
        }),
        nameInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Asignatura',
          attrs: { for: 'teacher-subject' },
        }),
        subjectInput,
        suggestions,
      ),
    ),
    photoPicker.field,
    el(
      'div',
      { class: 'lostfound-note' },
      el('span', { html: icon('info', { size: 15 }) }),
      el('span', {
        text: 'Las opiniones son responsabilidad de quienes las publican. Mantén un trato respetuoso.',
      }),
    ),
  );

  const modal = openModal({
    title: 'Agregar profesor',
    eyebrow: 'Directorio docente',
    description: 'Añade un profesor para que la comunidad pueda valorar su trabajo.',
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
        text: 'Agregar profesor',
        attrs: { form: 'teacher-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const subject = subjectInput.value.trim();
    if (!name) {
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      toast.warning('Escribe el nombre del profesor.');
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
      const created = await teachersRepo.create({
        name,
        subject,
        photo: photo || photoPicker.getExample() || null,
        reviews: [],
      });
      teachers = [created, ...teachers];
      modal.close();
      renderAll();
      toast.success(`${name} agregado/a al directorio.`);
    } catch (error) {
      console.error('[IntraNerd] No se pudo agregar al profesor.', error);
      toast.error(error.message || 'No se pudo agregar al profesor.');
      submitButton.disabled = false;
      submitButton.textContent = 'Agregar profesor';
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

function openReviewModal(preselected = null) {
  if (!teachers.length) {
    toast.warning('Agrega un profesor antes de publicar una opinión.');
    return;
  }

  const profile = getProfile();
  const studentInput = el('input', {
    class: 'input',
    id: 'review-student',
    placeholder: 'Tu nombre',
    value: profile.name === 'Visitante' ? '' : profile.name,
    required: true,
  });

  const teacherSelect = el(
    'select',
    { class: 'select', id: 'review-teacher', required: true },
    ...teachers.map((teacher) =>
      el('option', {
        value: teacher.id,
        text: `${teacher.name}${teacher.subject ? ` · ${teacher.subject}` : ''}`,
        selected: preselected?.id === teacher.id,
      }),
    ),
  );

  let rating = 0;
  const starField = createStarRating({
    value: 0,
    label: 'Calificación de 1 a 5 estrellas',
    onChange: (value) => {
      rating = value;
      ratingHint.textContent = `${value} de 5 estrellas`;
    },
  });
  const ratingHint = el('span', {
    class: 'star-rating-field__hint',
    text: 'Selecciona de 1 a 5 estrellas.',
  });

  const opinionInput = el('textarea', {
    class: 'textarea',
    id: 'review-opinion',
    placeholder: 'Cuenta tu experiencia: claridad, trato, metodología…',
    required: true,
  });

  const evidencePicker = createFilePicker({
    label: 'Evidencia',
    accept: 'image/*,video/*,application/pdf',
    maxSizeLabel: 'Máx. 4 MB',
    hint: 'Imagen, video corto o PDF. Se guarda junto a tu opinión.',
  });

  const form = el(
    'form',
    { class: 'form', id: 'review-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Tu nombre', attrs: { for: 'review-student' } }),
        studentInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Profesor', attrs: { for: 'review-teacher' } }),
        teacherSelect,
      ),
    ),
    el(
      'div',
      { class: 'star-rating-field' },
      el('span', { class: 'star-rating-field__legend', text: 'Calificación' }),
      starField,
      ratingHint,
    ),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', text: 'Opinión', attrs: { for: 'review-opinion' } }),
      opinionInput,
    ),
    evidencePicker.field,
  );

  const modal = openModal({
    title: 'Escribir opinión',
    eyebrow: 'Calificador de profesores',
    description: 'Comparte una valoración respetuosa y, si quieres, adjunta evidencia.',
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
        text: 'Publicar opinión',
        attrs: { form: 'review-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const student = studentInput.value.trim();
    const text = opinionInput.value.trim();
    const teacherId = teacherSelect.value;

    if (!student || !text || rating < 1) {
      if (rating < 1) ratingHint.textContent = 'Selecciona una calificación de 1 a 5 estrellas.';
      if (!student) studentInput.setAttribute('aria-invalid', 'true');
      if (!text) opinionInput.setAttribute('aria-invalid', 'true');
      toast.warning('Completa tu nombre, la opinión y la calificación.');
      return;
    }

    const teacher = teachers.find((item) => item.id === teacherId);
    if (!teacher) {
      toast.error('El profesor seleccionado ya no existe.');
      return;
    }

    const submitButton = qs('button[type="submit"]', modal.element);
    submitButton.disabled = true;
    submitButton.textContent = 'Publicando…';

    try {
      const file = evidencePicker.getFile();
      const evidence = file
        ? await prepareUpload(file, { maxSize: 4 * 1024 * 1024, accept: '' })
        : null;
      const review = {
        id: `review_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        student,
        rating,
        text,
        evidence,
        createdAt: new Date().toISOString(),
      };
      const updated = await teachersRepo.update(teacher.id, {
        reviews: [review, ...(teacher.reviews || [])],
      });
      teachers = teachers.map((item) => (item.id === teacher.id ? { ...item, ...updated } : item));
      modal.close();
      renderAll();
      toast.success('Opinión publicada. ¡Gracias por aportar!');
    } catch (error) {
      console.error('[IntraNerd] No se pudo publicar la opinión.', error);
      toast.error(error.message || 'No se pudo publicar la opinión.');
      submitButton.disabled = false;
      submitButton.textContent = 'Publicar opinión';
    }
  });

  requestAnimationFrame(() => studentInput.focus());
}

function bindToolbar() {
  const search = qs('#teachers-search');
  const subject = qs('#teachers-subject');
  const sort = qs('#teachers-sort');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderList();
  });
  subject?.addEventListener('change', () => {
    filters.subject = subject.value;
    renderList();
  });
  sort?.addEventListener('change', () => {
    filters.sort = sort.value;
    renderList();
  });
}

function renderSubjectFilter() {
  const select = qs('#teachers-subject');
  if (!select) return;
  const current = filters.subject;
  select.replaceChildren(
    el('option', { value: 'all', text: 'Todas las asignaturas', selected: current === 'all' }),
    ...subjectOptions().map((subject) =>
      el('option', {
        value: subject,
        text: subject,
        selected: current === subject,
      }),
    ),
  );
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Comunidad',
      title: 'Calificador y reseñas de profesores',
      description:
        'Un directorio abierto para reconocer buenas prácticas, compartir experiencias ' +
        'y mejorar la convivencia escolar.',
      actions: [
        el('button', {
          class: 'btn btn--ghost',
          type: 'button',
          html: `${icon('star', { size: 16 })}<span>Escribir opinión</span>`,
          on: { click: () => openReviewModal() },
        }),
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('userPlus', { size: 16 })}<span>Agregar profesor</span>`,
          on: { click: openAddTeacherModal },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'teachers-summary', class: 'grid-3' }, skeletonRows(1)),
      el(
        'div',
        { class: 'toolbar' },
        el('input', {
          class: 'input input--search toolbar__search',
          id: 'teachers-search',
          type: 'search',
          placeholder: 'Buscar profesor o asignatura…',
          attrs: { 'aria-label': 'Buscar profesores' },
        }),
        el(
          'select',
          {
            class: 'select',
            id: 'teachers-subject',
            attrs: { 'aria-label': 'Filtrar por asignatura' },
          },
          el('option', { value: 'all', text: 'Todas las asignaturas' }),
        ),
        el(
          'select',
          { class: 'select', id: 'teachers-sort', attrs: { 'aria-label': 'Ordenar profesores' } },
          el('option', { value: 'rating', text: 'Mejor valorados' }),
          el('option', { value: 'recent', text: 'Más recientes' }),
          el('option', { value: 'name', text: 'Nombre A-Z' }),
        ),
      ),
      el('div', { id: 'teachers-list', class: 'teacher-list' }, skeletonRows(3)),
    ),
  );

  bindToolbar();

  try {
    teachers = await teachersRepo.list();
    renderSubjectFilter();
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar profesores.', error);
    toast.error('No fue posible cargar el directorio de profesores.');
    qs('#teachers-list')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar el directorio',
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
