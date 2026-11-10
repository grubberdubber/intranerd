import { HOLIDAYS, SUBJECTS } from '../data/constants.js';
import { calendarRepo } from '../services/resources.js';
import { getProfile, saveProfile } from '../services/session.js';
import { bindFieldErrorClearing, el, qs, qsa, setFieldError } from '../utils/dom.js';
import {
  MONTHS,
  WEEKDAYS,
  daysInMonth,
  formatLongDate,
  isSameDay,
  toDate,
  toISODate,
  weekdayIndexMonday,
} from '../utils/format.js';
import { icon } from '../components/icon.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonCards } from '../components/states.js';
import { toast } from '../components/toast.js';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

let events = [];
let currentYear = new Date().getFullYear();
// Fecha que conserva el único tab stop de la cuadrícula (roving tabindex).
let focusDate = toISODate(new Date());
let profile = getProfile();

function isHoliday(date) {
  const value = toDate(date);
  return (HOLIDAYS[value.getMonth() + 1] || []).includes(value.getDate());
}

function eventsForDate(dateISO) {
  return events
    .filter((event) => event.date === dateISO)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function eventAuthorText(event) {
  const subject = event.subject ? `${event.subject} · ` : '';
  const role = event.role === 'profesor' ? 'profesor/a' : 'alumno/a';
  return `${subject}Publicado por ${role}: ${event.author}`;
}

/** Fecha que debe tener el tabindex="0"; siempre dentro del año visible. */
function tabStopDate() {
  return focusDate.startsWith(`${currentYear}-`) ? focusDate : `${currentYear}-01-01`;
}

function focusDay(dateISO) {
  const grid = qs('#calendar-grid');
  if (!grid) return false;
  const target = qs(`[data-date="${dateISO}"]`, grid);
  if (!target) return false;
  qsa('.day-cell[data-date]', grid).forEach((cell) => {
    cell.tabIndex = cell === target ? 0 : -1;
  });
  target.focus();
  return true;
}

function announce(message) {
  const live = qs('#calendar-live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => {
    live.textContent = message;
  });
}

function addDays(dateISO, amount) {
  const date = toDate(dateISO);
  date.setDate(date.getDate() + amount);
  return date;
}

function addMonths(dateISO, amount) {
  const date = toDate(dateISO);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  date.setDate(Math.min(day, daysInMonth(date.getFullYear(), date.getMonth())));
  return date;
}

function monthCard(year, monthIndex) {
  const monthId = `calendar-month-${year}-${monthIndex + 1}`;
  const card = el('article', {
    class: 'month-card',
    attrs: { 'aria-labelledby': monthId },
  });
  const title = el('h2', {
    class: 'month-card__title',
    id: monthId,
    text: `${MONTHS[monthIndex]} ${year}`,
  });
  const weekdays = el(
    'div',
    { class: 'month-card__weekdays', attrs: { 'aria-hidden': 'true' } },
    ...WEEKDAYS.map((day) => el('span', { class: 'month-card__weekday', text: day })),
  );
  const days = el('div', { class: 'month-card__days' });

  const firstWeekday = weekdayIndexMonday(new Date(year, monthIndex, 1));
  for (let emptyIndex = 0; emptyIndex < firstWeekday; emptyIndex += 1) {
    days.appendChild(
      el('span', { class: 'day-cell day-cell--empty', attrs: { 'aria-hidden': 'true' } }),
    );
  }

  const totalDays = daysInMonth(year, monthIndex);
  const today = new Date();
  const activeTabStop = tabStopDate();

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dateISO = toISODate(date);
    const dayEvents = eventsForDate(dateISO);
    const holiday = isHoliday(date);
    const isToday = isSameDay(date, today);
    const classNames = [
      'day-cell',
      holiday ? 'day-cell--holiday' : '',
      isToday ? 'day-cell--today' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const eventSummary = dayEvents.length
      ? `${dayEvents.length} ${dayEvents.length === 1 ? 'prueba' : 'pruebas'}: ` +
        dayEvents.map((event) => event.title).join('; ')
      : 'Sin pruebas';
    const dayLabel = [
      isToday ? `Hoy, ${formatLongDate(date)}` : formatLongDate(date),
      holiday ? 'Feriado' : '',
      eventSummary,
    ]
      .filter(Boolean)
      .join('. ');

    const cell = el(
      'button',
      {
        class: classNames,
        type: 'button',
        dataset: { date: dateISO },
        attrs: {
          'aria-label': `${dayLabel}.`,
          ...(isToday ? { 'aria-current': 'date' } : {}),
        },
        tabIndex: dateISO === activeTabStop ? 0 : -1,
        on: {
          click: () => {
            focusDate = dateISO;
            openDayModal(dateISO);
          },
        },
      },
      el('span', {
        class: 'day-cell__number',
        text: String(day),
        attrs: { 'aria-hidden': 'true' },
      }),
      holiday
        ? el('span', {
            class: 'day-cell__holiday',
            text: 'Feriado',
            attrs: { 'aria-hidden': 'true' },
          })
        : null,
      dayEvents.length
        ? el(
            'span',
            { class: 'day-cell__events', attrs: { 'aria-hidden': 'true' } },
            ...dayEvents
              .slice(0, 2)
              .map((event) => el('span', { class: 'day-event', text: event.title })),
            dayEvents.length > 2
              ? el('span', { class: 'day-cell__more', text: `+${dayEvents.length - 2} más` })
              : null,
          )
        : null,
    );

    days.appendChild(cell);
  }

  card.append(title, weekdays, days);
  return card;
}

function renderCalendar() {
  const grid = qs('#calendar-grid');
  if (!grid) return;

  const cards = [];
  for (let month = 0; month < 12; month += 1) cards.push(monthCard(currentYear, month));
  grid.replaceChildren(...cards);
  grid.setAttribute('aria-label', `Calendario escolar del año ${currentYear}`);

  const yearLabel = qs('#calendar-year-value');
  if (yearLabel) yearLabel.textContent = String(currentYear);
  const yearInput = qs('#calendar-year-input');
  if (yearInput) yearInput.value = String(currentYear);
}

function setYear(nextYear, { moveFocus = false, message = '' } = {}) {
  const previousYear = currentYear;
  currentYear = Math.min(MAX_YEAR, Math.max(MIN_YEAR, Number(nextYear) || currentYear));

  if (!focusDate.startsWith(`${currentYear}-`)) {
    const today = new Date();
    focusDate = today.getFullYear() === currentYear ? toISODate(today) : `${currentYear}-01-01`;
  }

  renderCalendar();

  if (moveFocus) focusDay(focusDate);
  if (message) announce(message);
  else if (previousYear !== currentYear) announce(`Año ${currentYear}`);
}

/** Navegación por teclado con un único tab stop (patrón roving tabindex). */
function handleGridKeydown(event) {
  const cell = event.target.closest?.('.day-cell[data-date]');
  if (!cell) return;

  const dateISO = cell.dataset.date;
  let target = null;

  switch (event.key) {
    case 'ArrowLeft':
      target = addDays(dateISO, -1);
      break;
    case 'ArrowRight':
      target = addDays(dateISO, 1);
      break;
    case 'ArrowUp':
      target = addDays(dateISO, -7);
      break;
    case 'ArrowDown':
      target = addDays(dateISO, 7);
      break;
    case 'Home': {
      const date = toDate(dateISO);
      target = addDays(dateISO, -weekdayIndexMonday(date));
      break;
    }
    case 'End': {
      const date = toDate(dateISO);
      target = addDays(dateISO, 6 - weekdayIndexMonday(date));
      break;
    }
    case 'PageUp':
      target = addMonths(dateISO, event.shiftKey ? -12 : -1);
      break;
    case 'PageDown':
      target = addMonths(dateISO, event.shiftKey ? 12 : 1);
      break;
    default:
      return;
  }

  const targetYear = target.getFullYear();
  if (targetYear < MIN_YEAR || targetYear > MAX_YEAR) return;

  event.preventDefault();
  focusDate = toISODate(target);
  if (targetYear !== currentYear) {
    setYear(targetYear, { moveFocus: true, message: `Año ${targetYear}` });
  } else {
    focusDay(focusDate);
  }
}

function openDayModal(dateISO) {
  const date = toDate(dateISO);
  const dayEvents = eventsForDate(dateISO);
  const holiday = isHoliday(date);

  const eventList = dayEvents.length
    ? el(
        'div',
        { class: 'day-events' },
        ...dayEvents.map((event) =>
          el(
            'div',
            { class: 'day-event-item' },
            el(
              'div',
              { class: 'day-event-item__body' },
              el('strong', { class: 'day-event-item__title', text: event.title }),
              event.description
                ? el('span', { class: 'day-event-item__desc', text: event.description })
                : null,
              el('span', {
                class: 'day-event-item__author',
                text: eventAuthorText(event),
              }),
            ),
            el('button', {
              class: 'icon-btn icon-btn--danger day-event-item__delete',
              type: 'button',
              attrs: {
                'aria-label': `Eliminar ${event.title} del ${formatLongDate(dateISO)}`,
              },
              html: icon('trash', { size: 15 }),
              on: { click: () => deleteEvent(event, modal, dateISO) },
            }),
          ),
        ),
      )
    : el('p', {
        class: 'calendar-empty',
        text: 'No hay pruebas ni evaluaciones programadas para este día.',
      });

  const titleInput = el('input', {
    class: 'input',
    id: 'event-title',
    placeholder: 'Ej: Prueba de Matemáticas',
    required: true,
    attrs: { 'aria-describedby': 'event-title-help' },
  });
  const subjectInput = el('input', {
    class: 'input',
    id: 'event-subject',
    placeholder: 'Ej: Matemáticas',
    list: 'event-subject-suggestions',
  });
  const subjectSuggestions = el(
    'datalist',
    { id: 'event-subject-suggestions' },
    ...SUBJECTS.map((subject) => el('option', { value: subject })),
  );
  const descriptionInput = el('textarea', {
    class: 'textarea',
    id: 'event-description',
    placeholder: 'Contenidos, materiales o indicaciones para la evaluación.',
  });

  const form = el(
    'form',
    { class: 'form', id: 'event-form' },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Título de la prueba',
          attrs: { for: 'event-title' },
        }),
        titleInput,
        el('span', {
          class: 'field__hint',
          id: 'event-title-help',
          text: 'Obligatorio. Se mostrará en la cuadrícula del día.',
        }),
      ),
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'event-subject' } },
          'Asignatura ',
          el('span', { class: 'field__optional', text: '(opcional)' }),
        ),
        subjectInput,
        subjectSuggestions,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el(
        'label',
        { class: 'field__label', attrs: { for: 'event-description' } },
        'Descripción ',
        el('span', { class: 'field__optional', text: '(opcional)' }),
      ),
      descriptionInput,
    ),
    el(
      'div',
      { class: 'btn-row' },
      el('button', {
        class: 'btn btn--primary',
        type: 'submit',
        html: `${icon('plus', { size: 15 })}<span>Programar prueba</span>`,
      }),
    ),
  );

  const body = el(
    'div',
    { class: 'stack' },
    holiday
      ? el(
          'div',
          { class: 'lostfound-note' },
          el('span', { html: icon('calendar', { size: 15 }), attrs: { 'aria-hidden': 'true' } }),
          el('span', {
            text:
              'Este día está marcado como feriado. Puedes programar una actividad, ' +
              'pero revisa antes el calendario escolar.',
          }),
        )
      : null,
    el('h3', { class: 'section__title', text: 'Pruebas de este día' }),
    eventList,
    el('hr', { class: 'divider' }),
    el('h3', { class: 'section__title', text: 'Agregar una prueba' }),
    form,
  );

  const modal = openModal({
    title: formatLongDate(date),
    eyebrow: 'Calendario escolar',
    description: holiday
      ? 'Día feriado en el calendario institucional.'
      : 'Revisa las evaluaciones y agrega nuevas actividades.',
    body,
    size: 'lg',
    footer: [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Cerrar',
        on: { click: () => modal.close() },
      }),
    ],
  });

  bindFieldErrorClearing(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const author = profile.name?.trim();

    if (!author || author === 'Visitante') {
      modal.close();
      const nameInput = qs('#calendar-name');
      setFieldError(
        nameInput,
        'Escribe tu nombre en la barra del calendario antes de programar una prueba.',
      );
      nameInput?.focus();
      return;
    }
    if (!title) {
      setFieldError(titleInput, 'Escribe un título para la prueba.');
      titleInput.focus();
      return;
    }

    const submitButton = qs('button[type="submit"]', form);
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando…';

    try {
      const created = await calendarRepo.create({
        date: dateISO,
        title,
        description: descriptionInput.value.trim(),
        subject: subjectInput.value.trim() || 'General',
        role: profile.role === 'profesor' ? 'profesor' : 'alumno',
        author,
      });
      events = [...events, created];
      modal.close();
      focusDate = dateISO;
      renderCalendar();
      focusDay(dateISO);
      toast.success('Prueba programada en el calendario.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo programar la prueba.', error);
      toast.error(error.message || 'No se pudo programar la prueba.');
      submitButton.disabled = false;
      submitButton.innerHTML = `${icon('plus', { size: 15 })}<span>Programar prueba</span>`;
    }
  });

  requestAnimationFrame(() => titleInput.focus());
}

async function deleteEvent(event, modal = null, dateISO = event.date) {
  const confirmed = await confirmDialog({
    title: 'Eliminar prueba',
    message: `Se eliminará "${event.title}" del calendario.`,
    confirmLabel: 'Eliminar prueba',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await calendarRepo.remove(event.id);
    events = events.filter((item) => item.id !== event.id);
    modal?.close();
    focusDate = dateISO;
    renderCalendar();
    focusDay(dateISO);
    toast.success('Prueba eliminada del calendario.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar la prueba.', error);
    toast.error(error.message || 'No se pudo eliminar la prueba.');
  }
}

function syncProfileFromToolbar() {
  const roleSelect = qs('#calendar-role');
  const nameInput = qs('#calendar-name');
  if (!roleSelect || !nameInput) return;

  roleSelect.value = profile.role === 'profesor' ? 'profesor' : 'alumno';
  nameInput.value = profile.name === 'Visitante' ? '' : profile.name;

  const persist = () => {
    const name = nameInput.value.trim();
    profile = saveProfile({
      name: name || 'Visitante',
      role: roleSelect.value,
    });
    nameInput.placeholder =
      roleSelect.value === 'profesor' ? 'Nombre del profesor/a' : 'Nombre del alumno/a';
  };

  roleSelect.addEventListener('change', () => {
    nameInput.placeholder =
      roleSelect.value === 'profesor' ? 'Nombre del profesor/a' : 'Nombre del alumno/a';
    persist();
  });
  nameInput.addEventListener('change', persist);
  nameInput.addEventListener('blur', persist);
}

function goToToday() {
  const today = new Date();
  focusDate = toISODate(today);
  setYear(today.getFullYear(), { moveFocus: true, message: `Hoy, ${formatLongDate(today)}` });
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Organización',
      title: 'Calendario de pruebas y evaluaciones',
      description:
        'Visualiza el año escolar completo, identifica feriados y programa evaluaciones con su contexto.',
    }),
    el(
      'div',
      { class: 'stack' },
      el(
        'div',
        { class: 'calendar-toolbar' },
        el(
          'div',
          { class: 'calendar-year' },
          el('button', {
            class: 'icon-btn',
            type: 'button',
            attrs: { 'aria-label': 'Año anterior' },
            html: icon('chevronLeft', { size: 18 }),
            on: { click: () => setYear(currentYear - 1) },
          }),
          el('span', {
            class: 'calendar-year__value',
            id: 'calendar-year-value',
            text: String(currentYear),
          }),
          el('button', {
            class: 'icon-btn',
            type: 'button',
            attrs: { 'aria-label': 'Año siguiente' },
            html: icon('chevronRight', { size: 18 }),
            on: { click: () => setYear(currentYear + 1) },
          }),
          el('input', {
            class: 'input',
            id: 'calendar-year-input',
            type: 'number',
            min: String(MIN_YEAR),
            max: String(MAX_YEAR),
            value: String(currentYear),
            attrs: {
              'aria-label': 'Escribir año',
              'aria-describedby': 'calendar-year-help',
            },
          }),
          el('span', {
            class: 'sr-only',
            id: 'calendar-year-help',
            text: `Entre ${MIN_YEAR} y ${MAX_YEAR}. Presiona Enter para aplicar el año.`,
          }),
          el('button', {
            class: 'btn btn--ghost btn--sm',
            type: 'button',
            text: 'Hoy',
            on: { click: goToToday },
          }),
        ),
        el(
          'div',
          { class: 'calendar-identity' },
          el(
            'select',
            { class: 'select', id: 'calendar-role', attrs: { 'aria-label': 'Rol del usuario' } },
            el('option', { value: 'alumno', text: 'Alumno/a' }),
            el('option', { value: 'profesor', text: 'Profesor/a' }),
          ),
          el(
            'div',
            { class: 'field calendar-identity__field' },
            el('label', {
              class: 'sr-only',
              text: 'Nombre del usuario',
              attrs: { for: 'calendar-name' },
            }),
            el('input', {
              class: 'input',
              id: 'calendar-name',
              placeholder: 'Tu nombre',
            }),
          ),
        ),
      ),
      el('span', {
        class: 'sr-only',
        id: 'calendar-live',
        attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
      }),
      el(
        'div',
        { class: 'calendar-legend' },
        el(
          'span',
          {},
          el('span', { class: 'legend-dot legend-dot--today', attrs: { 'aria-hidden': 'true' } }),
          'Hoy',
        ),
        el(
          'span',
          {},
          el('span', {
            class: 'legend-dot legend-dot--holiday',
            attrs: { 'aria-hidden': 'true' },
          }),
          'Feriado',
        ),
        el(
          'span',
          {},
          el('span', { class: 'legend-dot legend-dot--event', attrs: { 'aria-hidden': 'true' } }),
          'Con evaluaciones',
        ),
      ),
      el(
        'div',
        {
          id: 'calendar-grid',
          class: 'calendar-grid',
          attrs: { role: 'group', 'aria-label': `Calendario escolar del año ${currentYear}` },
          on: { keydown: handleGridKeydown },
        },
        skeletonCards(6),
      ),
    ),
  );

  syncProfileFromToolbar();
  const yearInput = qs('#calendar-year-input');
  yearInput?.addEventListener('change', () => setYear(yearInput.value));

  try {
    events = await calendarRepo.list();
    renderCalendar();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar el calendario.', error);
    toast.error('No fue posible cargar el calendario.');
    qs('#calendar-grid')?.replaceChildren(
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar el calendario',
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
