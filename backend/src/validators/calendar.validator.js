import { z } from 'zod';
import { dateOnly, optionalDateOnly, optionalText, requiredText } from './common.js';

const role = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toUpperCase();
    if (normalized === 'ALUMNO') return 'STUDENT';
    if (normalized === 'PROFESOR') return 'TEACHER';
    return normalized;
  },
  z.enum(['STUDENT', 'TEACHER'], { error: 'El rol debe ser STUDENT o TEACHER' }),
);

const currentYear = new Date().getFullYear();

export const calendarYearQuery = z.object({
  year: z.coerce
    .number()
    .int()
    .min(1900, 'El año mínimo es 1900')
    .max(2100, 'El año máximo es 2100')
    .default(currentYear),
});

export const calendarListQuery = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  role: role.optional(),
  from: optionalDateOnly,
  to: optionalDateOnly,
  authorName: optionalText(120),
});

export const calendarParams = z.object({
  id: z.string().trim().min(1),
});

export const createCalendarEventSchema = z.object({
  title: requiredText(150, 'El título de la prueba es obligatorio'),
  description: optionalText(2000),
  subject: optionalText(100),
  date: dateOnly,
  role,
  authorName: requiredText(120, 'El nombre del autor es obligatorio'),
});

export const updateCalendarEventSchema = z
  .object({
    title: requiredText(150).optional(),
    description: optionalText(2000),
    subject: optionalText(100),
    date: dateOnly.optional(),
    role: role.optional(),
    authorName: requiredText(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

// Re-export para reutilizar en otras capas si fuese necesario.
export { role as calendarRoleSchema };
