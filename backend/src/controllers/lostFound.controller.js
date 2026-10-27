import { asyncHandler } from '../middlewares/asyncHandler.js';
import { firstFile } from '../middlewares/upload.js';
import { sendSuccess } from '../utils/response.js';
import { lostFoundService } from '../services/lostFound.service.js';

export const lostFoundController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, lostFoundService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, lostFoundService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(res, lostFoundService.create(req.validated.body, uploaded?.url), 201);
  }),

  update: asyncHandler((req, res) => {
    const uploaded = firstFile(req, 'photo');
    return sendSuccess(
      res,
      lostFoundService.update(req.validated.params.id, req.validated.body, uploaded?.url),
    );
  }),

  setStatus: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      lostFoundService.setStatus(req.validated.params.id, req.validated.body.status),
    );
  }),

  remove: asyncHandler((req, res) => {
    lostFoundService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),
};
