/** Redondea a un decimal, igual que la calculadora original del frontend. */
export function round1(value) {
  return Math.round(value * 10) / 10;
}

export function average(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return round1(total / values.length);
}

export const PASSING_GRADE = 4.0;

export function gradeStatus(finalAverage) {
  if (finalAverage === null) return 'SIN_NOTAS';
  return finalAverage >= PASSING_GRADE ? 'APROBADO' : 'REPROBADO';
}
