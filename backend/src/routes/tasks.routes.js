import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createTaskSchema,
  taskCompletionParams,
  taskCompletionSchema,
  taskListQuery,
  taskParams,
  updateTaskSchema,
} from '../validators/tasks.validator.js';

const router = Router();

router.get('/', validate({ query: taskListQuery }), taskController.list);

router.post('/', validate({ body: createTaskSchema }), taskController.create);

router.patch(
  '/:id/completion',
  validate({ params: taskParams, body: taskCompletionSchema }),
  taskController.setCompletion,
);

router.get('/:id/completions', validate({ params: taskParams }), taskController.listCompletions);

router.delete(
  '/:id/completions/:studentName',
  validate({ params: taskCompletionParams }),
  taskController.removeCompletion,
);

router.get('/:id', validate({ params: taskParams }), taskController.get);

router.patch(
  '/:id',
  validate({ params: taskParams, body: updateTaskSchema }),
  taskController.update,
);

router.delete('/:id', validate({ params: taskParams }), taskController.remove);

export default router;
