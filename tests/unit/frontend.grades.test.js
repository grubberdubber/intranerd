import { describe, expect, it } from 'vitest';
import {
  generalAverage,
  gradeTone,
  isValidGrade,
  sanitizeGrades,
  semesterAverage,
  subjectSummary,
} from '../../src/utils/grades.js';

/**
 * Módulo 1 · Cálculos académicos del frontend.
 * Deben replicar la regla del backend: escala 1.0–7.0, aprobación desde 4.0,
 * promedio simple por semestre y nota final 50/50 entre semestres disponibles.
 */
describe('utils/grades · validación de la escala', () => {
  it.each([
    [1, true],
    [7, true],
    [4, true],
    [6.9, true],
    ['5.5', true],
    [0.9, false],
    [7.1, false],
    [0, false],
    [-1, false],
    [null, false],
    [undefined, false],
    ['abc', false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])('isValidGrade(%p) → %p', (value, expected) => {
    expect(isValidGrade(value)).toBe(expected);
  });

  it('descarta valores inválidos al sanear una lista', () => {
    expect(sanitizeGrades([6, '5.5', 8, 0, null, 'x', 4.2])).toEqual([6, 5.5, 4.2]);
    expect(sanitizeGrades()).toEqual([]);
  });
});

describe('utils/grades · promedios', () => {
  it('promedia cada semestre con redondeo a un decimal', () => {
    expect(semesterAverage([6.5, 5.8, 6.2])).toBe(6.2);
    expect(semesterAverage([5.5, 6.0])).toBe(5.8);
    expect(semesterAverage([4.2, 5.0])).toBe(4.6);
    expect(semesterAverage([])).toBeNull();
  });

  it('ignora notas fuera de escala al promediar', () => {
    expect(semesterAverage([6, 0, 8, 5])).toBe(5.5);
  });

  it('combina ambos semestres en 50/50', () => {
    const summary = subjectSummary({ semester1: [6, 6], semester2: [5, 5] });
    expect(summary).toMatchObject({ first: 6, second: 5, final: 5.5, passed: true });
    expect(summary.status).toBe('Aprobado');
  });

  it('usa el semestre disponible cuando el otro está vacío', () => {
    expect(subjectSummary({ semester1: [6.2], semester2: [] })).toMatchObject({
      first: 6.2,
      second: null,
      final: 6.2,
    });
    expect(subjectSummary({ semester1: [], semester2: [5.4] })).toMatchObject({
      first: null,
      second: 5.4,
      final: 5.4,
    });
  });

  it('marca reprobación bajo 4.0 y pendiente sin notas', () => {
    const failed = subjectSummary({ semester1: [3.8], semester2: [3.9] });
    expect(failed.final).toBe(3.9);
    expect(failed.passed).toBe(false);
    expect(failed.status).toBe('Reprobado');

    const pending = subjectSummary({ semester1: [], semester2: [] });
    expect(pending).toMatchObject({
      first: null,
      second: null,
      final: null,
      passed: null,
      status: 'Sin notas',
    });
  });

  it('aprueba exactamente con 4.0', () => {
    const summary = subjectSummary({ semester1: [4.0], semester2: [4.0] });
    expect(summary.final).toBe(4);
    expect(summary.passed).toBe(true);
  });

  it('tolera una asignatura sin estructura', () => {
    expect(subjectSummary(undefined)).toMatchObject({ final: null, passed: null });
    expect(subjectSummary({})).toMatchObject({ final: null, passed: null });
  });

  it('calcula el promedio general solo con asignaturas evaluadas', () => {
    const subjects = [
      { semester1: [6], semester2: [6] },
      { semester1: [5], semester2: [5] },
      { semester1: [], semester2: [] },
    ];
    expect(generalAverage(subjects)).toBe(5.5);
    expect(generalAverage([])).toBeNull();
  });
});

describe('utils/grades · indicadores visuales', () => {
  it('asigna tono según el umbral de aprobación', () => {
    expect(gradeTone(6.2)).toBe('success');
    expect(gradeTone(4)).toBe('success');
    expect(gradeTone(3.9)).toBe('danger');
    expect(gradeTone(null)).toBe('muted');
    expect(gradeTone(undefined)).toBe('muted');
  });
});
