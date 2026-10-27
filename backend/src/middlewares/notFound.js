import { sendError } from '../utils/response.js';

export function notFoundHandler(req, res) {
  return sendError(
    res,
    404,
    `La ruta ${req.method} ${req.originalUrl} no existe en la API de IntraNerd.`,
  );
}
