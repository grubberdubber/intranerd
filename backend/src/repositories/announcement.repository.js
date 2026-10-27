import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapRow = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  authorName: row.author_name,
  authorRole: row.author_role,
  pinned: row.pinned === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const announcementRepository = {
  list({ category, pinned, q, limit, offset }) {
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (pinned !== undefined) {
      conditions.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }
    if (q) {
      conditions.push(
        '(title LIKE ? COLLATE NOCASE OR content LIKE ? COLLATE NOCASE OR author_name LIKE ? COLLATE NOCASE)',
      );
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM announcements ${where}`)
      .get(...params).count;
    const rows = db
      .prepare(
        `SELECT * FROM announcements ${where}
         ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return { items: rows.map(mapRow), total };
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  },

  create(data) {
    const id = makeId('ann');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO announcements
         (id, title, content, category, author_name, author_role, pinned,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.title,
      data.content,
      data.category ?? 'GENERAL',
      data.authorName,
      data.authorRole ?? 'DIRECTION',
      data.pinned ? 1 : 0,
      timestamp,
      timestamp,
    );
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];
    const columns = {
      title: 'title',
      content: 'content',
      category: 'category',
      authorName: 'author_name',
      authorRole: 'author_role',
    };

    for (const [key, column] of Object.entries(columns)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(data[key]);
      }
    }
    if (data.pinned !== undefined) {
      sets.push('pinned = ?');
      params.push(data.pinned ? 1 : 0);
    }

    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(nowIso(), id);
    db.prepare(`UPDATE announcements SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  setPinned(id, pinned) {
    const result = db
      .prepare('UPDATE announcements SET pinned = ?, updated_at = ? WHERE id = ?')
      .run(pinned ? 1 : 0, nowIso(), id);
    return result.changes > 0 ? this.findById(id) : null;
  },

  remove(id) {
    const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
