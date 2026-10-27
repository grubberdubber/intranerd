import { asyncHandler } from '../middlewares/asyncHandler.js';
import { firstFile } from '../middlewares/upload.js';
import { sendSuccess } from '../utils/response.js';
import { missingPersonService } from '../services/missingPerson.service.js';

export const missingPersonController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, missingPersonService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, missingPersonService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(res, missingPersonService.create(req.validated.body, uploaded?.url), 201);
  }),

  update: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(
      res,
      missingPersonService.update(req.validated.params.id, req.validated.body, uploaded?.url),
    );
  }),

  setStatus: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      missingPersonService.setStatus(req.validated.params.id, req.validated.body.status),
    );
  }),

  setFound: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      missingPersonService.setFound(req.validated.params.id, req.validated.body.found),
    );
  }),

  remove: asyncHandler((req, res) => {
    missingPersonService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),
};
