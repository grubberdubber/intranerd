import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { taskService } from '../services/task.service.js';

export const taskController = {
  list: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.list(req.validated.query));
  }),

  get: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.get(req.validated.params.id));
  }),

  create: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.create(req.validated.body), 201);
  }),

  update: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.update(req.validated.params.id, req.validated.body));
  }),

  remove: asyncHandler((req, res) => {
    taskService.remove(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),

  setCompletion: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.setCompletion(req.validated.params.id, req.validated.body));
  }),

  listCompletions: asyncHandler((req, res) => {
    return sendSuccess(res, taskService.listCompletions(req.validated.params.id));
  }),

  removeCompletion: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      taskService.removeCompletion(req.validated.params.id, req.validated.params.studentName),
    );
  }),
};
