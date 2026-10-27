import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  age: row.age,
  description: row.description,
  lastSeenPlace: row.last_seen_place,
  contact: row.contact,
  photoUrl: row.photo_url,
  exampleImageUrl: row.example_image_url,
  status: row.status,
  found: row.status === 'FOUND',
  foundAt: row.found_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const missingPersonRepository = {
  list({ status, q, limit, offset }) {
    const conditions = [];
    const params = [];
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM missing_persons ${where} ORDER BY created_at DESC`)
      .all(...params);

    // SQLite NOCASE no pliega acentos (Inspectoría ≠ inspectoria); filtramos
    // en JS sobre un texto normalizado para una búsqueda realmente humana.
    const needle = normalizeSearch(q);
    const filtered = needle
      ? rows.filter((row) =>
          [row.name, row.last_seen_place, row.contact].some((field) =>
            normalizeSearch(field).includes(needle),
          ),
        )
      : rows;

    return {
      items: filtered.slice(offset, offset + limit).map(mapRow),
      total: filtered.length,
    };
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM missing_persons WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  },

  create(data) {
    const id = makeId('msp');
    const timestamp = nowIso();
    const status = data.status ?? 'MISSING';
    const foundAt = status === 'FOUND' ? timestamp : null;

    db.prepare(
      `INSERT INTO missing_persons
         (id, name, age, description, last_seen_place, contact, photo_url,
          example_image_url, status, found_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.name,
      data.age ?? null,
      data.description,
      data.lastSeenPlace,
      data.contact,
      data.photoUrl ?? null,
      data.exampleImageUrl ?? null,
      status,
      foundAt,
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
      age: 'age',
      description: 'description',
      lastSeenPlace: 'last_seen_place',
      contact: 'contact',
      photoUrl: 'photo_url',
      exampleImageUrl: 'example_image_url',
    };

    for (const [key, column] of Object.entries(columns)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(data[key]);
      }
    }

    if (data.status !== undefined) {
      sets.push('status = ?');
      params.push(data.status);
      sets.push('found_at = ?');
      params.push(data.status === 'FOUND' ? nowIso() : null);
    }

    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(nowIso(), id);
    db.prepare(`UPDATE missing_persons SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  setStatus(id, status) {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `UPDATE missing_persons
         SET status = ?, found_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(status, status === 'FOUND' ? timestamp : null, timestamp, id);
    return result.changes > 0 ? this.findById(id) : null;
  },

  remove(id) {
    const result = db.prepare('DELETE FROM missing_persons WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
