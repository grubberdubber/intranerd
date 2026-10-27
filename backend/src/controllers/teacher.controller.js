import { asyncHandler } from '../middlewares/asyncHandler.js';
import { firstFile } from '../middlewares/upload.js';
import { sendSuccess } from '../utils/response.js';
import { teacherService } from '../services/teacher.service.js';

export const teacherController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, teacherService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, teacherService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(res, teacherService.create(req.validated.body, uploaded?.url), 201);
  }),

  update: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(
      res,
      teacherService.update(req.validated.params.id, req.validated.body, uploaded?.url),
    );
  }),

  remove: asyncHandler((req, res) => {
    teacherService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),

  listReviews: asyncHandler((req, res) => {
    return sendSuccess(res, teacherService.listReviews(req.validated.params.id));
  }),

  addReview: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'evidence');
    return sendSuccess(
      res,
      teacherService.addReview(req.validated.params.id, req.validated.body, uploaded?.url),
      201,
    );
  }),

  removeReview: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      teacherService.removeReview(req.validated.params.id, req.validated.params.reviewId),
    );
  }),
};
