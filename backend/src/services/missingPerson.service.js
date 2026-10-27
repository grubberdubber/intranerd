import { missingPersonRepository } from '../repositories/missingPerson.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

function resolvePhoto(payload, uploadedUrl) {
  if (uploadedUrl) return uploadedUrl;
  return payload.photoUrl ?? null;
}

export const missingPersonService = {
  list(query) {
    const { page, limit, status, q } = query;
    const { items, total } = missingPersonRepository.list({
      status,
      q,
      limit,
      offset: toOffset(page, limit),
    });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  get(id) {
    const person = missingPersonRepository.findById(id);
    if (!person) throw ApiError.notFound('El reporte de persona extraviada no existe.');
    return person;
  },

  create(payload, uploadedUrl) {
    return missingPersonRepository.create({
      ...payload,
      photoUrl: resolvePhoto(payload, uploadedUrl),
    });
  },

  update(id, payload, uploadedUrl) {
    this.get(id);
    return missingPersonRepository.update(id, {
      ...payload,
      ...(uploadedUrl ? { photoUrl: uploadedUrl } : {}),
    });
  },

  setStatus(id, status) {
    this.get(id);
    return missingPersonRepository.setStatus(id, status);
  },

  setFound(id, found) {
    return this.setStatus(id, found ? 'FOUND' : 'MISSING');
  },

  remove(id) {
    if (!missingPersonRepository.remove(id)) {
      throw ApiError.notFound('El reporte de persona extraviada no existe.');
    }
  },
};
