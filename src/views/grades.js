import { GRADE_SCALE, SUBJECTS } from '../data/constants.js';
import { subjectsRepo } from '../services/resources.js';
import { el, qs } from '../utils/dom.js';
import { formatNumber, initials, round1 } from '../utils/format.js';
import {
  generalAverage,
  gradeTone,
  isValidGrade,
  sanitizeGrades,
  semesterAverage,
  subjectSummary,
} from '../utils/grades.js';
import { icon } from '../components/icon.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

let subjects = [];

function parseGradeInput(value) {
  return String(value)
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);
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

function gradeChip(value, onRemove) {
  const numeric = Number(value);
  const pass = numeric >= GRADE_SCALE.passing;
  return el(
    'span',
    { class: `grade-chip ${pass ? 'grade-chip--pass' : 'grade-chip--fail'}` },
    el('span', { text: formatNumber(numeric) }),
    el('button', {
      class: 'grade-chip__remove',
      type: 'button',
      attrs: { 'aria-label': `Eliminar nota ${formatNumber(numeric)}` },
      html: icon('x', { size: 11 }),
      on: { click: onRemove },
    }),
  );
}

function semesterBlock(subject, semesterKey, title, focusState) {
  const values = sanitizeGrades(subject[semesterKey] || []);
  const averageValue = semesterAverage(values);
  const input = el('input', {
    class: 'input',
    type: 'number',
    min: String(GRADE_SCALE.min),
    max: String(GRADE_SCALE.max),
    step: '0.1',
    inputmode: 'decimal',
    placeholder: '1.0 – 7.0',
    attrs: { 'aria-label': `Agregar nota a ${title.toLowerCase()} de ${subject.name}` },
  });

  if (focusState?.subjectId === subject.id && focusState?.semester === semesterKey) {
    requestAnimationFrame(() => input.focus());
  }

  const addButton = el('button', {
    class: 'btn btn--secondary btn--sm',
    type: 'button',
    text: 'Agregar',
    on: { click: () => addGrade(subject, semesterKey, input) },
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addGrade(subject, semesterKey, input);
    }
  });

  const chips = el(
    'div',
    { class: 'grade-chips' },
    ...(values.length
      ? values.map((value, index) =>
          gradeChip(value, () => removeGrade(subject, semesterKey, index)),
        )
      : [el('span', { class: 'grade-empty', text: 'Aún no hay notas en este semestre.' })]),
  );

  const averageTone =
    averageValue === null
      ? 'text-muted'
      : averageValue < GRADE_SCALE.passing
        ? 'text-danger'
        : 'text-success';

  return el(
    'div',
    { class: 'semester' },
    el(
      'div',
      { class: 'semester__header' },
      el('span', { class: 'semester__title', text: title }),
      el('span', {
        class: `semester__average ${averageTone}`,
        text: averageValue === null ? 'Sin promedio' : formatNumber(averageValue),
      }),
    ),
    chips,
    el('div', { class: 'grade-add' }, input, addButton),
    el('span', { class: 'grade-note', text: 'Puedes escribir varias notas separadas por comas.' }),
  );
}

function subjectCard(subject, focusState) {
  const summary = subjectSummary(subject);
  const gradeValues = [...(subject.semester1 || []), ...(subject.semester2 || [])];
  const totalGrades = gradeValues.length;
  const gradesLabel = totalGrades === 1 ? 'nota registrada' : 'notas registradas';
  const finalTone =
    summary.final === null ? 'text-muted' : summary.passed ? 'text-success' : 'text-danger';
  const statusTone =
    summary.passed === null ? '' : summary.passed ? 'status-dot--success' : 'status-dot--danger';
  return el(
    'article',
    { class: 'subject-card', dataset: { subjectId: subject.id } },
    el(
      'header',
      { class: 'subject-card__header' },
      el(
        'div',
        { class: 'subject-card__identity' },
        el('span', { class: 'subject-card__mark', text: initials(subject.name) || 'AS' }),
        el(
          'div',
          {},
          el('h2', { class: 'subject-card__name', text: subject.name }),
          el('p', {
            class: 'subject-card__meta',
            text: `${totalGrades} ${gradesLabel} · promedio semestral 50/50`,
          }),
        ),
      ),
      el(
        'div',
        { class: 'subject-card__final' },
        el('span', {
          class: `subject-card__final-value ${finalTone}`,
          text: summary.final === null ? '—' : formatNumber(summary.final),
        }),
        el('span', { class: 'subject-card__final-label', text: 'Promedio final' }),
      ),
    ),
    el(
      'div',
      { class: 'grade-semesters' },
      semesterBlock(subject, 'semester1', 'Primer semestre', focusState),
      semesterBlock(subject, 'semester2', 'Segundo semestre', focusState),
    ),
    el(
      'footer',
      { class: 'subject-card__footer' },
      el(
        'span',
        { class: 'subject-card__status' },
        el('span', {
          class: `status-dot ${statusTone}`,
        }),
        el('span', {
          class:
            summary.passed === null
              ? 'text-muted'
              : summary.passed
                ? 'text-success'
                : 'text-danger',
          text: summary.status,
        }),
      ),
      el('button', {
        class: 'btn btn--danger-soft btn--sm',
        type: 'button',
        html: `${icon('trash', { size: 14 })}<span>Eliminar asignatura</span>`,
        on: { click: () => deleteSubject(subject) },
      }),
    ),
  );
}

async function persistSubject(subject, focusState = null) {
  try {
    const updated = await subjectsRepo.update(subject.id, {
      name: subject.name,
      semester1: subject.semester1,
      semester2: subject.semester2,
    });
    subjects = subjects.map((item) => (item.id === subject.id ? { ...item, ...updated } : item));
    renderContent(focusState);
  } catch (error) {
    console.error('[IntraNerd] No se pudo guardar la nota.', error);
    toast.error(error.message || 'No se pudo guardar la nota.');
    renderContent();
  }
}

async function addGrade(subject, semesterKey, input) {
  const parsed = parseGradeInput(input.value);
  if (!parsed.length) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    toast.warning('Escribe al menos una nota antes de agregar.');
    return;
  }

  const invalid = parsed.find((value) => !isValidGrade(value));
  if (invalid !== undefined) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    toast.error(
      `La nota ${invalid} está fuera de la escala. Debe estar entre ${GRADE_SCALE.min}.0 y ${GRADE_SCALE.max}.0.`,
    );
    return;
  }

  const next = {
    ...subject,
    [semesterKey]: [...(subject[semesterKey] || []), ...parsed.map((value) => round1(value))],
  };
  await persistSubject(next, { subjectId: subject.id, semester: semesterKey });
}

async function removeGrade(subject, semesterKey, index) {
  const next = {
    ...subject,
    [semesterKey]: (subject[semesterKey] || []).filter((_, position) => position !== index),
  };
  await persistSubject(next);
}

async function deleteSubject(subject) {
  const confirmed = await confirmDialog({
    title: 'Eliminar asignatura',
    message: `Se eliminarán "${subject.name}" y todas sus notas. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    tone: 'danger',
  });
  if (!confirmed) return;

  try {
    await subjectsRepo.remove(subject.id);
    subjects = subjects.filter((item) => item.id !== subject.id);
    renderContent();
    toast.success('Asignatura eliminada.');
  } catch (error) {
    console.error('[IntraNerd] No se pudo eliminar la asignatura.', error);
    toast.error(error.message || 'No se pudo eliminar la asignatura.');
  }
}

function openNewSubjectModal() {
  const nameInput = el('input', {
    class: 'input',
    id: 'new-subject-name',
    placeholder: 'Ej: Matemáticas',
    list: 'subject-suggestions',
    required: true,
    autocomplete: 'off',
  });
  const suggestions = el(
    'datalist',
    { id: 'subject-suggestions' },
    ...SUBJECTS.map((subject) => el('option', { value: subject })),
  );

  const firstInput = el('input', {
    class: 'input',
    id: 'new-subject-s1',
    placeholder: 'Ej: 6.2, 5.8',
    inputmode: 'decimal',
  });
  const secondInput = el('input', {
    class: 'input',
    id: 'new-subject-s2',
    placeholder: 'Ej: 5.9',
    inputmode: 'decimal',
  });

  const form = el(
    'form',
    { class: 'form', id: 'new-subject-form' },
    el(
      'div',
      { class: 'field' },
      el('label', {
        class: 'field__label',
        text: 'Nombre de la asignatura',
        attrs: { for: 'new-subject-name' },
      }),
      nameInput,
      suggestions,
    ),
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Notas del primer semestre',
          attrs: { for: 'new-subject-s1' },
        }),
        firstInput,
        el('span', { class: 'field__hint', text: 'Opcional. Sepáralas con comas.' }),
      ),
      el(
        'div',
        { class: 'field' },
        el('label', {
          class: 'field__label',
          text: 'Notas del segundo semestre',
          attrs: { for: 'new-subject-s2' },
        }),
        secondInput,
        el('span', { class: 'field__hint', text: 'Opcional. Sepáralas con comas.' }),
      ),
    ),
    el(
      'div',
      { class: 'formula-box' },
      el(
        'span',
        { class: 'formula-box__title' },
        el('span', { html: icon('info', { size: 15 }) }),
        'Escala institucional',
      ),
      el('span', {
        class: 'formula-box__text',
        text:
          `Cada nota debe estar entre ${GRADE_SCALE.min}.0 y ${GRADE_SCALE.max}.0. ` +
          `La aprobación se obtiene con ${GRADE_SCALE.passing}.0 o más.`,
      }),
    ),
  );

  const modal = openModal({
    title: 'Nueva asignatura',
    eyebrow: 'Notas y promedios',
    description: 'Agrega una asignatura y, si quieres, sus primeras notas.',
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
        text: 'Crear asignatura',
        attrs: { form: 'new-subject-form' },
      }),
    ],
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      toast.warning('Escribe el nombre de la asignatura.');
      return;
    }

    const first = parseGradeInput(firstInput.value);
    const second = parseGradeInput(secondInput.value);
    const invalid = [...first, ...second].find((value) => !isValidGrade(value));
    if (invalid !== undefined) {
      toast.error(
        `La nota ${invalid} está fuera de la escala ${GRADE_SCALE.min}.0 – ${GRADE_SCALE.max}.0.`,
      );
      return;
    }

    try {
      const created = await subjectsRepo.create({
        name,
        semester1: first.map((value) => round1(value)),
        semester2: second.map((value) => round1(value)),
      });
      subjects = [created, ...subjects];
      modal.close();
      renderContent();
      toast.success(`Asignatura "${name}" creada.`);
    } catch (error) {
      console.error('[IntraNerd] No se pudo crear la asignatura.', error);
      toast.error(error.message || 'No se pudo crear la asignatura.');
    }
  });

  requestAnimationFrame(() => nameInput.focus());
}

function renderContent(focusState = null) {
  const page = qs('#grades-content');
  if (!page) return;

  const average = generalAverage(subjects);
  const summaries = subjects.map((subject) => subjectSummary(subject));
  const approved = summaries.filter((summary) => summary.passed === true).length;
  const atRisk = summaries.filter((summary) => summary.passed === false).length;
  const ungraded = summaries.filter((summary) => summary.final === null).length;

  const summary = el(
    'div',
    { class: 'grades-summary' },
    statCard({
      iconName: 'target',
      label: 'Promedio general',
      value: average === null ? '—' : formatNumber(average),
      hint: 'Promedio de los promedios finales',
      tone: average !== null && average < GRADE_SCALE.passing ? 'danger' : 'success',
    }),
    statCard({
      iconName: 'checkCircle',
      label: 'Asignaturas aprobadas',
      value: String(approved),
      hint: `de ${subjects.length} registradas`,
      tone: 'success',
    }),
    statCard({
      iconName: 'alert',
      label: 'En riesgo',
      value: String(atRisk),
      hint: 'Promedio final bajo 4.0',
      tone: atRisk ? 'danger' : '',
    }),
    statCard({
      iconName: 'clock',
      label: 'Sin notas',
      value: String(ungraded),
      hint: 'Asignaturas sin calificaciones',
      tone: 'warning',
    }),
  );

  const list = subjects.length
    ? el('div', { class: 'stack' }, ...subjects.map((subject) => subjectCard(subject, focusState)))
    : emptyState({
        iconName: 'grades',
        title: 'Aún no hay asignaturas',
        text: 'Crea tu primera asignatura y empieza a registrar notas para ver tus promedios.',
        action: el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Agregar asignatura</span>`,
          on: { click: openNewSubjectModal },
        }),
      });

  const formula = el(
    'div',
    { class: 'formula-box' },
    el(
      'span',
      { class: 'formula-box__title' },
      el('span', { html: icon('info', { size: 15 }) }),
      '¿Cómo se calcula?',
    ),
    el('span', {
      class: 'formula-box__text',
      text:
        'Cada semestre promedia sus notas válidas. El promedio final de la asignatura ' +
        'es el promedio de ambos semestres (o el del semestre que tenga notas). ' +
        'El promedio general es el promedio de los promedios finales.',
    }),
  );

  page.replaceChildren(summary, formula, list);
}

export async function mount(container) {
  container.replaceChildren(
    pageHeader({
      eyebrow: 'Académico',
      title: 'Notas y promedios semestrales',
      description:
        'Registra tus calificaciones, revisa el avance por semestre y detecta a tiempo ' +
        'las asignaturas que necesitan apoyo.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('plus', { size: 16 })}<span>Nueva asignatura</span>`,
          on: { click: openNewSubjectModal },
        }),
      ],
    }),
    el('div', { id: 'grades-content' }, skeletonRows(3)),
  );

  try {
    subjects = await subjectsRepo.list();
    renderContent();
  } catch (error) {
    console.error('[IntraNerd] Error al cargar notas.', error);
    toast.error('No fue posible cargar las asignaturas.');
    container.replaceChildren(
      pageHeader({ eyebrow: 'Académico', title: 'Notas y promedios semestrales' }),
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar tus notas',
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
