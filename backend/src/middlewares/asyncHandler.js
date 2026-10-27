/**
 * Envuelve controladores para que cualquier rechazo llegue al error handler.
 * Express 5 ya lo hace, pero mantenerlo explícito documenta la intención.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
