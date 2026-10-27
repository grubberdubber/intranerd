import { z } from 'zod';
import {
  booleanFromString,
  optionalEmail,
  optionalText,
  paginationFields,
  requiredText,
} from './common.js';

export const workshopListQuery = z.object({
  ...paginationFields,
  q: optionalText(120),
  category: optionalText(80),
  available: booleanFromString.optional(),
});

export const workshopParams = z.object({
  id: z.string().trim().min(1),
});

export const enrollmentParams = z.object({
  id: z.string().trim().min(1),
  enrollmentId: z.string().trim().min(1),
});

export const createWorkshopSchema = z.object({
  name: requiredText(120, 'El nombre del taller es obligatorio'),
  description: optionalText(2000),
  category: optionalText(80),
  schedule: optionalText(200),
  location: optionalText(200),
  teacherName: optionalText(120),
  capacity: z.coerce
    .number({ error: 'El cupo debe ser numérico' })
    .int('El cupo debe ser un entero')
    .min(1, 'El cupo mínimo es 1')
    .max(500, 'El cupo máximo es 500'),
});

export const updateWorkshopSchema = z
  .object({
    name: requiredText(120).optional(),
    description: optionalText(2000),
    category: optionalText(80),
    schedule: optionalText(200),
    location: optionalText(200),
    teacherName: optionalText(120),
    capacity: z.coerce.number().int().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const enrollWorkshopSchema = z.object({
  studentName: requiredText(120, 'El nombre del alumno es obligatorio'),
  studentEmail: optionalEmail,
  course: optionalText(80),
});
