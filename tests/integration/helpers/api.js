/**
 * Arnés de pruebas de integración de la API de IntraNerd.
 *
 * Cada archivo de prueba llama a `createTestApi()` una vez: se crea una base
 * SQLite temporal y aislada, se inicializa el esquema, se cargan los datos de
 * demostración y se devuelve un cliente Supertest apuntando a la app Express
 * real. Nunca se toca `backend/data/intranerd.db`.
 *
 * IMPORTANTE: las variables de entorno deben existir *antes* de importar
 * cualquier módulo del backend, porque `config/env.js` las congela al cargarse.
 * Por eso los imports de la app son dinámicos dentro de la función.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';

const BACKEND = '../../../backend/src';

/**
 * Crea una instancia aislada de la API.
 *
 * @param {{ seed?: boolean }} options
 * @returns {Promise<{
 *   app: import('express').Express,
 *   client: import('supertest').SuperTest<import('supertest').Test>,
 *   dir: string,
 *   modules: Record<string, any>,
 *   close: () => Promise<void>,
 * }>}
 */
export async function createTestApi({ seed = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'intranerd-it-'));
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_PATH = join(dir, 'test.db');
  process.env.UPLOAD_DIR = join(dir, 'uploads');
  process.env.SEED_ON_START = 'false';
  process.env.RATE_LIMIT_MAX = '0';

  // Imports dinámicos: garantizan que `env` lea las rutas temporales de arriba.
  const [{ default: app }, connection, seedModule, gradeServiceModule] = await Promise.all([
    import(`${BACKEND}/app.js`),
    import(`${BACKEND}/db/connection.js`),
    import(`${BACKEND}/db/seed.js`),
    import(`${BACKEND}/services/grade.service.js`),
  ]);

  connection.initializeSchema();
  if (seed) seedModule.seedDatabase({ force: true });

  return {
    app,
    client: request(app),
    dir,
    modules: {
      connection,
      seed: seedModule,
      gradeService: gradeServiceModule.gradeService,
    },
    async close() {
      try {
        connection.closeDatabase();
      } catch {
        // El cierre puede fallar si la prueba ya cerró la conexión.
      }
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Extrae el cuerpo `data` de una respuesta exitosa. */
export function dataOf(response) {
  return response.body?.data;
}

/** Comprueba la envoltura estándar de éxito. */
export function expectSuccess(response, status = 200) {
  if (response.status !== status) {
    throw new Error(
      `Se esperaba HTTP ${status} y se recibió ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
  if (response.body?.success !== true || response.body?.error !== null) {
    throw new Error(`Envoltura de éxito inválida: ${JSON.stringify(response.body)}`);
  }
  return response.body.data;
}

/** Comprueba la envoltura estándar de error. */
export function expectError(response, status) {
  if (response.status !== status) {
    throw new Error(
      `Se esperaba HTTP ${status} y se recibió ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
  if (response.body?.success !== false || response.body?.data !== null) {
    throw new Error(`Envoltura de error inválida: ${JSON.stringify(response.body)}`);
  }
  if (typeof response.body.error !== 'string' || response.body.error.length === 0) {
    throw new Error(`Falta el mensaje de error: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}
