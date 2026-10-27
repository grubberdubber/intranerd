import { z } from 'zod';
import { optionalText, requiredText } from './common.js';

const gradeValue = z.coerce
  .number({ error: 'La nota debe ser un número' })
  .min(1, 'La nota mínima es 1.0')
  .max(7, 'La nota máxima es 7.0');

const semester = z.coerce
  .number({ error: 'El semestre debe ser numérico' })
  .int('El semestre debe ser 1 o 2')
  .min(1, 'El semestre debe ser 1 o 2')
  .max(2, 'El semestre debe ser 1 o 2');

const color = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe tener formato hexadecimal #RRGGBB')
    .optional(),
);

export const gradeListQuery = z.object({
  studentName: optionalText(120),
});

export const createSubjectSchema = z.object({
  name: requiredText(100, 'El nombre de la asignatura es obligatorio'),
  studentName: requiredText(120, 'El nombre del alumno es obligatorio'),
  teacherName: optionalText(120),
  color,
});

export const updateSubjectSchema = z
  .object({
    name: requiredText(100).optional(),
    studentName: requiredText(120).optional(),
    teacherName: optionalText(120),
    color,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const subjectParams = z.object({
  id: z.string().trim().min(1),
});

export const createGradeSchema = z.object({
  semester,
  value: gradeValue,
  label: optionalText(80),
});

export const updateGradeSchema = z
  .object({
    semester: semester.optional(),
    value: gradeValue.optional(),
    label: optionalText(80),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const gradeParams = z.object({
  gradeId: z.string().trim().min(1),
});

export const subjectWithGradeParams = z.object({
  id: z.string().trim().min(1),
});
