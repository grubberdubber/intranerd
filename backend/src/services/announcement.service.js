import { announcementRepository } from '../repositories/announcement.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

export const announcementService = {
  list(query) {
    const { page, limit, category, pinned, q } = query;
    const { items, total } = announcementRepository.list({
      category,
      pinned,
      q,
      limit,
      offset: toOffset(page, limit),
    });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  get(id) {
    const announcement = announcementRepository.findById(id);
    if (!announcement) throw ApiError.notFound('El comunicado solicitado no existe.');
    return announcement;
  },

  create(payload) {
    return announcementRepository.create(payload);
  },

  update(id, payload) {
    this.get(id);
    return announcementRepository.update(id, payload);
  },

  setPinned(id, pinned) {
    this.get(id);
    return announcementRepository.setPinned(id, pinned);
  },

  remove(id) {
    if (!announcementRepository.remove(id)) {
      throw ApiError.notFound('El comunicado solicitado no existe.');
    }
  },
};
