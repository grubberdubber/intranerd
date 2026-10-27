import { z } from 'zod';
import {
  optionalMediaUrl,
  optionalText,
  paginationFields,
  requiredText,
  uppercaseEnum,
} from './common.js';

const itemType = uppercaseEnum(['FOUND', 'LOST'], 'El tipo debe ser FOUND o LOST');
const itemStatus = uppercaseEnum(
  ['OPEN', 'CLAIMED', 'RETURNED'],
  'El estado debe ser OPEN, CLAIMED o RETURNED',
);

export const lostFoundListQuery = z.object({
  ...paginationFields,
  type: itemType.optional(),
  status: itemStatus.optional(),
  q: optionalText(120),
});

export const lostFoundParams = z.object({
  id: z.string().trim().min(1),
});

export const createLostFoundSchema = z.object({
  type: itemType,
  reportedBy: requiredText(120, 'El nombre del reportante es obligatorio'),
  contact: requiredText(200, 'El contacto es obligatorio'),
  description: requiredText(1000, 'La descripción es obligatoria'),
  location: optionalText(200),
  category: optionalText(80),
  photoUrl: optionalMediaUrl,
  exampleImageUrl: optionalMediaUrl,
  status: itemStatus.optional(),
});

export const updateLostFoundSchema = z.object({
  type: itemType.optional(),
  reportedBy: requiredText(120).optional(),
  contact: requiredText(200).optional(),
  description: requiredText(1000).optional(),
  location: optionalText(200),
  category: optionalText(80),
  photoUrl: optionalMediaUrl,
  exampleImageUrl: optionalMediaUrl,
  status: itemStatus.optional(),
});

export const lostFoundStatusSchema = z.object({
  status: itemStatus,
});
