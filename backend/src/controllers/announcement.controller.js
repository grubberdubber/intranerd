import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { announcementService } from '../services/announcement.service.js';

export const announcementController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, announcementService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, announcementService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    return sendSuccess(res, announcementService.create(req.validated.body), 201);
  }),

  update: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      announcementService.update(req.validated.params.id, req.validated.body),
    );
  }),

  setPinned: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      announcementService.setPinned(req.validated.params.id, req.validated.body.pinned),
    );
  }),

  remove: asyncHandler((req, res) => {
    announcementService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),
};
