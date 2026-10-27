import { z } from 'zod';
import {
  booleanFromString,
  optionalText,
  paginationFields,
  requiredText,
  uppercaseEnum,
} from './common.js';

const category = uppercaseEnum(
  ['GENERAL', 'URGENT', 'EVENT', 'SUSPENSION', 'ACADEMIC'],
  'La categoría no es válida',
);

const authorRole = uppercaseEnum(
  ['DIRECTION', 'TEACHER', 'STUDENT_COUNCIL', 'ADMIN'],
  'El rol del autor no es válido',
);

export const announcementListQuery = z.object({
  ...paginationFields,
  category: category.optional(),
  pinned: booleanFromString.optional(),
  q: optionalText(120),
});

export const announcementParams = z.object({
  id: z.string().trim().min(1),
});

export const createAnnouncementSchema = z.object({
  title: requiredText(150, 'El título es obligatorio'),
  content: requiredText(5000, 'El contenido es obligatorio'),
  category: category.default('GENERAL'),
  authorName: requiredText(120, 'El autor es obligatorio'),
  authorRole: authorRole.default('DIRECTION'),
  pinned: booleanFromString.default(false),
});

export const updateAnnouncementSchema = z
  .object({
    title: requiredText(150).optional(),
    content: requiredText(5000).optional(),
    category: category.optional(),
    authorName: requiredText(120).optional(),
    authorRole: authorRole.optional(),
    pinned: booleanFromString.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const announcementPinSchema = z.object({
  pinned: booleanFromString,
});
