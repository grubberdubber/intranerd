import { Router } from 'express';
import { gradeController } from '../controllers/grade.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createGradeSchema,
  createSubjectSchema,
  gradeListQuery,
  gradeParams,
  subjectParams,
  subjectWithGradeParams,
  updateGradeSchema,
  updateSubjectSchema,
} from '../validators/grades.validator.js';

const router = Router();

router.get('/', validate({ query: gradeListQuery }), gradeController.list);

router.post('/subjects', validate({ body: createSubjectSchema }), gradeController.createSubject);
router.get('/subjects/:id', validate({ params: subjectParams }), gradeController.getSubject);
router.patch(
  '/subjects/:id',
  validate({ params: subjectParams, body: updateSubjectSchema }),
  gradeController.updateSubject,
);
router.delete('/subjects/:id', validate({ params: subjectParams }), gradeController.removeSubject);

router.post(
  '/subjects/:id/grades',
  validate({ params: subjectWithGradeParams, body: createGradeSchema }),
  gradeController.addGrade,
);
router.patch(
  '/entries/:gradeId',
  validate({ params: gradeParams, body: updateGradeSchema }),
  gradeController.updateGrade,
);
router.delete('/entries/:gradeId', validate({ params: gradeParams }), gradeController.removeGrade);

export default router;
