import { ZodError } from 'zod';

/**
 * Valida params, query y body con esquemas Zod y deja el resultado en
 * `req.validated`. Los controladores nunca leen datos sin validar.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    try {
      const validated = {};
      for (const part of ['params', 'query', 'body']) {
        if (schemas[part]) {
          validated[part] = schemas[part].parse(req[part] ?? {});
        }
      }
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
}
