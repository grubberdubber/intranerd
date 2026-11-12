import { CHAT_ROLES } from '../data/constants.js';

/**
 * Reglas puras del módulo Mensajes: búsqueda, orden, no leídos y validación.
 * Se mantienen fuera de la vista para poder probarlas sin DOM.
 */

const ROLE_MAP = Object.fromEntries(CHAT_ROLES.map((role) => [role.id, role]));
const FALLBACK_ROLE = ROLE_MAP.otro || CHAT_ROLES[CHAT_ROLES.length - 1];

export const CHAT_MESSAGE_MAX = 2000;

export function chatRole(roleId) {
  return ROLE_MAP[roleId] || FALLBACK_ROLE;
}

export function normalizeChatSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function chatThreadFor(threads = [], contactId) {
  return threads.find((thread) => thread.contactId === contactId) || null;
}

export function chatLastMessage(thread) {
  if (!thread || !Array.isArray(thread.messages) || !thread.messages.length) return null;
  return thread.messages[thread.messages.length - 1];
}

export function chatUnreadCount(thread) {
  if (!thread || !Array.isArray(thread.messages)) return 0;
  const lastRead = Date.parse(thread.lastReadAt || '') || 0;
  return thread.messages.filter((message) => {
    if (message.author === 'me') return false;
    return (Date.parse(message.createdAt) || 0) > lastRead;
  }).length;
}

export function filterChatContacts(contacts = [], { query = '', role = 'all' } = {}) {
  const needle = normalizeChatSearch(query);

  return contacts.filter((contact) => {
    if (role !== 'all' && contact.role !== role) return false;
    if (!needle) return true;

    const roleLabel = chatRole(contact.role).label;
    return [contact.name, contact.detail, contact.email, contact.note, roleLabel].some((value) =>
      normalizeChatSearch(value).includes(needle),
    );
  });
}

export function sortChatContacts(contacts = [], threads = []) {
  return contacts.slice().sort((a, b) => {
    const threadA = chatThreadFor(threads, a.id);
    const threadB = chatThreadFor(threads, b.id);
    const unreadA = chatUnreadCount(threadA);
    const unreadB = chatUnreadCount(threadB);

    if (unreadA !== unreadB) return unreadB - unreadA;

    const activityA = Date.parse(threadA?.updatedAt || a.createdAt || '') || 0;
    const activityB = Date.parse(threadB?.updatedAt || b.createdAt || '') || 0;
    if (activityA !== activityB) return activityB - activityA;

    return String(a.name).localeCompare(String(b.name), 'es');
  });
}

export function chatMessagePreview(thread) {
  const last = chatLastMessage(thread);
  if (!last) return 'Sin mensajes todavía';
  return last.author === 'me' ? `Tú: ${last.body}` : last.body;
}

export function isValidChatMessage(value) {
  const body = String(value || '').trim();
  return body.length > 0 && body.length <= CHAT_MESSAGE_MAX;
}
