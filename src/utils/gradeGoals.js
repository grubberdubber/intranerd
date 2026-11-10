import { GRADE_SCALE } from '../data/constants.js';
import { round1 } from './format.js';
import { sanitizeGrades, semesterAverage, subjectSummary } from './grades.js';

/**
 * Laboratorio de metas de nota.
 *
 * Los cálculos son deliberadamente conservadores: suponen que el otro semestre
 * mantiene su promedio actual y que las notas nuevas se suman al promedio
 * simple. Sirven para responder dos preguntas frecuentes:
 *   - ¿Qué promedio necesito en el otro semestre para llegar a mi meta?
 *   - ¿Qué nota necesito en la próxima evaluación para alcanzar ese promedio?
 */

const EPSILON = 0.001;

export function isValidGoal(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= GRADE_SCALE.min && number <= GRADE_SCALE.max;
}

/**
 * Calcula el promedio que debería alcanzar cada semestre para llegar a la
 * meta final, manteniendo el otro semestre tal como está.
 *
 * @param {{ semester1?: number[], semester2?: number[] }} subject
 * @param {number} target
 * @returns {{ semester1: number|null, semester2: number|null }}
 */
export function requiredSemesterAverages(subject = {}, target) {
  if (!isValidGoal(target)) return { semester1: null, semester2: null };

  const first = semesterAverage(subject.semester1);
  const second = semesterAverage(subject.semester2);
  const needed = { semester1: null, semester2: null };

  if (first !== null && second !== null) {
    needed.semester1 = round1(2 * target - second);
    needed.semester2 = round1(2 * target - first);
  } else if (first !== null) {
    needed.semester2 = round1(2 * target - first);
  } else if (second !== null) {
    needed.semester1 = round1(2 * target - second);
  }

  return needed;
}

/**
 * Nota necesaria en la próxima evaluación para que el promedio del semestre
 * llegue a `targetAverage`. Si ya hay notas, se usa la suma actual y se
 * agrega una evaluación más.
 *
 * @param {number[]} grades
 * @param {number} targetAverage
 */
export function nextGradeForAverage(grades = [], targetAverage) {
  if (!isValidGoal(targetAverage)) {
    return {
      valid: false,
      current: null,
      target: null,
      count: 0,
      raw: null,
      rounded: null,
      feasible: false,
      secured: false,
      achieved: false,
    };
  }

  const values = sanitizeGrades(grades);
  const count = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const current = semesterAverage(values);
  const raw = targetAverage * (count + 1) - sum;
  const rounded = round1(raw);

  return {
    valid: true,
    current,
    target: round1(targetAverage),
    count,
    raw,
    rounded,
    // `rounded` puede quedar fuera de 1.0–7.0; la UI explica ambos casos.
    feasible: raw <= GRADE_SCALE.max + EPSILON,
    secured: raw <= GRADE_SCALE.min + EPSILON,
    achieved: current !== null && current >= targetAverage - EPSILON,
  };
}

/**
 * Resumen completo para el simulador de una asignatura.
 *
 * @param {{ semester1?: number[], semester2?: number[] }} subject
 * @param {number} target
 */
export function buildGradeGoal(subject = {}, target) {
  const valid = isValidGoal(target);
  const current = subjectSummary(subject);
  const needed = requiredSemesterAverages(subject, target);

  const semesters = [
    {
      key: 'semester1',
      label: 'Primer semestre',
      grades: sanitizeGrades(subject.semester1),
      current: semesterAverage(subject.semester1),
      needed: needed.semester1,
    },
    {
      key: 'semester2',
      label: 'Segundo semestre',
      grades: sanitizeGrades(subject.semester2),
      current: semesterAverage(subject.semester2),
      needed: needed.semester2,
    },
  ].map((semester) => {
    const next =
      semester.needed !== null ? nextGradeForAverage(semester.grades, semester.needed) : null;
    const impossible =
      semester.needed !== null &&
      (semester.needed > GRADE_SCALE.max + EPSILON || semester.needed < GRADE_SCALE.min - EPSILON);
    const covered =
      !impossible &&
      semester.current !== null &&
      semester.needed !== null &&
      semester.current >= semester.needed - EPSILON;

    const status =
      semester.needed === null
        ? 'sin-datos'
        : impossible
          ? 'imposible'
          : covered
            ? 'cubierto'
            : 'posible';

    return { ...semester, next, impossible, covered, status };
  });

  const hasData = current.final !== null;
  const targetAchieved = valid && current.final !== null && current.final >= target - EPSILON;
  const viable = semesters
    .filter((semester) => semester.status === 'posible')
    .sort((a, b) => a.needed - b.needed);

  return {
    valid,
    target: valid ? round1(target) : null,
    current,
    semesters,
    hasData,
    targetAchieved,
    // null significa "todavía no hay datos suficientes".
    canReach: !valid ? false : hasData ? targetAchieved || viable.length > 0 : null,
    easiest: viable[0] || null,
  };
}
