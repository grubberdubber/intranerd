import { SCHEDULE_DAYS, SUBJECTS } from '../data/constants.js';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  listScheduleBlocks,
  scheduleValidation,
  updateScheduleBlock,
} from '../services/schedule.js';
import { bindFieldErrorClearing, clearFieldErrors, el, setFieldError } from '../utils/dom.js';
import {
  blocksForDay,
  currentOrNextBlock,
  dayLabel,
  formatDayDate,
  formatDuration,
  formatScheduleWeek,
  formatTimeRange,
  isScheduleDayToday,
  scheduleWeekDates,
  weeklySummary,
} from '../utils/schedule.js';
import { icon } from '../components/icon.js';
import { confirmDialog, openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { toast } from '../components/toast.js';

/**
 * Módulo 12 · Horario semanal.
 *
 * El horario es personal: se guarda en localStorage y no se comparte con la
 * API. La vista permite crear, editar y eliminar bloques, evitando cruces de
 * horario y mostrando un resumen de la carga semanal.
 */

function summaryCard({ iconName, label, value, hint, tone = '' }) {
  return el(
    'article',
    { class: `schedule-kpi${tone ? ` schedule-kpi--${tone}` : ''}` },
    el('span', {
      class: 'schedule-kpi__icon',
      html: icon(iconName, { size: 19 }),
      attrs: { 'aria-hidden': 'true' },
    }),
    el(
      'div',
      { class: 'schedule-kpi__body' },
      el('span', { class: 'schedule-kpi__label', text: label }),
      el('strong', { class: 'schedule-kpi__value', text: value }),
      hint ? el('span', { class: 'schedule-kpi__hint', text: hint }) : null,
    ),
  );
}

function nextHint(next) {
  if (!next) return 'Agrega tu primer bloque para empezar.';
  const block = next.block;
  if (next.status === 'ongoing') return `En curso · hasta las ${block.end}`;
  if (next.status === 'today') return `Más tarde hoy · ${formatTimeRange(block)}`;
  if (next.status === 'tomorrow') return `Mañana · ${formatTimeRange(block)}`;
  return `${dayLabel(block.day)} · ${formatTimeRange(block)}`;
}

function blockMeta(iconName, text) {
  if (!text) return null;
  return el(
    'span',
    { class: 'schedule-block__meta' },
    el('span', { html: icon(iconName, { size: 12 }), attrs: { 'aria-hidden': 'true' } }),
    el('span', { text }),
  );
}

function scheduleBlock(block, onChange) {
  const headingId = `schedule-block-${block.id}`;
  const edit = () => openBlockModal({ block, onChange });
  const remove = async () => {
    const confirmed = await confirmDialog({
      title: 'Eliminar bloque',
      message: `Se eliminará "${block.subject}" del ${dayLabel(block.day).toLowerCase()}.`,
      confirmLabel: 'Eliminar bloque',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      deleteScheduleBlock(block.id);
      onChange();
      toast.success('Bloque eliminado del horario.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo eliminar el bloque de horario.', error);
      toast.error(error.message || 'No se pudo eliminar el bloque.');
    }
  };

  return el(
    'article',
    {
      class: 'schedule-block',
      dataset: { id: block.id, testid: 'schedule-block' },
      attrs: { 'aria-labelledby': headingId },
    },
    el(
      'div',
      { class: 'schedule-block__time' },
      el('strong', { text: block.start }),
      el('span', { class: 'schedule-block__time-separator', text: '·' }),
      el('span', { text: block.end }),
    ),
    el(
      'div',
      { class: 'schedule-block__body' },
      el('h3', { class: 'schedule-block__subject', id: headingId, text: block.subject }),
      blockMeta('user', block.teacher || 'Docente por confirmar'),
      blockMeta('mapPin', block.room || 'Sala por confirmar'),
    ),
    el(
      'div',
      { class: 'schedule-block__actions' },
      el('button', {
        class: 'icon-btn',
        type: 'button',
        attrs: { 'aria-label': `Editar ${block.subject} del ${dayLabel(block.day).toLowerCase()}` },
        html: icon('edit', { size: 14 }),
        on: { click: edit },
      }),
      el('button', {
        class: 'icon-btn icon-btn--danger',
        type: 'button',
        attrs: {
          'aria-label': `Eliminar ${block.subject} del ${dayLabel(block.day).toLowerCase()}`,
        },
        html: icon('trash', { size: 14 }),
        on: { click: remove },
      }),
    ),
  );
}

function dayColumn(day, blocks, { onChange, onAdd }) {
  const dailyBlocks = blocksForDay(blocks, day.id);
  const isToday = isScheduleDayToday(day.id);

  return el(
    'section',
    {
      class: `schedule-day${isToday ? ' is-today' : ''}`,
      dataset: { day: day.id },
      attrs: { 'aria-labelledby': `schedule-day-${day.id}` },
    },
    el(
      'header',
      { class: 'schedule-day__header' },
      el(
        'div',
        { class: 'schedule-day__heading' },
        el(
          'h3',
          { class: 'schedule-day__title', id: `schedule-day-${day.id}` },
          el('span', { text: day.label }),
          isToday ? el('span', { class: 'badge badge--solid', text: 'Hoy' }) : null,
        ),
        el('span', { class: 'schedule-day__date', text: formatDayDate(day.date) }),
      ),
      el('button', {
        class: 'icon-btn schedule-day__add',
        type: 'button',
        attrs: { 'aria-label': `Agregar bloque del ${day.label.toLowerCase()}` },
        html: icon('plus', { size: 15 }),
        on: { click: () => onAdd(day.id) },
      }),
    ),
    dailyBlocks.length
      ? el(
          'div',
          { class: 'schedule-day__blocks' },
          ...dailyBlocks.map((block) => scheduleBlock(block, onChange)),
        )
      : el(
          'div',
          { class: 'schedule-day__empty' },
          el('span', { html: icon('clock', { size: 18 }), attrs: { 'aria-hidden': 'true' } }),
          el('p', { text: 'Sin clases programadas.' }),
          el('button', {
            class: 'btn btn--ghost btn--sm',
            type: 'button',
            text: 'Agregar bloque',
            on: { click: () => onAdd(day.id) },
          }),
        ),
  );
}

function openBlockModal({ block = null, initialDay = 1, onChange }) {
  const editing = Boolean(block);
  const selectedDay = Number(block?.day ?? initialDay);
  const daySelect = el(
    'select',
    { class: 'select', id: 'schedule-day' },
    ...SCHEDULE_DAYS.map((day) =>
      el('option', {
        value: String(day.id),
        text: day.label,
        selected: day.id === selectedDay,
      }),
    ),
  );
  const startInput = el('input', {
    class: 'input',
    id: 'schedule-start',
    type: 'time',
    value: block?.start || '08:00',
    required: true,
  });
  const endInput = el('input', {
    class: 'input',
    id: 'schedule-end',
    type: 'time',
    value: block?.end || '09:30',
    required: true,
  });
  const subjectInput = el('input', {
    class: 'input',
    id: 'schedule-subject',
    value: block?.subject || '',
    placeholder: 'Ej: Matemáticas',
    list: 'schedule-subject-options',
    maxlength: '80',
    required: true,
  });
  const subjectOptions = el(
    'datalist',
    { id: 'schedule-subject-options' },
    ...SUBJECTS.map((subject) => el('option', { value: subject })),
  );
  const teacherInput = el('input', {
    class: 'input',
    id: 'schedule-teacher',
    value: block?.teacher || '',
    placeholder: 'Ej: Prof. Moya',
    maxlength: '80',
  });
  const roomInput = el('input', {
    class: 'input',
    id: 'schedule-room',
    value: block?.room || '',
    placeholder: 'Ej: Sala 12',
    maxlength: '80',
  });

  const fields = {
    day: daySelect,
    start: startInput,
    end: endInput,
    subject: subjectInput,
    teacher: teacherInput,
    room: roomInput,
  };

  const form = el(
    'form',
    { class: 'form', id: 'schedule-form', novalidate: true },
    el(
      'div',
      { class: 'form-grid form-grid--3' },
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', attrs: { for: 'schedule-day' } }, 'Día'),
        daySelect,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', attrs: { for: 'schedule-start' } }, 'Inicio'),
        startInput,
      ),
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', attrs: { for: 'schedule-end' } }, 'Término'),
        endInput,
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el(
        'label',
        { class: 'field__label', attrs: { for: 'schedule-subject' } },
        'Asignatura o actividad',
      ),
      subjectInput,
      subjectOptions,
      el('span', {
        class: 'field__hint',
        text: 'Obligatoria. Puedes elegir una sugerencia o escribir otra actividad.',
      }),
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'schedule-teacher' } },
          'Docente ',
          el('span', { class: 'field__optional', text: '(opcional)' }),
        ),
        teacherInput,
      ),
      el(
        'div',
        { class: 'field' },
        el(
          'label',
          { class: 'field__label', attrs: { for: 'schedule-room' } },
          'Sala o lugar ',
          el('span', { class: 'field__optional', text: '(opcional)' }),
        ),
        roomInput,
      ),
    ),
    el(
      'div',
      { class: 'lostfound-note' },
      el('span', { html: icon('info', { size: 15 }), attrs: { 'aria-hidden': 'true' } }),
      el('span', {
        text: 'El horario se guarda solo en este navegador y no se comparte con la API.',
      }),
    ),
  );

  const modal = openModal({
    title: editing ? 'Editar bloque' : 'Agregar bloque',
    eyebrow: 'Horario personal',
    description: 'Organiza tus clases y evita que dos bloques se crucen.',
    body: form,
    size: 'lg',
    initialFocus: subjectInput,
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
        text: editing ? 'Guardar cambios' : 'Agregar al horario',
        attrs: { form: 'schedule-form' },
      }),
    ],
  });

  bindFieldErrorClearing(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const payload = {
      day: Number(daySelect.value),
      start: startInput.value,
      end: endInput.value,
      subject: subjectInput.value,
      teacher: teacherInput.value,
      room: roomInput.value,
    };
    const errors = scheduleValidation(payload, block?.id);

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        setFieldError(fields[field], message);
      });
      fields[Object.keys(errors)[0]]?.focus();
      return;
    }

    try {
      if (editing) updateScheduleBlock(block.id, payload);
      else createScheduleBlock(payload);

      modal.close();
      onChange();
      toast.success(editing ? 'Bloque actualizado.' : 'Bloque agregado al horario.');
    } catch (error) {
      if (error?.fields) {
        Object.entries(error.fields).forEach(([field, message]) => {
          setFieldError(fields[field], message);
        });
        fields[Object.keys(error.fields)[0]]?.focus();
        return;
      }
      console.error('[IntraNerd] No se pudo guardar el bloque de horario.', error);
      toast.error(error.message || 'No se pudo guardar el bloque.');
    }
  });
}

export function mount(container) {
  let blocks = listScheduleBlocks();
  const weekLabel = el('h2', { class: 'schedule-board__title', id: 'schedule-board-title' });
  const boardCount = el('span', { class: 'badge badge--brand' });
  const board = el('div', {
    id: 'schedule-board',
    class: 'schedule-grid',
    attrs: { 'aria-labelledby': 'schedule-board-title' },
  });
  const summary = el('div', { class: 'schedule-summary' });

  function addBlock(day = 1) {
    openBlockModal({ initialDay: day, onChange: render });
  }

  function render() {
    blocks = listScheduleBlocks();
    const stats = weeklySummary(blocks);
    const next = currentOrNextBlock(blocks);

    summary.replaceChildren(
      summaryCard({
        iconName: 'calendar',
        label: 'Bloques semanales',
        value: String(stats.count),
        hint: `${stats.subjects} ${stats.subjects === 1 ? 'asignatura' : 'asignaturas'} distintas`,
      }),
      summaryCard({
        iconName: 'clock',
        label: 'Carga semanal',
        value: formatDuration(stats.minutes),
        hint: 'Tiempo total de clases programado',
        tone: 'warning',
      }),
      summaryCard({
        iconName: next?.status === 'ongoing' ? 'sparkles' : 'arrowRight',
        label: next?.status === 'ongoing' ? 'Clase en curso' : 'Próxima clase',
        value: next ? next.block.subject : 'Sin clases',
        hint: nextHint(next),
        tone: next ? 'success' : '',
      }),
    );

    weekLabel.textContent = formatScheduleWeek();
    boardCount.textContent = `${stats.count} ${stats.count === 1 ? 'bloque' : 'bloques'}`;
    board.replaceChildren(
      ...scheduleWeekDates().map((day) =>
        dayColumn(day, blocks, { onChange: render, onAdd: addBlock }),
      ),
    );
  }

  container.replaceChildren(
    pageHeader({
      eyebrow: 'Organización',
      title: 'Horario semanal',
      description:
        'Revisa tus clases, docentes y salas; agrega bloques y detecta cruces antes de guardar.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Agregar bloque</span>`,
          on: { click: () => addBlock() },
        }),
      ],
    }),
    el(
      'div',
      { class: 'stack schedule-page' },
      summary,
      el(
        'section',
        { class: 'schedule-board-card' },
        el(
          'header',
          { class: 'schedule-board__header' },
          el(
            'div',
            {},
            el('span', { class: 'schedule-board__eyebrow', text: 'Semana actual' }),
            weekLabel,
          ),
          boardCount,
        ),
        board,
      ),
    ),
  );

  render();
}
