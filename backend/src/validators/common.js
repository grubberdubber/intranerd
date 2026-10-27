import { z } from 'zod';

/** Campos comunes de paginación. */
export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/** Texto opcional: recorta y convierte cadenas vacías en undefined. */
export function optionalText(max = 255, message = 'El texto es demasiado largo') {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, z.string().max(max, message).optional());
}

/** Texto obligatorio recortado. */
export function requiredText(max = 255, message = 'Este campo es obligatorio') {
  return z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(max, `No puede superar ${max} caracteres`);
}

/** Convierte "true"/"false"/"1"/"0" en boolean (útil para query y multipart). */
export const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

/** Enum que acepta minúsculas y normaliza a mayúsculas. */
export function uppercaseEnum(values, message = 'Valor no permitido') {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
    z.enum(values, { error: message }),
  );
}

/** Número opcional que tolera "" (campos vacíos de multipart). */
export function optionalNumber({ min, max, integer = false } = {}) {
  let schema = z.coerce.number();
  if (integer) schema = schema.int('Debe ser un número entero');
  if (min !== undefined) schema = schema.min(min, `Debe ser mayor o igual a ${min}`);
  if (max !== undefined) schema = schema.max(max, `Debe ser menor o igual a ${max}`);

  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    schema.optional(),
  );
}

/** Fecha calendario YYYY-MM-DD, validando que exista realmente. */
export const dateOnly = z
  .string({ error: 'La fecha es obligatoria' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'La fecha indicada no existe');

export const optionalDateOnly = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  dateOnly.optional(),
);

/** URL http(s) o ruta relativa servida por la API (/uploads/...). */
const mediaUrlSchema = z
  .string()
  .trim()
  .max(1000, 'La URL es demasiado larga')
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith('/'),
    'Debe ser una URL http(s) o una ruta que empiece con /',
  );

export const optionalMediaUrl = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, mediaUrlSchema.optional());

/** Correo opcional que tolera cadena vacía. */
export const optionalEmail = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().email('El correo no es válido').max(180).optional());
