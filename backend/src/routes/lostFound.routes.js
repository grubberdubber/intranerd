import { Router } from 'express';
import { lostFoundController } from '../controllers/lostFound.controller.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  createLostFoundSchema,
  lostFoundListQuery,
  lostFoundParams,
  lostFoundStatusSchema,
  updateLostFoundSchema,
} from '../validators/lostFound.validator.js';

const router = Router();
const photoUpload = upload({ fields: ['photo'] });

router.get('/', validate({ query: lostFoundListQuery }), lostFoundController.list);

router.post(
  '/',
  photoUpload,
  validate({ body: createLostFoundSchema }),
  lostFoundController.create,
);

router.patch(
  '/:id/status',
  validate({ params: lostFoundParams, body: lostFoundStatusSchema }),
  lostFoundController.setStatus,
);

router.get('/:id', validate({ params: lostFoundParams }), lostFoundController.get);

router.patch(
  '/:id',
  photoUpload,
  validate({ params: lostFoundParams, body: updateLostFoundSchema }),
  lostFoundController.update,
);

router.delete('/:id', validate({ params: lostFoundParams }), lostFoundController.remove);

export default router;
