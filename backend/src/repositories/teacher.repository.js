import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';
import { round1 } from '../utils/grading.js';

const mapTeacher = (row) => ({
  id: row.id,
  name: row.name,
  subject: row.subject,
  photoUrl: row.photo_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapReview = (row) => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentName: row.student_name,
  text: row.content,
  rating: row.rating,
  evidenceUrl: row.evidence_url,
  createdAt: row.created_at,
});

function statsFor(teacherId) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(rating), 0) AS total,
              COALESCE(AVG(rating), 0) AS average
       FROM teacher_reviews WHERE teacher_id = ?`,
    )
    .get(teacherId);

  return {
    reviewCount: row.count,
    totalPoints: row.total,
    averageRating: row.count ? round1(row.average) : 0,
  };
}

export const teacherRepository = {
  list({ q, subject, limit, offset }) {
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push('(name LIKE ? COLLATE NOCASE OR subject LIKE ? COLLATE NOCASE)');
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (subject) {
      conditions.push('subject = ? COLLATE NOCASE');
      params.push(subject);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM teachers ${where}`)
      .get(...params).count;
    const rows = db
      .prepare(
        `SELECT * FROM teachers ${where}
         ORDER BY name COLLATE NOCASE ASC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return {
      items: rows.map((row) => ({ ...mapTeacher(row), ...statsFor(row.id) })),
      total,
    };
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!row) return null;

    const distributionRows = db
      .prepare(
        `SELECT rating, COUNT(*) AS count FROM teacher_reviews
         WHERE teacher_id = ? GROUP BY rating`,
      )
      .all(id);
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of distributionRows) ratingDistribution[entry.rating] = entry.count;

    return {
      ...mapTeacher(row),
      ...statsFor(id),
      ratingDistribution,
    };
  },

  create({ name, subject = null, photoUrl = null }) {
    const id = makeId('tch');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO teachers (id, name, subject, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, name, subject, photoUrl, timestamp, timestamp);
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];

    if (data.name !== undefined) {
      sets.push('name = ?');
      params.push(data.name);
    }
    if (data.subject !== undefined) {
      sets.push('subject = ?');
      params.push(data.subject);
    }
    if (data.photoUrl !== undefined) {
      sets.push('photo_url = ?');
      params.push(data.photoUrl);
    }

    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(nowIso(), id);
    db.prepare(`UPDATE teachers SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  remove(id) {
    const result = db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
    return result.changes > 0;
  },

  listReviews(teacherId) {
    const rows = db
      .prepare('SELECT * FROM teacher_reviews WHERE teacher_id = ? ORDER BY created_at DESC')
      .all(teacherId);
    return rows.map(mapReview);
  },

  findReview(teacherId, reviewId) {
    const row = db
      .prepare('SELECT * FROM teacher_reviews WHERE id = ? AND teacher_id = ?')
      .get(reviewId, teacherId);
    return row ? mapReview(row) : null;
  },

  createReview({ teacherId, studentName, text, rating, evidenceUrl = null }) {
    const id = makeId('rev');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO teacher_reviews
         (id, teacher_id, student_name, content, rating, evidence_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, teacherId, studentName, text, rating, evidenceUrl, timestamp);
    return this.findReview(teacherId, id);
  },

  removeReview(teacherId, reviewId) {
    const result = db
      .prepare('DELETE FROM teacher_reviews WHERE id = ? AND teacher_id = ?')
      .run(reviewId, teacherId);
    return result.changes > 0;
  },
};
