import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  createReviewSchema,
  createTeacherSchema,
  teacherListQuery,
  teacherParams,
  teacherReviewParams,
  updateTeacherSchema,
} from '../validators/teachers.validator.js';

const router = Router();

router.get('/', validate({ query: teacherListQuery }), teacherController.list);

router.post(
  '/',
  upload({ fields: ['photo'] }),
  validate({ body: createTeacherSchema }),
  teacherController.create,
);

router.get('/:id/reviews', validate({ params: teacherParams }), teacherController.listReviews);

router.post(
  '/:id/reviews',
  upload({ fields: ['evidence'] }),
  validate({ params: teacherParams, body: createReviewSchema }),
  teacherController.addReview,
);

router.delete(
  '/:id/reviews/:reviewId',
  validate({ params: teacherReviewParams }),
  teacherController.removeReview,
);

router.get('/:id', validate({ params: teacherParams }), teacherController.get);

router.patch(
  '/:id',
  upload({ fields: ['photo'] }),
  validate({ params: teacherParams, body: updateTeacherSchema }),
  teacherController.update,
);

router.delete('/:id', validate({ params: teacherParams }), teacherController.remove);

export default router;
