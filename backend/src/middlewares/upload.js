import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Tipos permitidos. Deliberadamente excluimos SVG porque puede contener
 * scripts y ejecutarse al abrirse en el navegador.
 */
const MIME_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['application/pdf', '.pdf'],
]);

function getBoundary(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  return match ? (match[1] ?? match[2]).trim() : null;
}

function parseHeaders(rawHeaders) {
  const headers = {};
  for (const line of rawHeaders.split('\r\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }
  return headers;
}

function parseDisposition(value = '') {
  const name = /(?:^|;)\s*name="([^"]*)"/i.exec(value)?.[1];
  const filename = /(?:^|;)\s*filename="([^"]*)"/i.exec(value)?.[1];
  return { name, filename };
}

function safeOriginalName(filename) {
  return path.basename(filename.replaceAll('\\', '/')).slice(0, 180) || 'archivo';
}

async function readBody(req, maxBytes) {
  const declaredLength = Number.parseInt(req.get('content-length') ?? '0', 10);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw ApiError.payloadTooLarge(
      `La petición supera el límite de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw ApiError.payloadTooLarge(
        `La petición supera el límite de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      );
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Parser multipart/form-data sin dependencias externas (sustituye a Multer).
 * Guarda los archivos con un nombre aleatorio y una extensión derivada del MIME.
 */
async function parseMultipart(req, allowedFields) {
  const boundary = getBoundary(req.get('content-type'));
  if (!boundary) {
    throw ApiError.badRequest('La petición multipart no incluye un boundary válido.');
  }

  const maxBodyBytes = env.maxUploadBytes * env.maxUploadFiles + 2 * 1024 * 1024;
  const buffer = await readBody(req, maxBodyBytes);

  const initialDelimiter = Buffer.from(`--${boundary}`);
  const partDelimiter = Buffer.from(`\r\n--${boundary}`);
  const first = buffer.indexOf(initialDelimiter);
  if (first === -1) {
    throw ApiError.badRequest('El cuerpo multipart está mal formado.');
  }

  await fs.mkdir(env.uploadDir, { recursive: true });

  const body = {};
  const files = {};
  const savedFiles = [];
  req.uploadedFiles = savedFiles;

  let position = first + initialDelimiter.length;

  while (position < buffer.length) {
    // "--" final del multipart.
    if (buffer[position] === 45 && buffer[position + 1] === 45) break;

    // Salto de línea posterior al boundary.
    if (buffer[position] === 13 && buffer[position + 1] === 10) position += 2;

    const nextBoundary = buffer.indexOf(partDelimiter, position);
    if (nextBoundary === -1) {
      throw ApiError.badRequest('El cuerpo multipart está incompleto.');
    }

    const part = buffer.subarray(position, nextBoundary);
    position = nextBoundary + partDelimiter.length;

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headers = parseHeaders(part.subarray(0, headerEnd).toString('utf8'));
    const content = part.subarray(headerEnd + 4);
    const { name: fieldName, filename } = parseDisposition(headers['content-disposition']);

    if (!fieldName) continue;
    if (fieldName === '_charset_') continue;

    // Campo de texto.
    if (filename === undefined) {
      body[fieldName] = content.toString('utf8');
      continue;
    }

    // Un input file vacío llega con filename="" y sin contenido.
    if (!filename || content.length === 0) continue;

    if (!allowedFields.has(fieldName)) {
      throw ApiError.badRequest(
        `Campo de archivo no permitido: "${fieldName}". Permitidos: ${[...allowedFields].join(', ')}.`,
      );
    }

    if (savedFiles.length >= env.maxUploadFiles) {
      throw ApiError.payloadTooLarge(
        `Solo se permiten ${env.maxUploadFiles} archivos por petición.`,
      );
    }

    if (content.length > env.maxUploadBytes) {
      throw ApiError.payloadTooLarge(
        `Cada archivo debe pesar como máximo ${Math.round(env.maxUploadBytes / 1024 / 1024)} MB.`,
      );
    }

    const mimeType = (headers['content-type'] ?? 'application/octet-stream')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const extension = MIME_EXTENSIONS.get(mimeType);
    if (!extension) {
      throw ApiError.unprocessable(
        `Tipo de archivo no permitido: ${mimeType}. Usa imágenes, video MP4/WebM o PDF.`,
      );
    }

    const storedName = `${Date.now()}-${randomUUID().replaceAll('-', '').slice(0, 12)}${extension}`;
    const absolutePath = path.join(env.uploadDir, storedName);
    await fs.writeFile(absolutePath, content);

    const file = {
      field: fieldName,
      originalName: safeOriginalName(filename),
      filename: storedName,
      path: absolutePath,
      url: `/uploads/${storedName}`,
      mimeType,
      size: content.length,
    };

    savedFiles.push(file);
    files[fieldName] = files[fieldName] ? [...files[fieldName], file] : [file];
  }

  return { body, files };
}

/**
 * Middleware de carga. Acepta JSON (sin archivos) y multipart/form-data.
 * @param {{ fields?: string[] }} options
 */
export function upload({ fields = ['photo', 'evidence', 'file'] } = {}) {
  const allowedFields = new Set(fields);

  return async function uploadMiddleware(req, _res, next) {
    req.files = {};
    req.uploadedFiles = [];

    if (!req.is('multipart/form-data')) return next();

    try {
      const { body, files } = await parseMultipart(req, allowedFields);
      req.body = { ...(req.body ?? {}), ...body };
      req.files = files;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Primer archivo de un campo, o undefined. */
export function firstFile(req, field) {
  return req.files?.[field]?.[0];
}

/** Elimina archivos temporales cuando una petición termina en error. */
export async function cleanupUploads(req) {
  const files = req?.uploadedFiles ?? [];
  await Promise.allSettled(files.map((file) => fs.unlink(file.path)));
}
