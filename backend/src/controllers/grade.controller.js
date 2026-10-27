import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { gradeService } from '../services/grade.service.js';

export const gradeController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, gradeService.list(req.validated.query));
  }),

  getSubject: asyncHandler((req, res) => {
    return sendSuccess(res, gradeService.getSubject(req.validated.params.id));
  }),

  createSubject: asyncHandler((req, res) => {
    return sendSuccess(res, gradeService.createSubject(req.validated.body), 201);
  }),

  updateSubject: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      gradeService.updateSubject(req.validated.params.id, req.validated.body),
    );
  }),

  removeSubject: asyncHandler((req, res) => {
    gradeService.removeSubject(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),

  addGrade: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      gradeService.addGrade(req.validated.params.id, req.validated.body),
      201,
    );
  }),

  updateGrade: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      gradeService.updateGrade(req.validated.params.gradeId, req.validated.body),
    );
  }),

  removeGrade: asyncHandler((req, res) => {
    return sendSuccess(res, gradeService.removeGrade(req.validated.params.gradeId));
  }),
};
