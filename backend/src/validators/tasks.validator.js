import { z } from 'zod';
import {
  booleanFromString,
  optionalDateOnly,
  optionalText,
  paginationFields,
  requiredText,
} from './common.js';

export const taskListQuery = z
  .object({
    ...paginationFields,
    subject: optionalText(100),
    studentName: optionalText(120),
    completed: booleanFromString.optional(),
    q: optionalText(120),
  })
  .refine((data) => data.completed === undefined || Boolean(data.studentName), {
    message: 'Debes indicar studentName para filtrar por estado de completado.',
    path: ['studentName'],
  });

export const taskParams = z.object({
  id: z.string().trim().min(1),
});

export const taskCompletionParams = z.object({
  id: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
});

export const createTaskSchema = z.object({
  title: requiredText(150, 'El título de la tarea es obligatorio'),
  description: optionalText(2000),
  subject: requiredText(100, 'La asignatura es obligatoria'),
  priority: optionalText(20),
  dueDate: optionalDateOnly,
  createdBy: requiredText(120, 'El nombre del profesor es obligatorio'),
});

export const updateTaskSchema = z
  .object({
    title: requiredText(150).optional(),
    description: optionalText(2000),
    subject: requiredText(100).optional(),
    priority: optionalText(20),
    dueDate: optionalDateOnly,
    createdBy: requiredText(120).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const taskCompletionSchema = z.object({
  studentName: requiredText(120, 'El nombre del alumno es obligatorio'),
  completed: booleanFromString.default(true),
});
