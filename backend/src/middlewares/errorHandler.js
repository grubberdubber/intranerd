import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/response.js';
import { cleanupUploads } from './upload.js';

function formatZodDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : '(root)',
    message: issue.message,
    code: issue.code,
  }));
}

function mapSqliteError(error) {
  if (!error || error.code !== 'ERR_SQLITE_ERROR') return null;

  if (error.errcode === 2067 || error.errcode === 1555) {
    return new ApiError(409, 'El recurso ya existe o viola una restricción de unicidad.', {
      code: 'DUPLICATE_RESOURCE',
    });
  }
  if (error.errcode === 787) {
    return new ApiError(409, 'El recurso relacionado no existe o está en uso.', {
      code: 'FOREIGN_KEY_CONFLICT',
    });
  }
  if (error.errcode === 275) {
    return new ApiError(422, 'Los datos no cumplen una restricción de la base de datos.', {
      code: 'DATABASE_CONSTRAINT',
    });
  }
  return null;
}

/** Middleware global: normaliza TODOS los errores a la envoltura de la API. */
export async function errorHandler(error, req, res, next) {
  // Si la respuesta ya empezó a enviarse, delegamos en Express.
  if (res.headersSent) return next(error);

  // Los archivos subidos en una petición fallida no deben quedar huérfanos.
  await cleanupUploads(req);

  if (error instanceof ApiError) {
    const details = error.details ?? (error.code ? { code: error.code } : null);
    return sendError(res, error.statusCode, error.message, details);
  }

  if (error instanceof ZodError) {
    return sendError(res, 422, 'Datos de entrada inválidos.', formatZodDetails(error));
  }

  const sqliteError = mapSqliteError(error);
  if (sqliteError) {
    return sendError(res, sqliteError.statusCode, sqliteError.message, sqliteError.details);
  }

  if (error?.type === 'entity.parse.failed') {
    return sendError(res, 400, 'El cuerpo de la petición no es un JSON válido.');
  }

  if (error?.type === 'entity.too.large') {
    return sendError(res, 413, 'El cuerpo de la petición es demasiado grande.');
  }

  if (error?.status === 400) {
    return sendError(res, 400, error.message ?? 'Solicitud inválida.');
  }

  console.error(`[${new Date().toISOString()}] Error no controlado:`, error);
  return sendError(res, 500, 'Ocurrió un error interno en el servidor.');
}
