import { describe, expect, it } from 'vitest';
import { PASSING_GRADE, average, gradeStatus, round1 } from '../../backend/src/utils/grading.js';

describe('utils/grading', () => {
  it('redondea a un decimal', () => {
    expect(round1(3.14159)).toBe(3.1);
    expect(round1(5.55)).toBe(5.6);
    expect(round1(4)).toBe(4);
  });

  it('promedia arreglos y devuelve null si están vacíos', () => {
    expect(average([6, 5, 4])).toBe(5);
    expect(average([4.25, 4.25])).toBe(4.3);
    expect(average([])).toBeNull();
  });

  it('clasifica el estado académico con el umbral 4.0', () => {
    expect(PASSING_GRADE).toBe(4);
    expect(gradeStatus(null)).toBe('SIN_NOTAS');
    expect(gradeStatus(3.9)).toBe('REPROBADO');
    expect(gradeStatus(4.0)).toBe('APROBADO');
    expect(gradeStatus(6.9)).toBe('APROBADO');
  });
});
