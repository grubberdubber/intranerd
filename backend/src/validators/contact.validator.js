import { z } from 'zod';
import { requiredText, uppercaseEnum } from './common.js';

/**
 * Formulario público de contacto y soporte.
 *
 * `role` y `topic` se normalizan a mayúsculas para mantener el contrato de la
 * API igual que el resto de módulos. `consent` es obligatorio: sin permiso
 * explícito no se almacena la consulta.
 */
export const createContactMessageSchema = z.object({
  name: requiredText(120, 'El nombre es obligatorio'),
  email: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('Escribe un correo electrónico válido')
    .max(180, 'El correo es demasiado largo'),
  role: uppercaseEnum(
    ['STUDENT', 'GUARDIAN', 'TEACHER', 'DIRECTION', 'OTHER'],
    'El rol seleccionado no es válido',
  ).default('OTHER'),
  topic: uppercaseEnum(
    ['SUPPORT', 'ACCESSIBILITY', 'ACADEMIC', 'COMMUNITY', 'SUGGESTION', 'OTHER'],
    'El motivo seleccionado no es válido',
  ).default('OTHER'),
  subject: requiredText(140, 'El asunto es obligatorio'),
  message: requiredText(4000, 'El mensaje es obligatorio'),
  consent: z.literal(true, {
    error: 'Debes autorizar el uso de tus datos para responder la consulta',
  }),
});
