import { z } from 'zod';
import { optionalMediaUrl, optionalText, paginationFields, requiredText } from './common.js';

export const teacherListQuery = z.object({
  ...paginationFields,
  q: optionalText(120),
  subject: optionalText(100),
});

export const teacherParams = z.object({
  id: z.string().trim().min(1),
});

export const teacherReviewParams = z.object({
  id: z.string().trim().min(1),
  reviewId: z.string().trim().min(1),
});

export const createTeacherSchema = z.object({
  name: requiredText(120, 'El nombre del profesor es obligatorio'),
  subject: optionalText(100),
  photoUrl: optionalMediaUrl,
});

export const updateTeacherSchema = z.object({
  name: requiredText(120).optional(),
  subject: optionalText(100),
  photoUrl: optionalMediaUrl,
});

export const createReviewSchema = z.object({
  studentName: requiredText(120, 'Tu nombre es obligatorio'),
  text: requiredText(2000, 'La opinión es obligatoria'),
  rating: z.coerce
    .number({ error: 'La calificación debe ser un número' })
    .int('La calificación debe ser un entero')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  evidenceUrl: optionalMediaUrl,
});
