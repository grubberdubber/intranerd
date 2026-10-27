/** Reglas académicas chilenas: escala 1.0 – 7.0, aprobación desde 4.0. */
export const MIN_SCORE = 1;
export const MAX_SCORE = 7;
export const PASSING_SCORE = 4;

export function round1(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

export function isValidScore(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= MIN_SCORE && score <= MAX_SCORE;
}

/** Promedio simple de una lista de notas; null si está vacía. */
export function average(scores = []) {
  const valid = scores.map(Number).filter(isValidScore);
  if (valid.length === 0) return null;
  return round1(valid.reduce((sum, score) => sum + score, 0) / valid.length);
}

/**
 * Nota final de la asignatura: promedio 50/50 entre semestres disponibles.
 * Si solo existe un semestre, ese valor representa el avance actual.
 */
export function finalGrade(semester1, semester2) {
  const has1 = Number.isFinite(Number(semester1)) && semester1 !== null;
  const has2 = Number.isFinite(Number(semester2)) && semester2 !== null;
  if (has1 && has2) return round1((Number(semester1) + Number(semester2)) / 2);
  if (has1) return round1(semester1);
  if (has2) return round1(semester2);
  return null;
}

/** Promedio general: media de las notas finales de cada asignatura. */
export function generalAverage(subjectSummaries = []) {
  const finals = subjectSummaries
    .map((subject) => subject.finalAverage)
    .filter((value) => value !== null && value !== undefined);
  return average(finals);
}

export function buildSubjectSummary(subject, semester1, semester2) {
  const s1 = semester1 === null || semester1 === undefined ? null : round1(semester1);
  const s2 = semester2 === null || semester2 === undefined ? null : round1(semester2);
  const finalAverage = finalGrade(s1, s2);
  return {
    subjectId: subject.id,
    name: subject.name,
    code: subject.code,
    color: subject.color,
    teacher: subject.teacher_name ?? null,
    semester1: s1,
    semester2: s2,
    finalAverage,
    approved: finalAverage === null ? null : finalAverage >= PASSING_SCORE,
  };
}

/** Construye el resumen completo que consume el dashboard del alumno. */
export function buildGradeSummary(subjects, gradeRows) {
  const bySubject = new Map();
  for (const row of gradeRows) {
    if (!bySubject.has(row.subject_id)) bySubject.set(row.subject_id, {});
    bySubject.get(row.subject_id)[row.semester] = Number(row.score);
  }

  const summaries = subjects.map((subject) =>
    buildSubjectSummary(
      subject,
      bySubject.get(subject.id)?.[1] ?? null,
      bySubject.get(subject.id)?.[2] ?? null,
    ),
  );

  const graded = summaries.filter((subject) => subject.finalAverage !== null);
  return {
    subjects: summaries,
    generalAverage: generalAverage(summaries),
    approvedSubjects: graded.filter((subject) => subject.approved).length,
    totalSubjects: summaries.length,
    evaluatedSubjects: graded.length,
  };
}
