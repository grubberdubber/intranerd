/**
 * Error controlado de la aplicación. El middleware global lo transforma en una
 * respuesta HTTP estandarizada.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code = 'APP_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Solicitud inválida', code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, { code, details });
  }

  static unauthorized(message = 'No autorizado') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Acceso denegado') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Conflicto con el estado actual del recurso', code = 'CONFLICT') {
    return new ApiError(409, message, { code });
  }

  static unprocessable(message = 'Datos inválidos', details = null) {
    return new ApiError(422, message, { code: 'VALIDATION_ERROR', details });
  }

  static payloadTooLarge(message = 'El archivo supera el tamaño permitido') {
    return new ApiError(413, message, { code: 'PAYLOAD_TOO_LARGE' });
  }
}
