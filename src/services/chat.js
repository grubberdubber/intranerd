import { seedChatContacts, seedChatThreads } from '../data/chatSeeds.js';
import { CHAT_ROLES, STORAGE_KEYS } from '../data/constants.js';
import { storage } from './storage.js';
import { uid } from '../utils/id.js';

/**
 * Persistencia del chat interno.
 *
 * Esta primera versión es deliberadamente local-first: los contactos y los
 * mensajes viven en localStorage. No hay sincronización entre navegadores ni
 * respuestas automáticas; para un chat real hace falta un backend con sesiones
 * y un canal en tiempo real.
 */

const ROLE_IDS = new Set(CHAT_ROLES.map((role) => role.id));

function readContacts() {
  if (!storage.has(STORAGE_KEYS.chatContacts)) {
    storage.set(STORAGE_KEYS.chatContacts, seedChatContacts());
  }
  const contacts = storage.get(STORAGE_KEYS.chatContacts, []);
  return Array.isArray(contacts) ? contacts : [];
}

function readThreads() {
  if (!storage.has(STORAGE_KEYS.chatThreads)) {
    storage.set(STORAGE_KEYS.chatThreads, seedChatThreads());
  }
  const threads = storage.get(STORAGE_KEYS.chatThreads, []);
  return Array.isArray(threads) ? threads : [];
}

function writeThreads(threads) {
  storage.set(STORAGE_KEYS.chatThreads, threads);
}

function newThread(contactId, now = new Date().toISOString()) {
  return {
    id: uid('thread'),
    contactId,
    createdAt: now,
    updatedAt: now,
    lastReadAt: now,
    messages: [],
  };
}

export function listChatContacts() {
  return readContacts();
}

export function listChatThreads() {
  return readThreads();
}

export function createChatContact({ name, role, detail = '', email = '', note = '' } = {}) {
  const cleanName = String(name || '').trim();
  if (cleanName.length < 2) {
    throw new Error('Escribe un nombre de al menos 2 caracteres.');
  }
  if (!ROLE_IDS.has(role)) {
    throw new Error('Selecciona un rol válido para el contacto.');
  }

  const cleanEmail = String(email || '').trim();
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Escribe un correo electrónico válido o déjalo vacío.');
  }

  const contact = {
    id: uid('chat'),
    name: cleanName,
    role,
    detail: String(detail || '').trim(),
    email: cleanEmail,
    note: String(note || '').trim(),
    createdAt: new Date().toISOString(),
  };

  storage.set(STORAGE_KEYS.chatContacts, [contact, ...readContacts()]);
  writeThreads([newThread(contact.id), ...readThreads()]);
  return contact;
}

export function ensureChatThread(contactId) {
  const threads = readThreads();
  const existing = threads.find((thread) => thread.contactId === contactId);
  if (existing) return existing;

  const thread = newThread(contactId);
  writeThreads([thread, ...threads]);
  return thread;
}

export function markChatThreadRead(contactId) {
  const threads = readThreads();
  const now = new Date().toISOString();
  let changed = false;

  const next = threads.map((thread) => {
    if (thread.contactId !== contactId) return thread;
    changed = true;
    return { ...thread, lastReadAt: now };
  });

  if (changed) writeThreads(next);
}

export function sendChatMessage(contactId, body) {
  const cleanBody = String(body || '').trim();
  if (!cleanBody) throw new Error('Escribe un mensaje antes de enviarlo.');
  if (cleanBody.length > 2000) {
    throw new Error('El mensaje supera los 2000 caracteres.');
  }
  if (!readContacts().some((contact) => contact.id === contactId)) {
    throw new Error('El contacto ya no existe.');
  }

  const now = new Date().toISOString();
  const message = {
    id: uid('msg'),
    author: 'me',
    body: cleanBody,
    createdAt: now,
  };

  const threads = readThreads();
  const existing = threads.find((thread) => thread.contactId === contactId);
  const updated = existing
    ? { ...existing, messages: [...existing.messages, message], updatedAt: now }
    : { ...newThread(contactId, now), messages: [message] };

  writeThreads(
    existing
      ? threads.map((thread) => (thread.contactId === contactId ? updated : thread))
      : [updated, ...threads],
  );

  return message;
}
