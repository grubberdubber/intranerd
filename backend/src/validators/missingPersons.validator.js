import { z } from 'zod';
import {
  booleanFromString,
  optionalMediaUrl,
  optionalNumber,
  optionalText,
  paginationFields,
  requiredText,
  uppercaseEnum,
} from './common.js';

const status = uppercaseEnum(['MISSING', 'FOUND'], 'El estado debe ser MISSING o FOUND');

export const missingPersonListQuery = z.object({
  ...paginationFields,
  status: status.optional(),
  q: optionalText(120),
});

export const missingPersonParams = z.object({
  id: z.string().trim().min(1),
});

export const createMissingPersonSchema = z.object({
  name: requiredText(120, 'El nombre es obligatorio'),
  age: optionalNumber({ min: 0, max: 120, integer: true }),
  description: requiredText(2000, 'La descripción es obligatoria'),
  lastSeenPlace: requiredText(200, 'El último lugar visto es obligatorio'),
  contact: requiredText(200, 'El contacto es obligatorio'),
  photoUrl: optionalMediaUrl,
  exampleImageUrl: optionalMediaUrl,
  status: status.optional(),
});

export const updateMissingPersonSchema = z.object({
  name: requiredText(120).optional(),
  age: optionalNumber({ min: 0, max: 120, integer: true }),
  description: requiredText(2000).optional(),
  lastSeenPlace: requiredText(200).optional(),
  contact: requiredText(200).optional(),
  photoUrl: optionalMediaUrl,
  exampleImageUrl: optionalMediaUrl,
  status: status.optional(),
});

export const missingPersonStatusSchema = z.object({
  status,
});

export const missingPersonFoundSchema = z.object({
  found: booleanFromString.default(true),
});
