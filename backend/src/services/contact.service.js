import { contactRepository } from '../repositories/contact.repository.js';

export const contactService = {
  create(payload) {
    const message = contactRepository.create(payload);
    return {
      id: message.id,
      status: message.status,
      createdAt: message.createdAt,
      // El cliente necesita confirmar el canal sin recibir datos de terceros.
      received: true,
    };
  },
};
