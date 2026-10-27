import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subject: row.subject,
  date: row.event_date,
  role: row.role,
  authorName: row.author_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const calendarRepository = {
  list({ year, month, role, from, to, authorName, limit = 500 }) {
    const conditions = [];
    const params = [];

    if (year) {
      conditions.push('substr(event_date, 1, 4) = ?');
      params.push(String(year));
    }
    if (month) {
      conditions.push('substr(event_date, 6, 2) = ?');
      params.push(String(month).padStart(2, '0'));
    }
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (from) {
      conditions.push('event_date >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('event_date <= ?');
      params.push(to);
    }
    if (authorName) {
      conditions.push('author_name = ? COLLATE NOCASE');
      params.push(authorName);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT * FROM calendar_events ${where}
         ORDER BY event_date ASC, created_at ASC LIMIT ?`,
      )
      .all(...params, limit);
    return rows.map(mapRow);
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  },

  create({ title, description = null, subject = null, date, role, authorName }) {
    const id = makeId('evt');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO calendar_events
         (id, title, description, subject, event_date, role, author_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, title, description, subject, date, role, authorName, timestamp, timestamp);
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];
    const columns = {
      title: 'title',
      description: 'description',
      subject: 'subject',
      date: 'event_date',
      role: 'role',
      authorName: 'author_name',
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
    db.prepare(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  remove(id) {
    const result = db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
