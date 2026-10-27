import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapSubject = (row) => ({
  id: row.id,
  name: row.name,
  studentName: row.student_name,
  teacherName: row.teacher_name,
  color: row.color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapGrade = (row) => ({
  id: row.id,
  subjectId: row.subject_id,
  semester: row.semester,
  value: row.value,
  label: row.label,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const subjectRepository = {
  list(studentName) {
    const rows = studentName
      ? db
          .prepare(
            'SELECT * FROM subjects WHERE student_name = ? COLLATE NOCASE ORDER BY created_at ASC',
          )
          .all(studentName)
      : db.prepare('SELECT * FROM subjects ORDER BY created_at ASC').all();
    return rows.map(mapSubject);
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    return row ? mapSubject(row) : null;
  },

  create({ name, studentName, teacherName = null, color = null }) {
    const id = makeId('sub');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO subjects (id, name, student_name, teacher_name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, name, studentName, teacherName, color, timestamp, timestamp);
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];

    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.studentName !== undefined) {
      sets.push('student_name = ?');
      params.push(data.studentName);
    }
    if (data.teacherName !== undefined) {
      sets.push('teacher_name = ?');
      params.push(data.teacherName);
    }
    if (data.color !== undefined) {
      sets.push('color = ?');
      params.push(data.color);
    }

    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(nowIso(), id);
    db.prepare(`UPDATE subjects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  remove(id) {
    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
    return result.changes > 0;
  },

  listGradesBySubjectIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = db
      .prepare(
        `SELECT * FROM grades WHERE subject_id IN (${placeholders})
         ORDER BY semester ASC, created_at ASC`,
      )
      .all(...ids);
    return rows.map(mapGrade);
  },

  findGradeById(gradeId) {
    const row = db.prepare('SELECT * FROM grades WHERE id = ?').get(gradeId);
    return row ? mapGrade(row) : null;
  },

  createGrade({ subjectId, semester, value, label = null }) {
    const id = makeId('grd');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO grades (id, subject_id, semester, value, label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, subjectId, semester, value, label, timestamp, timestamp);
    return this.findGradeById(id);
  },

  updateGrade(gradeId, data) {
    const sets = [];
    const params = [];

    if (data.semester !== undefined) {
      sets.push('semester = ?');
      params.push(data.semester);
    }
    if (data.value !== undefined) {
      sets.push('value = ?');
      params.push(data.value);
    }
    if (data.label !== undefined) {
      sets.push('label = ?');
      params.push(data.label);
    }

    if (!sets.length) return this.findGradeById(gradeId);

    sets.push('updated_at = ?');
    params.push(nowIso(), gradeId);
    db.prepare(`UPDATE grades SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findGradeById(gradeId);
  },

  removeGrade(gradeId) {
    const result = db.prepare('DELETE FROM grades WHERE id = ?').run(gradeId);
    return result.changes > 0;
  },
};
