import { db } from '../db/connection.js';
import { makeId, nowIso } from '../utils/id.js';

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subject: row.subject,
  dueDate: row.due_date,
  priority: row.priority,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCompletion = (row) => ({
  id: row.id,
  taskId: row.task_id,
  studentName: row.student_name,
  completed: row.completed === 1,
  completedAt: row.completed_at,
  updatedAt: row.updated_at,
});

export const taskRepository = {
  list({ subject, q, studentName, completed, limit, offset }) {
    const conditions = [];
    const params = [];

    if (subject) {
      conditions.push('t.subject = ? COLLATE NOCASE');
      params.push(subject);
    }
    if (q) {
      conditions.push('(t.title LIKE ? COLLATE NOCASE OR t.description LIKE ? COLLATE NOCASE)');
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (completed !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM task_completions c
                 WHERE c.task_id = t.id AND c.student_name = ? COLLATE NOCASE
                 AND c.completed = ?)`,
      );
      params.push(studentName, completed ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) AS count FROM tasks t ${where}`).get(...params).count;
    const rows = db
      .prepare(
        `SELECT t.* FROM tasks t ${where}
         ORDER BY (t.due_date IS NULL) ASC, t.due_date ASC, t.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset);

    return { items: rows.map(mapTask), total };
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? mapTask(row) : null;
  },

  create(data) {
    const id = makeId('tsk');
    const timestamp = nowIso();
    db.prepare(
      `INSERT INTO tasks
         (id, title, description, subject, priority, due_date, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      data.title,
      data.description ?? null,
      data.subject,
      data.priority ?? null,
      data.dueDate ?? null,
      data.createdBy,
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
      description: 'description',
      subject: 'subject',
      priority: 'priority',
      dueDate: 'due_date',
      createdBy: 'created_by',
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
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  remove(id) {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  listCompletionsForTasks(taskIds) {
    if (!taskIds.length) return [];
    const placeholders = taskIds.map(() => '?').join(', ');
    const rows = db
      .prepare(
        `SELECT * FROM task_completions WHERE task_id IN (${placeholders})
         ORDER BY student_name COLLATE NOCASE ASC`,
      )
      .all(...taskIds);
    return rows.map(mapCompletion);
  },

  listCompletions(taskId) {
    const rows = db
      .prepare(
        `SELECT * FROM task_completions WHERE task_id = ?
         ORDER BY student_name COLLATE NOCASE ASC`,
      )
      .all(taskId);
    return rows.map(mapCompletion);
  },

  findCompletion(taskId, studentName) {
    const row = db
      .prepare(
        `SELECT * FROM task_completions
         WHERE task_id = ? AND student_name = ? COLLATE NOCASE`,
      )
      .get(taskId, studentName);
    return row ? mapCompletion(row) : null;
  },

  upsertCompletion({ taskId, studentName, completed }) {
    const timestamp = nowIso();
    const completedAt = completed ? timestamp : null;
    db.prepare(
      `INSERT INTO task_completions
         (id, task_id, student_name, completed, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (task_id, student_name) DO UPDATE SET
         completed = excluded.completed,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at`,
    ).run(makeId('cmp'), taskId, studentName, completed ? 1 : 0, completedAt, timestamp);
    return this.findCompletion(taskId, studentName);
  },

  removeCompletion(taskId, studentName) {
    const result = db
      .prepare(
        `DELETE FROM task_completions
         WHERE task_id = ? AND student_name = ? COLLATE NOCASE`,
      )
      .run(taskId, studentName);
    return result.changes > 0;
  },
};
