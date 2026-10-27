import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raíz del backend (backend/). */
export const rootDir = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Node >= 20.12 trae process.loadEnvFile, así evitamos la dependencia dotenv.
try {
  process.loadEnvFile(path.join(rootDir, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'si', 'sí'].includes(String(value).toLowerCase());
};

const resolveFromRoot = (value) => path.resolve(rootDir, value);

const corsOrigins = (process.env.CORS_ORIGINS ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: toInt(process.env.PORT, 4000),
  dbPath: resolveFromRoot(process.env.DATABASE_PATH ?? 'data/intranerd.db'),
  uploadDir: resolveFromRoot(process.env.UPLOAD_DIR ?? 'uploads'),
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 10) * 1024 * 1024,
  maxUploadFiles: 4,
  bodyLimit: '1mb',
  corsOrigins,
  allowAllOrigins: corsOrigins.includes('*'),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 300),
  rateLimitWindowMs: 60_000,
  seedOnStart: toBool(
    process.env.SEED_ON_START ?? process.env.SEED_DEMO,
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  ),
});
