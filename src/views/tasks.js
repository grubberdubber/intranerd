import { PRIORITIES, SUBJECTS } from '../data/constants.js';
import { tasksRepo } from '../services/resources.js';
import { getProfile } from '../services/session.js';
import { el, qs } from '../utils/dom.js';
import { daysUntil, formatDate, toISODate } from '../utils/format.js';
import { icon } from '../components/icon.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let tasks = [];
let filters = { query: '', subject: 'all', status: 'pending' };

const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((priority) => [priority.id, priority]));
const PRIORITY_DOT = {
  alta: 'priority-dot--high',
  media: 'priority-dot--medium',
  baja: 'priority-dot--low',
};

function priorityOf(task) {
  return PRIORITY_MAP[task.priority] || PRIORITY_MAP.media;
}

function isOverdue(task) {
  if (task.completed) return false;
  const diff = daysUntil(task.dueDate);
  return diff !== null && diff < 0;
}

function dueLabel(task) {
  const diff = daysUntil(task.dueDate);
  if (diff === null) return 'Sin fecha';
  if (task.completed) return `Entregada · ${formatDate(task.dueDate)}`;
  if (diff < 0) return `Atrasada ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'día' : 'días'}`;
  if (diff === 0) return 'Vence hoy';
  if (diff === 1) return 'Vence mañana';
  return `Vence en ${diff} días`;
}

function filteredTasks() {
  const query = filters.query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.status === 'pending' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;
    if (filters.status === 'overdue' && !isOverdue(task)) return false;
    if (filters.subject !== 'all' && task.subject !== filters.subject) return false;
    if (!query) return true;
    return [task.title, task.description, task.subject, task.author].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(query),
    );
  });
}

function subjectOptions() {
  return Array.from(new Set(tasks.map((task) => task.subject).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
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

function taskItem(task) {
  const priority = priorityOf(task);
  const overdue = isOverdue(task);
  const checkbox = el('input', {
    type: 'checkbox',
    checked: Boolean(task.completed),
    attrs: {
      'aria-label': `Marcar "${task.title}" como ${task.completed ? 'pendiente' : 'completada'}`,
    },
    on: { change: () => toggleTask(task, checkbox) },
  });

  return el(
    'article',
    {
      class: `task-item${task.completed ? ' is-completed' : ''}${overdue ? ' is-overdue' : ''}`,
      dataset: { id: task.id },
    },
    el(
      'label',
      { class: 'task-check' },
      checkbox,
      el('span', { class: 'task-check__box', html: icon('check', { size: 13, strokeWidth: 3 }) }),
    ),
    el(
      'div',
      { class: 'task-item__body' },
      el('span', { class: 'task-item__title', text: task.title }),
      task.description
        ? el('span', { class: 'task-item__description', text: task.description })
        : null,
      el(
        'span',
        { class: 'task-item__meta' },
        el(
          'span',
          {},
          el('span', { class: `priority-dot ${PRIORITY_DOT[task.priority] || ''}` }),
          priority.label,
        ),
        el('span', {}, el('span', { html: icon('calendar', { size: 12 }) }), dueLabel(task)),
        el(
          'span',
          {},
          el('span', { html: icon('user', { size: 12 }) }),
          task.author || 'Profesor/a',
        ),
      ),
    ),
    el(
      'div',
      { class: 'task-item__actions' },
      el('button', {
        class: 'icon-btn icon-btn--danger',
        type: 'button',
        attrs: { 'aria-label': `Eliminar tarea "${task.title}"` },
        html: icon('trash', { size: 15 }),
        on: { click: () => deleteTask(task) },
      }),
    ),
  );
}

function renderSummary() {
  const summary = qs('#tasks-summary');
  if (!summary) return;

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(isOverdue).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const progressCard = el(
    'article',
    { class: 'stat-card' },
    el('span', {
      class: `stat-card__icon${percentage === 100 ? ' stat-card__icon--success' : ''}`,
      html: icon('clipboard', { size: 20 }),
    }),
    el(
      'div',
      { class: 'stat-card__body' },
      el('span', { class: 'stat-card__label', text: 'Avance del checklist' }),
      el('strong', { class: 'stat-card__value', text: `${percentage}%` }),
      el(
        'div',
        { class: 'tasks-progress mt-2' },
        el(
          'div',
          { class: 'tasks-progress__track' },
          el('span', { class: 'tasks-progress__fill', cssVar: { '--progress': `${percentage}%` } }),
        ),
      ),
    ),
  );

  summary.replaceChildren(
    progressCard,
    statCard({
      iconName: 'clock',
      label: 'Tareas pendientes',
      value: String(pending),
      hint: `${completed} completadas de ${total}`,
      tone: pending ? 'warning' : 'success',
    }),
    statCard({
      iconName: 'alert',
      label: 'Tareas atrasadas',
      value: String(overdue),
      hint: overdue ? 'Prioriza estas entregas' : 'Sin entregas atrasadas',
      tone: overdue ? 'danger' : 'success',
    }),
  );
}

function renderList() {
  const list = qs('#tasks-list');
  if (!list) return;
  const visible = filteredTasks();

  if (!visible.length) {
    list.replaceChildren(
      emptyState({
        iconName: 'tasks',
        title: tasks.length ? 'No hay tareas en esta vista' : 'Aún no hay tareas',
        text: tasks.length
          ? 'Cambia el filtro de estado, asignatura o búsqueda.'
          : 'Publica la primera tarea para que los alumnos organicen sus deberes.',
        action: tasks.length
          ? el('button', {
              class: 'btn btn--ghost',
              type: 'button',
              text: 'Limpiar filtros',
              on: { click: resetFilters },
            })
          : el('button', {
              class: 'btn btn--primary',
              type: 'button',
              html: `${icon('plus', { size: 16 })}<span>Nueva tarea</span>`,
              on: { click: openTaskModal },
            }),
      }),
    );
    return;
  }

  const groups = new Map();
  visible.forEach((task) => {
    const key = task.subject || 'Sin asignatura';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });

  const orderedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'es'));
  const groupNodes = orderedKeys.map((subject) => {
    const groupTasks = groups
      .get(subject)
      .slice()
      .sort(
        (a, b) =>
          Number(a.completed) - Number(b.completed) ||
          String(a.dueDate).localeCompare(String(b.dueDate)),
      );

    return el(
      'section',
      { class: 'task-subject-group' },
      el(
        'header',
        { class: 'task-subject-group__header' },
        el('span', { text: subject }),
        el('span', {
          class: 'badge',
          text: `${groupTasks.filter((task) => !task.completed).length} pendientes`,
        }),
      ),
      el('div', { class: 'task-list' }, ...groupTasks.map(taskItem)),
    );
  });

  list.replaceChildren(...groupNodes);
}

function renderAll() {
  renderSummary();
  renderList();
}

function renderSubjectFilter() {
  const select = qs('#tasks-subject');
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

function resetFilters() {
  filters = { query: '', subject: 'all', status: 'pending' };
  const search = qs('#tasks-search');
  const subject = qs('#tasks-subject');
  const status = qs('#tasks-status');
  if (search) search.value = '';
  if (subject) subject.value = 'all';
  if (status) status.value = 'pending';
  renderList();
}

async function toggleTask(task, checkbox) {
  const nextCompleted = checkbox.checked;
  try {
    const updated = await tasksRepo.update(task.id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    });
    tasks = tasks.map((item) => (item.id === task.id ? { ...item, ...updated } : item));
    renderAll();
    toast.success(
      nextCompleted
        ? `"${task.title}" marcada como completada.`
        : `"${task.title}" vuelve a pendientes.`,
    );
  } catch (error) {
    checkbox.checked = !nextCompleted;
    console.error('[IntraNerd] No se pudo actualizar la tarea.', error);
    toast.error(error.message || 'No se pudo actualizar la tarea.');
  }
}

async function deleteTask(task) {
  const confirmed = await confirmDialog({
    title: 'Eliminar tarea',
    message: `Se eliminará "${task.title}" del checklist. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar tarea',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await tasksRepo.remove(task.id);
    tasks = tasks.filter((item) => item.id !== task.id);
    renderAll();
    toast.success('Tarea eliminada.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar la tarea.', error);
    toast.error(error.message || 'No se pudo eliminar la tarea.');
  }
}

function openTaskModal() {
  const profile = getProfile();
  const titleInput = el('input', {
    class: 'input',
    id: 'task-title',
    placeholder: 'Ej: Guía de ecuaciones de primer grado',
    required: true,
  });
  const subjectInput = el('input', {
    class: 'input',
    id: 'task-subject-input',
    placeholder: 'Ej: Matemáticas',
    list: 'task-subject-suggestions',
    required: true,
  });
  const suggestions = el(
    'datalist',
    { id: 'task-subject-suggestions' },
    ...SUBJECTS.map((subject) => el('option', { value: subject })),
  );
  const dueInput = el('input', {
    class: 'input',
    id: 'task-due',
    type: 'date',
    value: toISODate(),
    required: true,
  });
  const prioritySelect = el(
    'select',
    { class: 'select', id: 'task-priority' },
    ...PRIORITIES.map((priority) =>
      el('option', {
        value: priority.id,
        text: priority.label,
        selected: priority.id === 'media',
      }),
    ),
  );
  const authorInput = el('input', {
    class: 'input',
    id: 'task-author',
    placeholder: 'Ej: Prof. Moya',
    value: profile.name === 'Visitante' ? '' : profile.name,
    required: true,
  });
  const descriptionInput = el('textarea', {
    class: 'textarea',
    id: 'task-description',
    rows: '4',
    placeholder: 'Instrucciones, materiales y criterios de entrega.',
    required: true,
  });

  const form = el(
    'form',
    { class: 'form', id: 'task-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Título de la tarea',
          attrs: { for: 'task-title' },
        }),
        titleInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Asignatura',
          attrs: { for: 'task-subject-input' },
        }),
        subjectInput,
        suggestions,
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
          text: 'Fecha de entrega',
          attrs: { for: 'task-due' },
        }),
        dueInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', text: 'Prioridad', attrs: { for: 'task-priority' } }),
        prioritySelect,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Profesor/a que la asigna',
        attrs: { for: 'task-author' },
      }),
      authorInput,
    ),
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Descripción e instrucciones',
        attrs: { for: 'task-description' },
      }),
      descriptionInput,
    ),
  );

  const modal = openModal({
    title: 'Nueva tarea',
    eyebrow: 'Tareas y deberes',
    description: 'Publica un deber para que los alumnos lo marquen en su checklist personal.',
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
        text: 'Publicar tarea',
        attrs: { form: 'task-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const subject = subjectInput.value.trim();
    const dueDate = dueInput.value;
    const author = authorInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title || !subject || !dueDate || !author || !description) {
      toast.warning('Completa el título, la asignatura, la fecha, el autor y la descripción.');
      return;
    }

    const submitButton = qs('button[type="submit"]', modal.element);
    submitButton.disabled = true;
    submitButton.textContent = 'Publicando…';

    try {
      const created = await tasksRepo.create({
        title,
        subject,
        description,
        dueDate,
        priority: prioritySelect.value,
        author,
        completed: false,
        completedAt: null,
      });
      tasks = [created, ...tasks];
      modal.close();
      renderSubjectFilter();
      renderAll();
      toast.success('Tarea publicada.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo publicar la tarea.', error);
      toast.error(error.message || 'No se pudo publicar la tarea.');
      submitButton.disabled = false;
      submitButton.textContent = 'Publicar tarea';
    }
  });

  requestAnimationFrame(() => titleInput.focus());
}

function bindToolbar() {
  const search = qs('#tasks-search');
  const subject = qs('#tasks-subject');
  const status = qs('#tasks-status');

  search?.addEventListener('input', () => {
    filters.query = search.value;
    renderList();
  });
  subject?.addEventListener('change', () => {
    filters.subject = subject.value;
    renderList();
  });
  status?.addEventListener('change', () => {
    filters.status = status.value;
    renderList();
  });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Organización',
      title: 'Tareas y deberes',
      description:
        'Publica deberes por asignatura y marca tu avance en un checklist personal que se guarda en este navegador.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Nueva tarea</span>`,
          on: { click: openTaskModal },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack' },
      el('div', { id: 'tasks-summary', class: 'tasks-summary' }, skeletonRows(1)),
      el(
        'div',
        { class: 'toolbar' },
        el('input', {
          class: 'input input--search toolbar__search',
          id: 'tasks-search',
          type: 'search',
          placeholder: 'Buscar tarea, asignatura o profesor…',
          attrs: { 'aria-label': 'Buscar tareas' },
        }),
        el(
          'select',
          {
            class: 'select',
            id: 'tasks-subject',
            attrs: { 'aria-label': 'Filtrar por asignatura' },
          },
          el('option', { value: 'all', text: 'Todas las asignaturas' }),
        ),
        el(
          'select',
          { class: 'select', id: 'tasks-status', attrs: { 'aria-label': 'Filtrar por estado' } },
          el('option', { value: 'pending', text: 'Pendientes' }),
          el('option', { value: 'completed', text: 'Completadas' }),
          el('option', { value: 'overdue', text: 'Atrasadas' }),
          el('option', { value: 'all', text: 'Todas' }),
        ),
      ),
      el('div', { id: 'tasks-list' }, skeletonRows(4)),
    ),
  );

  bindToolbar();

  try {
    tasks = await tasksRepo.list();
    renderSubjectFilter();
    renderAll();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar tareas.', error);
    toast.error('No fue posible cargar las tareas.');
    qs('#tasks-list')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar las tareas',
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
