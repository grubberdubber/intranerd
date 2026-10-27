import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapWorkshop = (row) => {
  const enrolledCount = Number(row.enrolled_count ?? 0);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    schedule: row.schedule,
    location: row.location,
    teacherName: row.teacher_name,
    capacity: row.capacity,
    enrolledCount,
    availableSpots: Math.max(row.capacity - enrolledCount, 0),
    isFull: enrolledCount >= row.capacity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapEnrollment = (row) => ({
  id: row.id,
  workshopId: row.workshop_id,
  studentName: row.student_name,
  studentEmail: row.student_email,
  course: row.course,
  createdAt: row.created_at,
});

const ENROLLED_COUNT_SUBQUERY =
  '(SELECT COUNT(*) FROM workshop_enrollments e WHERE e.workshop_id = w.id)';

export const workshopRepository = {
  list({ q, category, available, limit, offset }) {
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push(
        '(w.name LIKE ? COLLATE NOCASE OR w.description LIKE ? COLLATE NOCASE OR w.teacher_name LIKE ? COLLATE NOCASE)',
      );
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (category) {
      conditions.push('w.category = ? COLLATE NOCASE');
      params.push(category);
    }
    if (available === true) {
      conditions.push(`${ENROLLED_COUNT_SUBQUERY} < w.capacity`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM workshops w ${where}`)
      .get(...params).count;
    const rows = db
      .prepare(
        `SELECT w.*, ${ENROLLED_COUNT_SUBQUERY} AS enrolled_count
         FROM workshops w ${where}
         ORDER BY w.name COLLATE NOCASE ASC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return { items: rows.map(mapWorkshop), total };
  },

  findById(id) {
    const row = db
      .prepare(
        `SELECT w.*, ${ENROLLED_COUNT_SUBQUERY} AS enrolled_count
         FROM workshops w WHERE w.id = ?`,
      )
      .get(id);
    return row ? mapWorkshop(row) : null;
  },

  create(data) {
    const id = makeId('wsp');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO workshops
         (id, name, description, category, schedule, location, teacher_name,
          capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.name,
      data.description ?? null,
      data.category ?? null,
      data.schedule ?? null,
      data.location ?? null,
      data.teacherName ?? null,
      data.capacity,
      timestamp,
      timestamp,
    );
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];
    const columns = {
      name: 'name',
      description: 'description',
      category: 'category',
      schedule: 'schedule',
      location: 'location',
      teacherName: 'teacher_name',
      capacity: 'capacity',
    };

    for (const [key, column] of Object.entries(columns)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(data[key]);
      }
    }

    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(nowIso(), id);
    db.prepare(`UPDATE workshops SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  remove(id) {
    const result = db.prepare('DELETE FROM workshops WHERE id = ?').run(id);
    return result.changes > 0;
  },

  countEnrollments(workshopId) {
    return db
      .prepare('SELECT COUNT(*) AS count FROM workshop_enrollments WHERE workshop_id = ?')
      .get(workshopId).count;
  },

  listEnrollments(workshopId) {
    const rows = db
      .prepare(
        `SELECT * FROM workshop_enrollments WHERE workshop_id = ?
         ORDER BY created_at ASC`,
      )
      .all(workshopId);
    return rows.map(mapEnrollment);
  },

  findEnrollment(workshopId, studentName) {
    const row = db
      .prepare(
        `SELECT * FROM workshop_enrollments
         WHERE workshop_id = ? AND student_name = ? COLLATE NOCASE`,
      )
      .get(workshopId, studentName);
    return row ? mapEnrollment(row) : null;
  },

  createEnrollment({ workshopId, studentName, studentEmail = null, course = null }) {
    const id = makeId('enr');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO workshop_enrollments
         (id, workshop_id, student_name, student_email, course, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, workshopId, studentName, studentEmail, course, timestamp);
    const row = db.prepare('SELECT * FROM workshop_enrollments WHERE id = ?').get(id);
    return mapEnrollment(row);
  },

  deleteEnrollment(workshopId, enrollmentId) {
    const result = db
      .prepare('DELETE FROM workshop_enrollments WHERE id = ? AND workshop_id = ?')
      .run(enrollmentId, workshopId);
    return result.changes > 0;
  },
};
