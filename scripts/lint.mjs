#!/usr/bin/env node
/* lint-disable no-eval no-new-function no-document-write no-loose-equality no-loose-inequality todo-marker */
/**
 * Linter de guardrails sin dependencias.
 * Complementa a Prettier con reglas de seguridad y consistencia que un
 * formateador no puede verificar. Se ejecuta en CI y en `npm run lint`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const roots = ['src', 'backend/src', 'frontend/scripts', 'scripts', 'tests'];
const ignored = new Set(['node_modules', '.git', 'coverage', 'dist', 'legacy', 'test-results']);
const extensions = new Set(['.js', '.mjs']);

const rules = [
  { id: 'no-debugger', pattern: /\bdebugger\s*;/g, message: 'Elimina las sentencias debugger.' },
  { id: 'no-eval', pattern: /\beval\s*\(/g, message: 'eval() está prohibido por seguridad.' },
  {
    id: 'no-new-function',
    pattern: /new\s+Function\s*\(/g,
    message: 'new Function() está prohibido por seguridad.',
  },
  {
    id: 'no-document-write',
    pattern: /document\.write(?:ln)?\s*\(/g,
    message: 'document.write() está prohibido.',
  },
  { id: 'no-var', pattern: /(^|\n)\s*var\s+\w/g, message: 'Usa const/let en lugar de var.' },
  {
    id: 'no-loose-equality',
    pattern: /(?<![=!<>])==(?!=)/g,
    message: 'Compara siempre con igualdad estricta (=== / !==).',
  },
  {
    id: 'no-loose-inequality',
    pattern: /(?<![!])!=(?!=)/g,
    message: 'Compara siempre con igualdad estricta (=== / !==).',
  },
];

const warnings = [
  {
    id: 'todo-marker',
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/g,
    message: 'Hay marcadores TODO/FIXME pendientes.',
  },
];

/**
 * Directivas de excepción dentro del código:
 *   - Comentario con la palabra "lint-disable" + reglas: aplica a todo el archivo.
 *   - Comentario con "lint-disable-next-line" + reglas: aplica solo a la línea siguiente.
 */
const DISABLE_FILE = /lint-disable\s+([\w-]+(?:\s+[\w-]+)*)/g;
const DISABLE_NEXT = /lint-disable-next-line\s+([\w-]+(?:\s+[\w-]+)*)/g;

function parseDisables(content) {
  const fileWide = new Set();
  const nextLine = new Set();

  for (const match of content.matchAll(DISABLE_FILE)) {
    match[1].split(/\s+/).forEach((rule) => fileWide.add(rule));
  }
  for (const match of content.matchAll(DISABLE_NEXT)) {
    const line = lineOf(content, match.index) + 1;
    match[1].split(/\s+/).forEach((rule) => nextLine.add(`${rule}:${line}`));
  }

  return { fileWide, nextLine };
}

async function* walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (extensions.has(extname(entry.name))) yield path;
  }
}

const errors = [];
const notes = [];

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

for (const folder of roots) {
  for await (const file of walk(join(root, folder))) {
    const absolute = resolve(file);
    const content = await readFile(absolute, 'utf8');
    const name = relative(root, absolute);

    if (!content.endsWith('\n')) {
      errors.push(`${name}: el archivo debe terminar con salto de línea.`);
    }
    if (/\r\n/.test(content)) {
      errors.push(`${name}: usa finales de línea LF.`);
    }

    const syntax = spawnSync(process.execPath, ['--check', absolute], { encoding: 'utf8' });
    if (syntax.status !== 0) {
      errors.push(`${name}: error de sintaxis.\n${syntax.stderr.trim()}`);
      continue;
    }

    const lines = content.split('\n');
    const disabled = parseDisables(content);

    for (const rule of rules) {
      if (disabled.fileWide.has(rule.id)) continue;
      for (const match of content.matchAll(rule.pattern)) {
        const line = lineOf(content, match.index);
        if (disabled.nextLine.has(`${rule.id}:${line}`)) continue;
        errors.push(`${name}:${line} · ${rule.id} → ${rule.message}`);
      }
    }
    for (const rule of warnings) {
      if (disabled.fileWide.has(rule.id)) continue;
      for (const match of content.matchAll(rule.pattern)) {
        const line = lineOf(content, match.index);
        if (disabled.nextLine.has(`${rule.id}:${line}`)) continue;
        notes.push(`${name}:${line} · ${rule.id} → ${rule.message}`);
      }
    }

    for (const [index, line] of lines.entries()) {
      if (line.length <= 120) continue;
      if (disabled.fileWide.has('max-line-length')) continue;
      if (disabled.nextLine.has(`max-line-length:${index + 1}`)) continue;
      errors.push(`${name}:${index + 1} · max-line-length → supera 120 caracteres.`);
    }
  }
}

for (const note of notes) console.warn(`⚠️  ${note}`);

if (errors.length) {
  console.error(`\n❌ ${errors.length} problema(s) encontrados:\n`);
  for (const error of errors) console.error(`   ${error}`);
  process.exit(1);
}

console.log(`✅ Lint correcto (${roots.join(', ')}).`);
