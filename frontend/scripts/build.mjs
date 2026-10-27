/**
 * Build de producción de la SPA (sin bundler).
 * Copia los activos estáticos, valida el punto de entrada e inyecta la
 * configuración de runtime (URL de la API) antes de servir con Nginx.
 */
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(root, 'dist');
const apiBase = process.env.INTRANERD_API_BASE ?? process.argv[2] ?? '/api';

const required = ['index.html', 'src/main.js', 'src/styles/main.css'];
for (const file of required) {
  try {
    await stat(join(root, file));
  } catch {
    console.error(`❌ Falta el archivo requerido para el build: ${file}`);
    process.exit(1);
  }
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of ['index.html', 'src', 'assets']) {
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}

const runtimeConfig = `/* Generado por frontend/scripts/build.mjs */\nwindow.INTRANERD_CONFIG = ${JSON.stringify(
  { api: { baseUrl: apiBase } },
  null,
  2,
)};\n`;
await writeFile(join(dist, 'runtime-config.js'), runtimeConfig, 'utf8');

const indexPath = join(dist, 'index.html');
let html = await readFile(indexPath, 'utf8');
if (!html.includes('runtime-config.js')) {
  html = html.replace(
    /<script type="module" src="\/?src\/main\.js"><\/script>/,
    '<script src="/runtime-config.js"></script>\n  <script type="module" src="/src/main.js"></script>',
  );
  await writeFile(indexPath, html, 'utf8');
}

if (!html.includes('runtime-config.js')) {
  console.error('❌ No se pudo inyectar runtime-config.js en index.html');
  process.exit(1);
}

console.log(`✅ SPA compilada en ${dist} (API: ${apiBase})`);
