import { GRADE_SCALE, SUBJECTS } from '../data/constants.js';
import { subjectsRepo } from '../services/resources.js';
import { bindFieldErrorClearing, clearFieldError, el, qs, setFieldError } from '../utils/dom.js';
import { formatNumber, initials, round1 } from '../utils/format.js';
import {
  generalAverage,
  gradeTone,
  isValidGrade,
  sanitizeGrades,
  semesterAverage,
  subjectSummary,
} from '../utils/grades.js';
import { buildGradeGoal } from '../utils/gradeGoals.js';
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

function gradeChip(value, onRemove, describedBy = '') {
  const numeric = Number(value);
  const pass = numeric >= GRADE_SCALE.passing;
  return el(
    'span',
    { class: `grade-chip ${pass ? 'grade-chip--pass' : 'grade-chip--fail'}` },
    el('span', { text: formatNumber(numeric) }),
    el('button', {
      class: 'grade-chip__remove',
      type: 'button',
      attrs: {
        'aria-label': `Eliminar nota ${formatNumber(numeric)}`,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
      html: icon('x', { size: 11 }),
      on: { click: onRemove },
    }),
  );
}

function semesterBlock(subject, semesterKey, title, focusState) {
  const values = sanitizeGrades(subject[semesterKey] || []);
  const averageValue = semesterAverage(values);
  const titleId = `semester-title-${subject.id}-${semesterKey}`;
  const input = el('input', {
    class: 'input',
    type: 'number',
    min: String(GRADE_SCALE.min),
    max: String(GRADE_SCALE.max),
    step: '0.1',
    inputmode: 'decimal',
    placeholder: '1.0 – 7.0',
    attrs: {
      'aria-label': `Agregar nota a ${title.toLowerCase()} de ${subject.name}`,
    },
  });
  bindFieldErrorClearing(input);

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
          gradeChip(value, () => removeGrade(subject, semesterKey, index), titleId),
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
      el('span', { class: 'semester__title', id: titleId, text: title }),
      el('span', {
        class: `semester__average ${averageTone}`,
        attrs: {
          'aria-label':
            averageValue === null
              ? 'Sin promedio en este semestre'
              : `Promedio ${formatNumber(averageValue)}, ${
                  averageValue >= GRADE_SCALE.passing ? 'aprobado' : 'reprobado'
                }`,
        },
        text: averageValue === null ? 'Sin promedio' : formatNumber(averageValue),
      }),
    ),
    chips,
    el(
      'div',
      { class: 'grade-add' },
      el('div', { class: 'field grade-add__field' }, input),
      addButton,
    ),
    el('span', { class: 'grade-note', text: 'Puedes escribir varias notas separadas por comas.' }),
  );
}

function subjectCardById(id) {
  return Array.from(qs('#grades-content')?.querySelectorAll('.subject-card') || []).find(
    (card) => card.dataset.subjectId === id,
  );
}

function focusSubjectInput(id) {
  const input = subjectCardById(id)?.querySelector('.grade-add .input');
  input?.focus();
  return Boolean(input);
}

function focusFirstSubjectInput() {
  const input = qs('#grades-content .subject-card .grade-add .input');
  if (input) {
    input.focus();
    return;
  }
  const emptyAction = qs('#grades-content .empty-state .btn--primary');
  emptyAction?.focus();
}

function subjectCard(subject, focusState) {
  const summary = subjectSummary(subject);
  const gradeValues = [...(subject.semester1 || []), ...(subject.semester2 || [])];
  const totalGrades = gradeValues.length;
  const gradesLabel = totalGrades === 1 ? 'nota registrada' : 'notas registradas';
  const titleId = `subject-title-${subject.id}`;
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
          el('h2', { class: 'subject-card__name', id: titleId, text: subject.name }),
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
      el(
        'div',
        { class: 'btn-row subject-card__actions' },
        el('button', {
          class: 'btn btn--ghost btn--sm',
          type: 'button',
          attrs: { 'aria-describedby': titleId },
          html: `${icon('target', { size: 14 })}<span>Simular meta</span>`,
          on: { click: () => openGradeGoal(subject) },
        }),
        el('button', {
          class: 'btn btn--danger-soft btn--sm',
          type: 'button',
          attrs: { 'aria-describedby': titleId },
          html: `${icon('trash', { size: 14 })}<span>Eliminar asignatura</span>`,
          on: { click: () => deleteSubject(subject) },
        }),
      ),
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
    setFieldError(input, 'Escribe al menos una nota antes de agregar.');
    input.focus();
    return;
  }

  const invalid = parsed.find((value) => !isValidGrade(value));
  if (invalid !== undefined) {
    const message =
      `La nota ${invalid} está fuera de la escala. ` +
      `Debe estar entre ${GRADE_SCALE.min}.0 y ${GRADE_SCALE.max}.0.`;
    setFieldError(input, message);
    input.focus();
    // El toast refuerza el error y forma parte del contrato de la interfaz.
    toast.error(message);
    return;
  }

  clearFieldError(input);

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
  // Al eliminar una nota, el foco vuelve al campo de ingreso del mismo semestre.
  await persistSubject(next, { subjectId: subject.id, semester: semesterKey });
}

function goalSemesterCard(semester) {
  const tone =
    semester.status === 'imposible'
      ? 'danger'
      : semester.status === 'cubierto'
        ? 'success'
        : semester.status === 'sin-datos'
          ? 'muted'
          : 'info';

  const currentLabel =
    semester.current === null ? 'Sin notas' : `Actual ${formatNumber(semester.current)}`;

  let detail;
  if (semester.status === 'sin-datos') {
    detail = 'Registra notas en el otro semestre para calcular el camino.';
  } else if (semester.status === 'imposible') {
    detail = `Necesitarías ${formatNumber(semester.needed)} de promedio, fuera de la escala 1.0–7.0.`;
  } else if (semester.covered) {
    detail = 'Ya está cubierto con tu promedio actual; no necesitas subir este semestre.';
  } else {
    detail = `Necesitas promedio ${formatNumber(semester.needed)}.`;
  }

  let nextText = null;
  if (semester.status === 'posible' && semester.next?.valid) {
    if (semester.next.secured) {
      nextText = 'Con la nota mínima 1.0 mantienes la meta.';
    } else if (semester.next.feasible) {
      nextText = semester.next.count
        ? `Próxima nota: ${formatNumber(semester.next.rounded)}.`
        : `Primera nota: ${formatNumber(semester.next.rounded)}.`;
    } else {
      nextText = 'Una sola nota no alcanza: necesitas más evaluaciones.';
    }
  }

  return el(
    'article',
    { class: `grade-lab__semester grade-lab__semester--${tone}` },
    el(
      'header',
      { class: 'grade-lab__semester-header' },
      el('h3', { class: 'grade-lab__semester-title', text: semester.label }),
      el('span', { class: 'grade-lab__semester-current', text: currentLabel }),
    ),
    el('p', { class: 'grade-lab__semester-detail', text: detail }),
    nextText ? el('p', { class: 'grade-lab__next', text: nextText }) : null,
  );
}

function openGradeGoal(subject) {
  const current = subjectSummary(subject);
  const suggestedTarget =
    current.final === null
      ? 6
      : Math.min(GRADE_SCALE.max, Math.max(4, round1(current.final + 0.5)));

  const targetInput = el('input', {
    class: 'input',
    id: 'grade-goal-target',
    type: 'number',
    min: String(GRADE_SCALE.min),
    max: String(GRADE_SCALE.max),
    step: '0.1',
    value: suggestedTarget.toFixed(1),
    attrs: {
      inputmode: 'decimal',
      'aria-describedby': 'grade-goal-help',
    },
  });

  const results = el('div', {
    class: 'grade-lab__results',
    attrs: { 'aria-live': 'polite', 'aria-atomic': 'true' },
  });

  const presets = [4, 5, 6, 6.5].map((value) =>
    el('button', {
      class: 'chip grade-lab__preset',
      type: 'button',
      text: formatNumber(value),
      attrs: { 'aria-label': `Usar meta ${formatNumber(value)}` },
      on: {
        click: () => {
          targetInput.value = value.toFixed(1);
          renderGoal();
          targetInput.focus();
        },
      },
    }),
  );

  const body = el(
    'div',
    { class: 'grade-lab' },
    el(
      'div',
      { class: 'grade-lab__current' },
      el('span', { class: 'grade-lab__current-label', text: 'Promedio final actual' }),
      el('strong', {
        class: 'grade-lab__current-value',
        text: current.final === null ? '—' : formatNumber(current.final),
      }),
      el('span', {
        class:
          current.final === null
            ? 'badge'
            : current.passed
              ? 'badge badge--success'
              : 'badge badge--danger',
        text: current.status,
      }),
    ),
    el(
      'div',
      { class: 'field grade-lab__target' },
      el('label', {
        class: 'field__label',
        text: 'Meta de promedio final',
        attrs: { for: 'grade-goal-target' },
      }),
      targetInput,
      el('span', {
        class: 'field__hint',
        id: 'grade-goal-help',
        text: 'Entre 1.0 y 7.0. El cálculo mantiene el otro semestre con su promedio actual.',
      }),
    ),
    el(
      'div',
      { class: 'grade-lab__presets', attrs: { 'aria-label': 'Metas rápidas' } },
      el('span', { class: 'grade-lab__presets-label', text: 'Metas rápidas:' }),
      ...presets,
    ),
    results,
    el(
      'p',
      { class: 'grade-lab__note' },
      'Los resultados son una estimación con las notas registradas. ' +
        'La decisión final siempre depende de las reglas de evaluación del colegio.',
    ),
  );

  function renderGoal() {
    const target = Number(targetInput.value);
    if (!Number.isFinite(target) || target < GRADE_SCALE.min || target > GRADE_SCALE.max) {
      targetInput.setAttribute('aria-invalid', 'true');
      results.replaceChildren(
        el('p', {
          class: 'grade-lab__verdict grade-lab__verdict--warning',
          text: 'Escribe una meta entre 1.0 y 7.0 para ver el cálculo.',
        }),
      );
      return;
    }

    targetInput.removeAttribute('aria-invalid');
    const goal = buildGradeGoal(subject, target);
    let tone = 'brand';
    let title = 'Hay un camino para llegar';
    let message = '';

    if (!goal.hasData) {
      tone = 'muted';
      title = 'Aún no hay notas suficientes';
      message = 'Registra calificaciones y vuelve a abrir el simulador para ver un cálculo real.';
    } else if (goal.targetAchieved) {
      tone = 'success';
      title = 'Meta alcanzada';
      message = `Tu promedio final actual (${formatNumber(goal.current.final)}) ya llega a la meta. Mantén el ritmo.`;
    } else if (goal.canReach === false) {
      tone = 'danger';
      title = 'La meta no es alcanzable con estas notas';
      message =
        'Uno o ambos semestres necesitarían un promedio superior a 7.0. Prueba una meta más cercana.';
    } else if (goal.easiest) {
      message =
        `El camino más corto pasa por el ${goal.easiest.label.toLowerCase()}: ` +
        `necesitas ${formatNumber(goal.easiest.needed)} de promedio.`;
    }

    results.replaceChildren(
      el(
        'div',
        { class: `grade-lab__verdict grade-lab__verdict--${tone}` },
        el(
          'div',
          {},
          el('strong', { class: 'grade-lab__verdict-title', text: title }),
          el('p', { class: 'grade-lab__verdict-text', text: message }),
        ),
      ),
      el('div', { class: 'grade-lab__grid' }, ...goal.semesters.map(goalSemesterCard)),
    );
  }

  const modal = openModal({
    title: `Simular meta · ${subject.name}`,
    eyebrow: 'Laboratorio de notas',
    description: 'Descubre qué promedio o nota necesitas para llegar a la meta que te propongas.',
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

  targetInput.addEventListener('input', renderGoal);
  renderGoal();
  requestAnimationFrame(() => targetInput.focus());
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
    focusFirstSubjectInput();
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
    { class: 'form', id: 'new-subject-form', noValidate: true },
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

  bindFieldErrorClearing(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const first = parseGradeInput(firstInput.value);
    const second = parseGradeInput(secondInput.value);
    const firstInvalid = first.find((value) => !isValidGrade(value));
    const secondInvalid = second.find((value) => !isValidGrade(value));

    if (!name || firstInvalid !== undefined || secondInvalid !== undefined) {
      if (!name) setFieldError(nameInput, 'Escribe el nombre de la asignatura.');
      if (firstInvalid !== undefined) {
        setFieldError(
          firstInput,
          `La nota ${firstInvalid} está fuera de la escala ${GRADE_SCALE.min}.0 – ${GRADE_SCALE.max}.0.`,
        );
      }
      if (secondInvalid !== undefined) {
        setFieldError(
          secondInput,
          `La nota ${secondInvalid} está fuera de la escala ${GRADE_SCALE.min}.0 – ${GRADE_SCALE.max}.0.`,
        );
      }
      if (!name) nameInput.focus();
      else if (firstInvalid !== undefined) firstInput.focus();
      else secondInput.focus();
      // Refuerza el error en pantalla; el campo mantiene su mensaje en línea.
      if (firstInvalid !== undefined || secondInvalid !== undefined) {
        toast.error(`Hay notas fuera de la escala ${GRADE_SCALE.min}.0 – ${GRADE_SCALE.max}.0.`);
      }
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
      focusSubjectInput(created.id);
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
