import { Router } from 'express';
import { contactController } from '../controllers/contact.controller.js';
import { validate } from '../middlewares/validate.js';
import { createContactMessageSchema } from '../validators/contact.validator.js';

const router = Router();

// Solo recepción. El listado de mensajes no es público (contiene datos
// personales) y se consulta directamente en la base por administración.
router.post('/', validate({ body: createContactMessageSchema }), contactController.create);

export default router;
