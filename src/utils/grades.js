import { GRADE_SCALE } from '../data/constants.js';
import { average, round1 } from './format.js';

/**
 * Cálculos académicos compartidos entre la vista de notas y el panel.
 * La escala institucional es 1.0 – 7.0 y la nota de aprobación es 4.0.
 */

export function isValidGrade(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= GRADE_SCALE.min && number <= GRADE_SCALE.max;
}

export function sanitizeGrades(values = []) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && isValidGrade(value));
}

export function semesterAverage(values = []) {
  return round1(average(sanitizeGrades(values)));
}

export function subjectSummary(subject) {
  const first = semesterAverage(subject?.semester1);
  const second = semesterAverage(subject?.semester2);

  let final = null;
  if (first !== null && second !== null) final = round1((first + second) / 2);
  else if (first !== null) final = first;
  else if (second !== null) final = second;

  return {
    first,
    second,
    final,
    passed: final !== null ? final >= GRADE_SCALE.passing : null,
    status: final === null ? 'Sin notas' : final >= GRADE_SCALE.passing ? 'Aprobado' : 'Reprobado',
  };
}

export function generalAverage(subjects = []) {
  const finals = subjects
    .map((subject) => subjectSummary(subject).final)
    .filter((value) => value !== null);
  return round1(average(finals));
}

export function gradeTone(value) {
  if (value === null || value === undefined) return 'muted';
  return Number(value) >= GRADE_SCALE.passing ? 'success' : 'danger';
}
