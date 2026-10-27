import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { workshopService } from '../services/workshop.service.js';

export const workshopController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, workshopService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, workshopService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    return sendSuccess(res, workshopService.create(req.validated.body), 201);
  }),

  update: asyncHandler((req, res) => {
    return sendSuccess(res, workshopService.update(req.validated.params.id, req.validated.body));
  }),

  remove: asyncHandler((req, res) => {
    workshopService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),

  enroll: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      workshopService.enroll(req.validated.params.id, req.validated.body),
      201,
    );
  }),

  listEnrollments: asyncHandler((req, res) => {
    return sendSuccess(res, workshopService.listEnrollments(req.validated.params.id));
  }),

  removeEnrollment: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      workshopService.removeEnrollment(req.validated.params.id, req.validated.params.enrollmentId),
    );
  }),
};
