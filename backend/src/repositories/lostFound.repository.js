import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapRow = (row) => ({
  id: row.id,
  type: row.item_type,
  reportedBy: row.reported_by,
  contact: row.contact,
  description: row.description,
  location: row.location,
  category: row.category,
  photoUrl: row.photo_url,
  exampleImageUrl: row.example_image_url,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function buildFilters({ type, status, q }) {
  const conditions = [];
  const params = [];

  if (type) {
    conditions.push('item_type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (q) {
    conditions.push(
      '(description LIKE ? COLLATE NOCASE OR location LIKE ? COLLATE NOCASE OR reported_by LIKE ? COLLATE NOCASE)',
    );
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export const lostFoundRepository = {
  list({ type, status, q, limit, offset }) {
    const { where, params } = buildFilters({ type, status, q });
    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM lost_found_items ${where}`)
      .get(...params).count;
    const rows = db
      .prepare(
        `SELECT * FROM lost_found_items ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);
    return { items: rows.map(mapRow), total };
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM lost_found_items WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  },

  create(data) {
    const id = makeId('lfi');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO lost_found_items
         (id, item_type, reported_by, contact, description, location, category,
          photo_url, example_image_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.type,
      data.reportedBy,
      data.contact,
      data.description,
      data.location ?? null,
      data.category ?? null,
      data.photoUrl ?? null,
      data.exampleImageUrl ?? null,
      data.status ?? 'OPEN',
      timestamp,
      timestamp,
    );
    return this.findById(id);
  },

  update(id, data) {
    const sets = [];
    const params = [];
    const columns = {
      type: 'item_type',
      reportedBy: 'reported_by',
      contact: 'contact',
      description: 'description',
      location: 'location',
      category: 'category',
      photoUrl: 'photo_url',
      exampleImageUrl: 'example_image_url',
      status: 'status',
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
    db.prepare(`UPDATE lost_found_items SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  setStatus(id, status) {
    const result = db
      .prepare('UPDATE lost_found_items SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, nowIso(), id);
    return result.changes > 0 ? this.findById(id) : null;
  },

  remove(id) {
    const result = db.prepare('DELETE FROM lost_found_items WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
