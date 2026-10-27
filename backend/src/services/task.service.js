import { taskRepository } from '../repositories/task.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

function completionSummary(task, completions, studentName) {
  const completedBy = completions
    .filter((completion) => completion.completed)
    .map((completion) => completion.studentName);

  const mine = studentName
    ? completions.find(
        (completion) => completion.studentName.toLowerCase() === studentName.toLowerCase(),
      )
    : undefined;

  return {
    ...task,
    completedCount: completedBy.length,
    totalTracked: completions.length,
    completedBy,
    completed: studentName ? Boolean(mine?.completed) : null,
    completedAt: mine?.completedAt ?? null,
  };
}

export const taskService = {
  list(query) {
    const { page, limit, subject, q, studentName, completed } = query;
    const { items, total } = taskRepository.list({
      subject,
      q,
      studentName,
      completed,
      limit,
      offset: toOffset(page, limit),
    });

    const completions = taskRepository.listCompletionsForTasks(items.map((task) => task.id));
    const byTask = new Map();
    for (const completion of completions) {
      const list = byTask.get(completion.taskId) ?? [];
      list.push(completion);
      byTask.set(completion.taskId, list);
    }

    return {
      items: items.map((task) => completionSummary(task, byTask.get(task.id) ?? [], studentName)),
      pagination: buildPagination({ page, limit, total }),
    };
  },

  get(id) {
    const task = taskRepository.findById(id);
    if (!task) throw ApiError.notFound('La tarea solicitada no existe.');

    const completions = taskRepository.listCompletions(id);
    return {
      ...task,
      completions,
      completedBy: completions
        .filter((completion) => completion.completed)
        .map((completion) => completion.studentName),
    };
  },

  create(payload) {
    return taskRepository.create(payload);
  },

  update(id, payload) {
    this.get(id);
    return taskRepository.update(id, payload);
  },

  remove(id) {
    if (!taskRepository.remove(id)) {
      throw ApiError.notFound('La tarea solicitada no existe.');
    }
  },

  setCompletion(id, payload) {
    this.get(id);
    const completion = taskRepository.upsertCompletion({
      taskId: id,
      ...payload,
    });
    return { completion, task: this.get(id) };
  },

  listCompletions(id) {
    this.get(id);
    return taskRepository.listCompletions(id);
  },

  removeCompletion(id, studentName) {
    this.get(id);
    if (!taskRepository.removeCompletion(id, studentName)) {
      throw ApiError.notFound('No existe un registro de completado para ese alumno.');
    }
    return this.get(id);
  },
};
