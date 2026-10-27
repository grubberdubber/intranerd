import { describe, expect, it } from 'vitest';
import {
  MAX_SCORE,
  MIN_SCORE,
  PASSING_SCORE,
  average,
  buildGradeSummary,
  buildSubjectSummary,
  finalGrade,
  generalAverage,
  isValidScore,
  round1,
} from '../../backend/src/domain/grades.js';

/**
 * Módulo 1 · Notas y promedios.
 * Reglas: escala chilena 1.0–7.0, aprobación desde 4.0, promedio semestral
 * simple y promedio general como media de las notas finales por asignatura.
 */
describe('domain/grades · escala y redondeo', () => {
  it('expone los límites de la escala chilena', () => {
    expect(MIN_SCORE).toBe(1);
    expect(MAX_SCORE).toBe(7);
    expect(PASSING_SCORE).toBe(4);
  });

  it.each([
    [1, true],
    [7, true],
    [1.0, true],
    [6.9, true],
    ['5.5', true],
    [0.9, false],
    [7.1, false],
    [0, false],
    [-3, false],
    [null, false],
    [undefined, false],
    ['abc', false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])('isValidScore(%p) → %p', (value, expected) => {
    expect(isValidScore(value)).toBe(expected);
  });

  it('redondea a un decimal con el criterio de la calculadora original', () => {
    expect(round1(4.25)).toBe(4.3);
    expect(round1(4.24)).toBe(4.2);
    expect(round1(5.55)).toBe(5.6);
    expect(round1(6)).toBe(6);
  });
});

describe('domain/grades · promedios', () => {
  it('calcula el promedio simple de las notas válidas', () => {
    expect(average([6, 5])).toBe(5.5);
    expect(average([4.2, 5.0])).toBe(4.6);
    expect(average([5.8, 6.0, 6.2])).toBe(6);
  });

  it('ignora notas fuera de escala, nulas o no numéricas', () => {
    expect(average([6, 0, 8, null, 'x', 5])).toBe(5.5);
    expect(average(['6', '5.5'])).toBe(5.8);
  });

  it('devuelve null cuando no hay notas válidas', () => {
    expect(average([])).toBeNull();
    expect(average([0, 9])).toBeNull();
    expect(average()).toBeNull();
  });

  it('combina ambos semestres en 50/50', () => {
    expect(finalGrade(6, 5)).toBe(5.5);
    expect(finalGrade(6.1, 5.2)).toBe(5.7);
  });

  it('usa el semestre disponible cuando el otro está vacío', () => {
    expect(finalGrade(6.2, null)).toBe(6.2);
    expect(finalGrade(null, 5.4)).toBe(5.4);
    expect(finalGrade(undefined, 5.4)).toBe(5.4);
    expect(finalGrade(null, null)).toBeNull();
  });

  it('promedia las notas finales de las asignaturas evaluadas', () => {
    expect(generalAverage([{ finalAverage: 6 }, { finalAverage: 5.5 }])).toBe(5.8);
    expect(
      generalAverage([
        { finalAverage: 6 },
        { finalAverage: null },
        { finalAverage: undefined },
        { finalAverage: 4 },
      ]),
    ).toBe(5);
    expect(generalAverage([])).toBeNull();
  });
});

describe('domain/grades · resumen por asignatura', () => {
  const subject = {
    id: 'sub_1',
    name: 'Matemáticas',
    code: 'MAT',
    color: '#1e40af',
    teacher_name: 'Prof. Moya',
  };

  it('construye el resumen de una asignatura aprobada', () => {
    const summary = buildSubjectSummary(subject, 6.24, 5.86);

    expect(summary).toMatchObject({
      subjectId: 'sub_1',
      name: 'Matemáticas',
      code: 'MAT',
      color: '#1e40af',
      teacher: 'Prof. Moya',
      semester1: 6.2,
      semester2: 5.9,
      finalAverage: 6.1,
      approved: true,
    });
  });

  it('marca una asignatura reprobada cuando el promedio es menor a 4.0', () => {
    const summary = buildSubjectSummary(subject, 3.8, 3.9);
    expect(summary.finalAverage).toBe(3.9);
    expect(summary.approved).toBe(false);
  });

  it('deja aprobación en null cuando no hay notas', () => {
    const summary = buildSubjectSummary(subject, null, null);
    expect(summary.semester1).toBeNull();
    expect(summary.semester2).toBeNull();
    expect(summary.finalAverage).toBeNull();
    expect(summary.approved).toBeNull();
  });

  it('tolera un profesor ausente', () => {
    const summary = buildSubjectSummary({ id: 'x', name: 'Inglés' }, 6, null);
    expect(summary.teacher).toBeNull();
    expect(summary.finalAverage).toBe(6);
  });
});

describe('domain/grades · resumen general del alumno', () => {
  const subjects = [
    { id: 'mat', name: 'Matemáticas', code: 'MAT', color: '#1e40af' },
    { id: 'len', name: 'Lenguaje', code: 'LEN', color: '#2563eb' },
    { id: 'ing', name: 'Inglés', code: 'ING', color: '#0f766e' },
  ];

  it('calcula promedios, aprobadas, reprobadas y pendientes', () => {
    const summary = buildGradeSummary(subjects, [
      { subject_id: 'mat', semester: 1, score: 6.0 },
      { subject_id: 'mat', semester: 2, score: 5.0 },
      { subject_id: 'len', semester: 1, score: 3.0 },
      { subject_id: 'len', semester: 2, score: 4.0 },
    ]);

    expect(summary.subjects).toHaveLength(3);
    expect(summary.generalAverage).toBe(4.5);
    expect(summary.approvedSubjects).toBe(1);
    expect(summary.totalSubjects).toBe(3);
    expect(summary.evaluatedSubjects).toBe(2);
    expect(summary.subjects.find((item) => item.subjectId === 'ing')).toMatchObject({
      finalAverage: null,
      approved: null,
    });
  });

  it('devuelve un resumen vacío sin asignaturas', () => {
    const summary = buildGradeSummary([], []);
    expect(summary).toEqual({
      subjects: [],
      generalAverage: null,
      approvedSubjects: 0,
      totalSubjects: 0,
      evaluatedSubjects: 0,
    });
  });

  it('ignora notas huérfanas de asignaturas que no existen', () => {
    const summary = buildGradeSummary(
      [{ id: 'mat', name: 'Matemáticas' }],
      [
        { subject_id: 'mat', semester: 1, score: 7 },
        { subject_id: 'fantasma', semester: 1, score: 1 },
      ],
    );
    expect(summary.subjects).toHaveLength(1);
    expect(summary.generalAverage).toBe(7);
  });

  it('aplica el umbral de aprobación exactamente en 4.0', () => {
    const summary = buildGradeSummary(
      [{ id: 'mat', name: 'Matemáticas' }],
      [
        { subject_id: 'mat', semester: 1, score: 4.0 },
        { subject_id: 'mat', semester: 2, score: 4.0 },
      ],
    );
    expect(summary.subjects[0].approved).toBe(true);
    expect(summary.generalAverage).toBe(4);
  });
});
