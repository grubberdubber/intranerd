import { subjectRepository } from '../repositories/subject.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { average, gradeStatus, round1 } from '../utils/grading.js';

function groupBySemester(grades) {
  return {
    semester1: grades.filter((grade) => grade.semester === 1),
    semester2: grades.filter((grade) => grade.semester === 2),
  };
}

/**
 * Calcula promedios semestrales y final replicando la regla del frontend:
 * promedio simple por semestre, promedio de ambos semestres y aprobación >= 4.0.
 */
export function summarizeSubject(subject, grades) {
  const grouped = groupBySemester(grades);
  const semester1Average = average(grouped.semester1.map((grade) => grade.value));
  const semester2Average = average(grouped.semester2.map((grade) => grade.value));

  let finalAverage = null;
  if (semester1Average !== null && semester2Average !== null) {
    finalAverage = round1((semester1Average + semester2Average) / 2);
  } else if (semester1Average !== null) {
    finalAverage = semester1Average;
  } else if (semester2Average !== null) {
    finalAverage = semester2Average;
  }

  const status = gradeStatus(finalAverage);

  return {
    ...subject,
    grades: {
      semester1: grouped.semester1,
      semester2: grouped.semester2,
    },
    semesterAverages: {
      semester1: semester1Average,
      semester2: semester2Average,
    },
    finalAverage,
    status,
    approved: finalAverage === null ? null : finalAverage >= 4.0,
  };
}

function buildListSummary(subjects, grades, studentName = null) {
  const gradesBySubject = new Map();
  for (const grade of grades) {
    const list = gradesBySubject.get(grade.subjectId) ?? [];
    list.push(grade);
    gradesBySubject.set(grade.subjectId, list);
  }

  const summarized = subjects.map((subject) =>
    summarizeSubject(subject, gradesBySubject.get(subject.id) ?? []),
  );

  const finals = summarized
    .map((subject) => subject.finalAverage)
    .filter((value) => value !== null);
  const approvedCount = summarized.filter((subject) => subject.approved === true).length;
  const failedCount = summarized.filter((subject) => subject.approved === false).length;

  return {
    studentName,
    subjects: summarized,
    summary: {
      subjectCount: summarized.length,
      gradedSubjectCount: finals.length,
      approvedCount,
      failedCount,
      pendingCount: summarized.length - finals.length,
      generalAverage: finals.length
        ? round1(finals.reduce((sum, value) => sum + value, 0) / finals.length)
        : null,
      passingGrade: 4.0,
    },
  };
}

function loadSubjectSummary(id) {
  const subject = subjectRepository.findById(id);
  if (!subject) throw ApiError.notFound('La asignatura solicitada no existe.');
  const grades = subjectRepository.listGradesBySubjectIds([id]);
  return summarizeSubject(subject, grades);
}

export const gradeService = {
  list(query) {
    const subjects = subjectRepository.list(query.studentName);
    const grades = subjectRepository.listGradesBySubjectIds(subjects.map((subject) => subject.id));
    return buildListSummary(subjects, grades, query.studentName ?? null);
  },

  getSubject(id) {
    return loadSubjectSummary(id);
  },

  createSubject(payload) {
    const subject = subjectRepository.create(payload);
    return summarizeSubject(subject, []);
  },

  updateSubject(id, payload) {
    if (!subjectRepository.findById(id)) {
      throw ApiError.notFound('La asignatura solicitada no existe.');
    }
    subjectRepository.update(id, payload);
    return loadSubjectSummary(id);
  },

  removeSubject(id) {
    if (!subjectRepository.remove(id)) {
      throw ApiError.notFound('La asignatura solicitada no existe.');
    }
  },

  addGrade(subjectId, payload) {
    if (!subjectRepository.findById(subjectId)) {
      throw ApiError.notFound('La asignatura solicitada no existe.');
    }
    const grade = subjectRepository.createGrade({ subjectId, ...payload });
    return { grade, subject: loadSubjectSummary(subjectId) };
  },

  updateGrade(gradeId, payload) {
    const existing = subjectRepository.findGradeById(gradeId);
    if (!existing) throw ApiError.notFound('La nota solicitada no existe.');

    const grade = subjectRepository.updateGrade(gradeId, payload);
    return { grade, subject: loadSubjectSummary(existing.subjectId) };
  },

  removeGrade(gradeId) {
    const existing = subjectRepository.findGradeById(gradeId);
    if (!existing) throw ApiError.notFound('La nota solicitada no existe.');

    subjectRepository.removeGrade(gradeId);
    return { deletedGradeId: gradeId, subject: loadSubjectSummary(existing.subjectId) };
  },
};
