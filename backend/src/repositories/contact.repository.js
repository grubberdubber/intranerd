import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  topic: row.topic,
  subject: row.subject,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
});

/**
 * Bandeja de entrada del colegio. No se expone listado público para proteger
 * los datos personales de quienes escriben; solo se confirma la recepción.
 */
export const contactRepository = {
  create(data) {
    const id = makeId('msg');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO contact_messages
         (id, name, email, role, topic, subject, message, consent, status,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?)`,
    ).run(
      id,
      data.name,
      data.email,
      data.role,
      data.topic,
      data.subject,
      data.message,
      data.consent ? 1 : 0,
      timestamp,
      timestamp,
    );
    return this.findById(id);
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  },
};
