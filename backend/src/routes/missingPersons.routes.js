import { Router } from 'express';
import { missingPersonController } from '../controllers/missingPerson.controller.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  createMissingPersonSchema,
  missingPersonFoundSchema,
  missingPersonListQuery,
  missingPersonParams,
  missingPersonStatusSchema,
  updateMissingPersonSchema,
} from '../validators/missingPersons.validator.js';

const router = Router();
const photoUpload = upload({ fields: ['photo'] });

router.get('/', validate({ query: missingPersonListQuery }), missingPersonController.list);

router.post(
  '/',
  photoUpload,
  validate({ body: createMissingPersonSchema }),
  missingPersonController.create,
);

router.patch(
  '/:id/found',
  validate({ params: missingPersonParams, body: missingPersonFoundSchema }),
  missingPersonController.setFound,
);

router.patch(
  '/:id/status',
  validate({ params: missingPersonParams, body: missingPersonStatusSchema }),
  missingPersonController.setStatus,
);

router.get('/:id', validate({ params: missingPersonParams }), missingPersonController.get);

router.patch(
  '/:id',
  photoUpload,
  validate({ params: missingPersonParams, body: updateMissingPersonSchema }),
  missingPersonController.update,
);

router.delete('/:id', validate({ params: missingPersonParams }), missingPersonController.remove);

export default router;
