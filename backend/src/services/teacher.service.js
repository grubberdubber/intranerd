import { teacherRepository } from '../repositories/teacher.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

export const teacherService = {
  list(query) {
    const { page, limit, q, subject } = query;
    const { items, total } = teacherRepository.list({
      q,
      subject,
      limit,
      offset: toOffset(page, limit),
    });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  get(id) {
    const teacher = teacherRepository.findById(id);
    if (!teacher) throw ApiError.notFound('El profesor solicitado no existe.');
    return { ...teacher, reviews: teacherRepository.listReviews(id) };
  },

  create(payload, uploadedUrl) {
    const teacher = teacherRepository.create({
      ...payload,
      photoUrl: uploadedUrl ?? payload.photoUrl ?? null,
    });
    return { ...teacher, reviews: [] };
  },

  update(id, payload, uploadedUrl) {
    this.get(id);
    teacherRepository.update(id, {
      ...payload,
      ...(uploadedUrl ? { photoUrl: uploadedUrl } : {}),
    });
    return this.get(id);
  },

  remove(id) {
    if (!teacherRepository.remove(id)) {
      throw ApiError.notFound('El profesor solicitado no existe.');
    }
  },

  listReviews(id) {
    this.get(id);
    return teacherRepository.listReviews(id);
  },

  addReview(teacherId, payload, uploadedUrl) {
    this.get(teacherId);
    const review = teacherRepository.createReview({
      teacherId,
      ...payload,
      evidenceUrl: uploadedUrl ?? payload.evidenceUrl ?? null,
    });
    return { review, teacher: this.get(teacherId) };
  },

  removeReview(teacherId, reviewId) {
    this.get(teacherId);
    if (!teacherRepository.removeReview(teacherId, reviewId)) {
      throw ApiError.notFound('La reseña solicitada no existe.');
    }
    return this.get(teacherId);
  },
};
