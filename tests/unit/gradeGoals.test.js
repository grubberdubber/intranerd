import { describe, expect, it } from 'vitest';
import {
  buildGradeGoal,
  isValidGoal,
  nextGradeForAverage,
  requiredSemesterAverages,
} from '../../src/utils/gradeGoals.js';

/**
 * Laboratorio de metas de nota: las fórmulas deben ser transparentes y
 * conservadoras. El otro semestre se mantiene igual y cada semestre promedia
 * sus notas de forma simple.
 */
describe('utils/gradeGoals · metas por semestre', () => {
  it('valida la meta dentro de la escala 1.0–7.0', () => {
    expect(isValidGoal(1)).toBe(true);
    expect(isValidGoal(7)).toBe(true);
    expect(isValidGoal('6.2')).toBe(true);
    expect(isValidGoal(0.9)).toBe(false);
    expect(isValidGoal(7.1)).toBe(false);
    expect(isValidGoal('')).toBe(false);
  });

  it('calcula el promedio necesario en cada semestre manteniendo el otro', () => {
    const subject = { semester1: [6, 6], semester2: [5, 5] };

    expect(requiredSemesterAverages(subject, 6)).toEqual({
      semester1: 7,
      semester2: 6,
    });
    expect(requiredSemesterAverages(subject, 5.5)).toEqual({
      semester1: 6,
      semester2: 5,
    });
  });

  it('calcula el semestre faltante cuando solo hay notas en uno', () => {
    expect(requiredSemesterAverages({ semester1: [6, 6] }, 5)).toEqual({
      semester1: null,
      semester2: 4,
    });
    expect(requiredSemesterAverages({ semester2: [5, 5] }, 6)).toEqual({
      semester1: 7,
      semester2: null,
    });
  });

  it('no inventa metas cuando no hay notas o la meta es inválida', () => {
    expect(requiredSemesterAverages({}, 6)).toEqual({ semester1: null, semester2: null });
    expect(requiredSemesterAverages({ semester1: [5] }, 8)).toEqual({
      semester1: null,
      semester2: null,
    });
  });
});

describe('utils/gradeGoals · próxima evaluación', () => {
  it('calcula la nota que falta para alcanzar el promedio del semestre', () => {
    const result = nextGradeForAverage([5, 6], 6);

    expect(result).toMatchObject({
      valid: true,
      current: 5.5,
      target: 6,
      count: 2,
      rounded: 7,
      feasible: true,
      achieved: false,
    });
  });

  it('detecta cuando una sola nota ya no alcanza', () => {
    const result = nextGradeForAverage([4, 5], 6);

    expect(result.rounded).toBe(9);
    expect(result.feasible).toBe(false);
  });

  it('detecta cuando la meta ya está cubierta con la nota mínima', () => {
    const result = nextGradeForAverage([7], 6);

    expect(result.rounded).toBe(5);
    expect(result.achieved).toBe(true);
    expect(result.secured).toBe(false);
  });

  it('usa la meta como primera nota cuando el semestre está vacío', () => {
    const result = nextGradeForAverage([], 5.5);

    expect(result.count).toBe(0);
    expect(result.rounded).toBe(5.5);
    expect(result.feasible).toBe(true);
  });
});

describe('utils/gradeGoals · resumen del simulador', () => {
  it('encuentra el camino más corto cuando la meta es posible', () => {
    const goal = buildGradeGoal({ semester1: [5.5], semester2: [5.5] }, 6);

    expect(goal.targetAchieved).toBe(false);
    expect(goal.canReach).toBe(true);
    expect(goal.easiest?.key).toBe('semester1');
    expect(goal.semesters.every((semester) => semester.status === 'posible')).toBe(true);
  });

  it('marca la meta como alcanzada si el promedio final ya la supera', () => {
    const goal = buildGradeGoal({ semester1: [6], semester2: [6] }, 5);

    expect(goal.targetAchieved).toBe(true);
    expect(goal.canReach).toBe(true);
    expect(goal.easiest).toBeNull();
    expect(goal.semesters.every((semester) => semester.status === 'cubierto')).toBe(true);
  });

  it('marca como imposible una meta que exige más de 7.0', () => {
    const goal = buildGradeGoal({ semester1: [6], semester2: [6] }, 7);

    expect(goal.targetAchieved).toBe(false);
    expect(goal.canReach).toBe(false);
    expect(goal.semesters.every((semester) => semester.status === 'imposible')).toBe(true);
  });

  it('devuelve un estado sin datos cuando la asignatura está vacía', () => {
    const goal = buildGradeGoal({}, 6);

    expect(goal.hasData).toBe(false);
    expect(goal.canReach).toBeNull();
    expect(goal.semesters.every((semester) => semester.status === 'sin-datos')).toBe(true);
  });
});
