import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { contactService } from '../services/contact.service.js';

export const contactController = {
  create: asyncHandler((req, res) => {
    return sendSuccess(res, contactService.create(req.validated.body), 201);
  }),
};
