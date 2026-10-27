import { Router } from 'express';
import { announcementController } from '../controllers/announcement.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  announcementListQuery,
  announcementParams,
  announcementPinSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validators/announcements.validator.js';

const router = Router();

router.get('/', validate({ query: announcementListQuery }), announcementController.list);

router.post('/', validate({ body: createAnnouncementSchema }), announcementController.create);

router.patch(
  '/:id/pin',
  validate({ params: announcementParams, body: announcementPinSchema }),
  announcementController.setPinned,
);

router.get('/:id', validate({ params: announcementParams }), announcementController.get);

router.patch(
  '/:id',
  validate({ params: announcementParams, body: updateAnnouncementSchema }),
  announcementController.update,
);

router.delete('/:id', validate({ params: announcementParams }), announcementController.remove);

export default router;
