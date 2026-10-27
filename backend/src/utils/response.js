/**
 * Envoltorio estándar de todas las respuestas de la API:
 *   { success: boolean, data: T | null, error: string | null }
 */
export function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

export function sendError(res, statusCode, message, details = null) {
  const payload = {
    success: false,
    data: null,
    error: message,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}
