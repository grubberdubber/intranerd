import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

const buckets = new Map();

// Limpieza periódica para que el mapa no crezca indefinidamente.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanupTimer.unref();

/** Rate limit en memoria, suficiente para un despliegue de una sola instancia. */
export function rateLimit(req, res, next) {
  if (env.rateLimitMax <= 0 || env.isTest) return next();

  const now = Date.now();
  const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + env.rateLimitWindowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(env.rateLimitMax - bucket.count, 0);

  res.setHeader('RateLimit-Limit', String(env.rateLimitMax));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > env.rateLimitMax) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return sendError(res, 429, 'Demasiadas solicitudes. Intenta nuevamente en un momento.');
  }

  return next();
}
