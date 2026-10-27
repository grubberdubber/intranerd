import { lostFoundRepository } from '../repositories/lostFound.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

export const lostFoundService = {
  list(query) {
    const { page, limit, type, status, q } = query;
    const { items, total } = lostFoundRepository.list({
      type,
      status,
      q,
      limit,
      offset: toOffset(page, limit),
    });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  get(id) {
    const item = lostFoundRepository.findById(id);
    if (!item) throw ApiError.notFound('El objeto reportado no existe.');
    return item;
  },

  create(payload, uploadedUrl) {
    return lostFoundRepository.create({
      ...payload,
      photoUrl: uploadedUrl ?? payload.photoUrl ?? null,
    });
  },

  update(id, payload, uploadedUrl) {
    this.get(id);
    return lostFoundRepository.update(id, {
      ...payload,
      ...(uploadedUrl ? { photoUrl: uploadedUrl } : {}),
    });
  },

  setStatus(id, status) {
    this.get(id);
    return lostFoundRepository.setStatus(id, status);
  },

  remove(id) {
    if (!lostFoundRepository.remove(id)) {
      throw ApiError.notFound('El objeto reportado no existe.');
    }
  },
};
