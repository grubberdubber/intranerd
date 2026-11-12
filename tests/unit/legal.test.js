import { describe, expect, it } from 'vitest';
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_LIST,
  LEGAL_UPDATED_ISO,
  LEGAL_VERSION,
} from '../../src/data/legal.js';

describe('data/legal · documentos legales', () => {
  it('publica el aviso, los términos, la privacidad, las cookies, la seguridad y la accesibilidad', () => {
    expect(Object.keys(LEGAL_DOCUMENTS)).toEqual([
      'terms',
      'aviso',
      'security',
      'privacy',
      'cookies',
      'accessibility',
    ]);
    expect(LEGAL_DOCUMENT_LIST).toHaveLength(6);
    expect(LEGAL_VERSION).toMatch(/^\d+\.\d+$/);
    expect(LEGAL_UPDATED_ISO).toBe('2026-11-12');
  });

  it('cada documento tiene metadatos y secciones con contenido', () => {
    LEGAL_DOCUMENT_LIST.forEach((document) => {
      expect(document.id).toBeTruthy();
      expect(document.title.length).toBeGreaterThan(4);
      expect(document.intro.length).toBeGreaterThan(40);
      expect(document.sections.length).toBeGreaterThan(3);
      expect(document.footerNote.length).toBeGreaterThan(20);

      document.sections.forEach((section) => {
        expect(section.heading).toMatch(/^\d+\./);
        const content = [...(section.paragraphs || []), ...(section.bullets || [])];
        expect(content.length).toBeGreaterThan(0);
        content.forEach((line) => expect(line.length).toBeGreaterThan(10));
      });
    });
  });

  it('menciona los datos del chat y el canal de reporte de seguridad', () => {
    const privacy = LEGAL_DOCUMENTS.privacy.sections
      .flatMap((section) => [...(section.paragraphs || []), ...(section.bullets || [])])
      .join(' ');
    const security = LEGAL_DOCUMENTS.security.sections
      .flatMap((section) => [...(section.paragraphs || []), ...(section.bullets || [])])
      .join(' ');

    expect(privacy).toMatch(/Mensajes internos/i);
    expect(security).toMatch(/Seguridad IntraNerd/);
  });
});
