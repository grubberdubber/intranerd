import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

// Aseguramos que existan los directorios de datos y de cargas.
fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
fs.mkdirSync(env.uploadDir, { recursive: true });

export const db = new DatabaseSync(env.dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));

/**
 * Añade una columna si todavía no existe. `CREATE TABLE IF NOT EXISTS` no
 * modifica tablas ya creadas, así que las bases de datos previas necesitan
 * esta migración ligera para incorporar los campos nuevos.
 */
function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((entry) => entry.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}

/** Crea las tablas e índices que falten (operación idempotente). */
export function initializeSchema() {
  db.exec(fs.readFileSync(schemaPath, 'utf8'));

  // Campos incorporados para alinear la API con el modelo de la SPA.
  ensureColumn('lost_found_items', 'category', 'TEXT');
  ensureColumn('calendar_events', 'subject', 'TEXT');
  ensureColumn('workshop_enrollments', 'course', 'TEXT');
  ensureColumn('tasks', 'priority', 'TEXT');
}

/**
 * Ejecuta una función dentro de una transacción SQLite.
 * Usa BEGIN IMMEDIATE para bloquear escrituras concurrentes (control de cupos).
 */
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Si el rollback falla no ocultamos el error original.
    }
    throw error;
  }
}

export function closeDatabase() {
  db.close();
}
