import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestApi, expectError, expectSuccess } from './helpers/api.js';

/**
 * Contrato transversal de la API: salud, metadatos, 404, JSON malformado,
 * errores de validación (422) y errores no controlados (500).
 */
describe('API · salud y contrato de errores', () => {
  let api;

  beforeAll(async () => {
    api = await createTestApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('GET / responde con los metadatos del servicio', async () => {
    const res = await api.client.get('/');
    const data = expectSuccess(res, 200);

    expect(data).toMatchObject({
      name: 'IntraNerd API',
      health: '/api/v1/health',
      api: '/api/v1',
    });
  });

  it('GET /api/v1/health confirma base de datos y servicio', async () => {
    const res = await api.client.get('/api/v1/health');
    const data = expectSuccess(res, 200);

    expect(data).toMatchObject({
      status: 'ok',
      service: 'intranerd-api',
      version: '1.0.0',
    });
    expect(typeof data.uptime).toBe('number');
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('GET /api/v1 lista los ocho módulos', async () => {
    const res = await api.client.get('/api/v1');
    const data = expectSuccess(res, 200);

    expect(data.modules).toHaveLength(8);
    expect(data.modules).toEqual(
      expect.arrayContaining([
        '/api/v1/grades',
        '/api/v1/missing-persons',
        '/api/v1/teachers',
        '/api/v1/lost-found',
        '/api/v1/calendar',
        '/api/v1/workshops',
        '/api/v1/announcements',
        '/api/v1/tasks',
      ]),
    );
  });

  it('expone el alias /api usado por la SPA', async () => {
    const res = await api.client.get('/api/health');
    expectSuccess(res, 200);
  });

  it('incluye cabeceras defensivas y X-Request-Id', async () => {
    const res = await api.client.get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-request-id']).toMatch(/[0-9a-f-]{8,}/i);
  });

  it('respeta un X-Request-Id entrante', async () => {
    const res = await api.client.get('/api/v1/health').set('X-Request-Id', 'traza-123');

    expect(res.headers['x-request-id']).toBe('traza-123');
  });

  it('devuelve 404 con envoltura para rutas inexistentes', async () => {
    const res = await api.client.get('/api/v1/no-existe');
    const body = expectError(res, 404);

    expect(body.error).toContain('no existe');
  });

  it('devuelve 404 para un módulo inexistente', async () => {
    expectError(await api.client.get('/api/v1/unknown/123'), 404);
  });

  it('devuelve 400 cuando el JSON está mal formado', async () => {
    const res = await api.client
      .post('/api/v1/grades/subjects')
      .set('Content-Type', 'application/json')
      .send('{"name": "Matemáticas",');

    const body = expectError(res, 400);
    expect(body.error).toContain('JSON');
  });

  it('devuelve 422 con detalles por campo ante datos inválidos', async () => {
    const res = await api.client.post('/api/v1/grades/subjects').send({});
    const body = expectError(res, 422);

    expect(Array.isArray(body.details)).toBe(true);
    expect(body.details.length).toBeGreaterThan(0);
    expect(body.details[0]).toHaveProperty('field');
    expect(body.details[0]).toHaveProperty('message');
    expect(body.details.map((detail) => detail.field)).toEqual(
      expect.arrayContaining(['name', 'studentName']),
    );
  });

  it('devuelve 422 para un recurso con id vacío', async () => {
    expectError(await api.client.get('/api/v1/announcements/%20'), 422);
  });

  it('devuelve 500 controlado si un servicio falla de forma inesperada', async () => {
    vi.spyOn(api.modules.gradeService, 'list').mockImplementation(() => {
      throw new Error('falla simulada de infraestructura');
    });

    const res = await api.client.get('/api/v1/grades');
    const body = expectError(res, 500);

    expect(body.error).toContain('error interno');
    expect(body).not.toHaveProperty('stack');
  });
});
