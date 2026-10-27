import { Router } from 'express';
import { workshopController } from '../controllers/workshop.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createWorkshopSchema,
  enrollmentParams,
  enrollWorkshopSchema,
  updateWorkshopSchema,
  workshopListQuery,
  workshopParams,
} from '../validators/workshops.validator.js';

const router = Router();

router.get('/', validate({ query: workshopListQuery }), workshopController.list);

router.post('/', validate({ body: createWorkshopSchema }), workshopController.create);

router.get(
  '/:id/enrollments',
  validate({ params: workshopParams }),
  workshopController.listEnrollments,
);

router.post(
  '/:id/enrollments',
  validate({ params: workshopParams, body: enrollWorkshopSchema }),
  workshopController.enroll,
);

router.delete(
  '/:id/enrollments/:enrollmentId',
  validate({ params: enrollmentParams }),
  workshopController.removeEnrollment,
);

router.get('/:id', validate({ params: workshopParams }), workshopController.get);

router.patch(
  '/:id',
  validate({ params: workshopParams, body: updateWorkshopSchema }),
  workshopController.update,
);

router.delete('/:id', validate({ params: workshopParams }), workshopController.remove);

export default router;
