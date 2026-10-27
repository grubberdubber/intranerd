/**
 * Servidor de desarrollo sin dependencias para la SPA.
 * Sirve el repositorio en http://localhost:5173 y proxya /api al backend.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const port = Number(process.env.PORT ?? 5173);
const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:4000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.yaml': 'application/yaml; charset=utf-8',
};

async function proxy(req, res) {
  const target = new URL(req.url, apiTarget);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: { ...req.headers, host: target.host },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()));
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: { code: 'BAD_GATEWAY', message: `No se pudo contactar la API: ${error.message}` },
      }),
    );
  }
}

createServer((req, res) => {
  // La API también sirve los archivos subidos en /uploads.
  if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) return proxy(req, res);

  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let filePath = normalize(join(root, pathname === '/' ? 'index.html' : pathname));

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.log(`🌐 IntraNerd dev: http://localhost:${port}  →  API ${apiTarget}`);
});
