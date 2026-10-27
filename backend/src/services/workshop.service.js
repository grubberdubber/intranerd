import { transaction } from '../db/connection.js';
import { workshopRepository } from '../repositories/workshop.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, toOffset } from '../utils/pagination.js';

export const workshopService = {
  list(query) {
    const { page, limit, q, category, available } = query;
    const { items, total } = workshopRepository.list({
      q,
      category,
      available,
      limit,
      offset: toOffset(page, limit),
    });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  get(id) {
    const workshop = workshopRepository.findById(id);
    if (!workshop) throw ApiError.notFound('El taller solicitado no existe.');
    return { ...workshop, enrollments: workshopRepository.listEnrollments(id) };
  },

  create(payload) {
    return workshopRepository.create(payload);
  },

  update(id, payload) {
    const current = workshopRepository.findById(id);
    if (!current) throw ApiError.notFound('El taller solicitado no existe.');

    if (payload.capacity !== undefined && payload.capacity < current.enrolledCount) {
      throw ApiError.conflict(
        `No puedes reducir el cupo a ${payload.capacity}: ya hay ${current.enrolledCount} alumnos inscritos.`,
        'CAPACITY_BELOW_ENROLLED',
      );
    }
    return workshopRepository.update(id, payload);
  },

  remove(id) {
    if (!workshopRepository.remove(id)) {
      throw ApiError.notFound('El taller solicitado no existe.');
    }
  },

  listEnrollments(id) {
    if (!workshopRepository.findById(id)) {
      throw ApiError.notFound('El taller solicitado no existe.');
    }
    return workshopRepository.listEnrollments(id);
  },

  /**
   * Inscripción atómica: el bloqueo IMMEDIATE evita sobrepasar el cupo si dos
   * alumnos se inscriben al mismo tiempo.
   */
  enroll(id, payload) {
    return transaction(() => {
      const workshop = workshopRepository.findById(id);
      if (!workshop) throw ApiError.notFound('El taller solicitado no existe.');

      if (workshop.isFull) {
        throw ApiError.conflict('El taller no tiene cupos disponibles.', 'WORKSHOP_FULL');
      }

      const existing = workshopRepository.findEnrollment(id, payload.studentName);
      if (existing) {
        throw ApiError.conflict('El alumno ya está inscrito en este taller.', 'ALREADY_ENROLLED');
      }

      const enrollment = workshopRepository.createEnrollment({
        workshopId: id,
        ...payload,
      });

      return {
        enrollment,
        workshop: workshopRepository.findById(id),
      };
    });
  },

  removeEnrollment(workshopId, enrollmentId) {
    if (!workshopRepository.findById(workshopId)) {
      throw ApiError.notFound('El taller solicitado no existe.');
    }
    if (!workshopRepository.deleteEnrollment(workshopId, enrollmentId)) {
      throw ApiError.notFound('La inscripción solicitada no existe.');
    }
    return workshopRepository.findById(workshopId);
  },
};
