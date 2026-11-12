import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeBrowser } from './helpers/fake-browser.js';

let browser;
let chat;

async function loadModules() {
  vi.resetModules();
  browser = installFakeBrowser();
  chat = await import('../../src/services/chat.js');
  return { chat, utils: await import('../../src/utils/chat.js') };
}

afterEach(() => {
  browser?.restore();
});

describe('services/chat · contactos y mensajes locales', () => {
  beforeEach(async () => {
    await loadModules();
  });

  it('siembra contactos y conversaciones de demostración', () => {
    const contacts = chat.listChatContacts();
    const threads = chat.listChatThreads();

    expect(contacts).toHaveLength(5);
    expect(new Set(contacts.map((contact) => contact.id)).size).toBe(contacts.length);
    expect(contacts.map((contact) => contact.role)).toEqual(
      expect.arrayContaining(['profesor', 'alumno', 'inspector', 'direccion']),
    );
    expect(threads).toHaveLength(2);
    expect(threads.every((thread) => contacts.some((contact) => contact.id === thread.contactId))).toBe(
      true,
    );
  });

  it('crea un contacto con su conversación vacía y lo persiste', () => {
    const created = chat.createChatContact({
      name: '  Inspectora Paula Soto  ',
      role: 'inspector',
      detail: 'Inspectoría · Patio norte',
      email: 'paula.soto@colegio.cl',
    });

    expect(created.name).toBe('Inspectora Paula Soto');
    expect(created.id).toMatch(/^chat_/);
    expect(chat.listChatContacts()[0]).toEqual(created);

    const thread = chat.listChatThreads().find((item) => item.contactId === created.id);
    expect(thread).toBeTruthy();
    expect(thread.messages).toEqual([]);
  });

  it('rechaza contactos inválidos', () => {
    expect(() => chat.createChatContact({ name: 'A', role: 'profesor' })).toThrow(/nombre/i);
    expect(() => chat.createChatContact({ name: 'Ana', role: 'desconocido' })).toThrow(/rol/i);
    expect(() =>
      chat.createChatContact({ name: 'Ana', role: 'alumno', email: 'correo-invalido' }),
    ).toThrow(/correo/i);
  });

  it('envía mensajes, actualiza la conversación y limpia los espacios', () => {
    const contact = chat.listChatContacts()[0];
    const message = chat.sendChatMessage(contact.id, '  Hola, ¿hay clase mañana?  ');

    expect(message.body).toBe('Hola, ¿hay clase mañana?');
    expect(message.author).toBe('me');

    const thread = chat.listChatThreads().find((item) => item.contactId === contact.id);
    expect(thread.messages.at(-1)).toEqual(message);
    expect(thread.updatedAt).toBe(message.createdAt);
  });

  it('rechaza mensajes vacíos o de un contacto inexistente', () => {
    expect(() => chat.sendChatMessage('chat-moya', '   ')).toThrow(/mensaje/i);
    expect(() => chat.sendChatMessage('no-existe', 'Hola')).toThrow(/contacto/i);
  });

  it('marca una conversación como leída', () => {
    const paula = chat.listChatContacts().find((contact) => contact.id === 'chat-paula');
    const before = chat.listChatThreads().find((thread) => thread.contactId === paula.id);

    expect(before.lastReadAt).toBeTruthy();
    chat.markChatThreadRead(paula.id);

    const after = chat.listChatThreads().find((thread) => thread.contactId === paula.id);
    expect(Date.parse(after.lastReadAt)).toBeGreaterThanOrEqual(Date.parse(before.lastReadAt));
  });
});

describe('utils/chat · búsqueda, orden y validación', () => {
  let utils;

  beforeEach(async () => {
    ({ utils } = await loadModules());
  });

  const contacts = [
    { id: '1', name: 'Prof. Sebastián Moya', role: 'profesor', detail: 'Matemáticas' },
    { id: '2', name: 'Paula Rivas', role: 'inspector', detail: 'Inspectoría' },
    { id: '3', name: 'Camila Rojas', role: 'alumno', detail: '2° Medio A' },
  ];

  const threads = [
    {
      contactId: '1',
      updatedAt: '2026-11-12T10:00:00.000Z',
      lastReadAt: '2026-11-12T10:00:00.000Z',
      messages: [
        {
          id: 'm1',
          author: 'contact',
          body: 'Hola',
          createdAt: '2026-11-12T09:00:00.000Z',
        },
      ],
    },
    {
      contactId: '2',
      updatedAt: '2026-11-12T11:00:00.000Z',
      lastReadAt: '2026-11-12T08:00:00.000Z',
      messages: [
        {
          id: 'm2',
          author: 'contact',
          body: 'Nuevo aviso',
          createdAt: '2026-11-12T11:00:00.000Z',
        },
      ],
    },
  ];

  it('busca sin distinguir acentos ni mayúsculas y filtra por rol', () => {
    expect(utils.filterChatContacts(contacts, { query: 'sebastian' })).toHaveLength(1);
    expect(utils.filterChatContacts(contacts, { query: 'INSPECTORIA' })).toHaveLength(1);
    expect(utils.filterChatContacts(contacts, { role: 'alumno' })).toHaveLength(1);
    expect(utils.filterChatContacts(contacts, { query: 'no existe' })).toHaveLength(0);
  });

  it('calcula no leídos y deja primero las conversaciones pendientes', () => {
    expect(utils.chatUnreadCount(threads[1])).toBe(1);
    expect(utils.chatUnreadCount(threads[0])).toBe(0);

    const sorted = utils.sortChatContacts(contacts, threads);
    expect(sorted.map((contact) => contact.id)).toEqual(['2', '1', '3']);
  });

  it('genera una vista previa legible del último mensaje', () => {
    expect(utils.chatMessagePreview(threads[1])).toBe('Nuevo aviso');
    expect(utils.chatMessagePreview(null)).toBe('Sin mensajes todavía');
    expect(
      utils.chatMessagePreview({
        messages: [{ author: 'me', body: 'Nos vemos mañana' }],
      }),
    ).toBe('Tú: Nos vemos mañana');
  });

  it('valida el largo de los mensajes', () => {
    expect(utils.isValidChatMessage('Hola')).toBe(true);
    expect(utils.isValidChatMessage('   ')).toBe(false);
    expect(utils.isValidChatMessage('x'.repeat(2001))).toBe(false);
    expect(utils.CHAT_MESSAGE_MAX).toBe(2000);
  });
});
