/**
 * Entorno de pruebas unitarias.
 *
 * Algunos módulos puros viven junto a la capa de datos (por ejemplo
 * calendar.service.js) y su importación abre SQLite. Usamos una base temporal
 * para que las pruebas unitarias nunca toquen los datos reales del proyecto.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'intranerd-unit-'));

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = join(dir, 'unit.db');
process.env.UPLOAD_DIR = join(dir, 'uploads');
process.env.SEED_ON_START = 'false';
process.env.RATE_LIMIT_MAX = '0';
