import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { getApp, operatoreToken, ufficioToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/fasi/mie', () => {
  it('operatore vede le sue fasi', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      reparti: ['punzonatura_euromac'],
    });
    mockPrismaClient.faseProduzione.findMany.mockResolvedValue([
      {
        id: 1,
        ordine_id: 1,
        nome_fase: 'Punzonatura Euromac',
        stato: 'da_fare',
        ordine: { id: 1, numero_conferma: '2026-001', cliente: 'Test', urgente: false },
        user: null,
      },
    ]);

    const res = await request(app)
      .get('/api/fasi/mie')
      .set('Authorization', `Bearer ${operatoreToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('ufficio non accede a fasi/mie', async () => {
    const res = await request(app)
      .get('/api/fasi/mie')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/fasi/ordine/:ordineId', () => {
  it('lista fasi per ordine', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({ id: 1 });
    mockPrismaClient.faseProduzione.findMany.mockResolvedValue([
      { id: 1, ordine_id: 1, nome_fase: 'Punzonatura Dalcos Falsetelaio', stato: 'da_fare', user: null },
      { id: 2, ordine_id: 1, nome_fase: 'Piegatura Falsetelaio', stato: 'da_fare', user: null },
    ]);

    const res = await request(app)
      .get('/api/fasi/ordine/1')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('POST /api/fasi/:id/completa', () => {
  it('fase gia completata restituisce 400', async () => {
    mockPrismaClient.faseProduzione.findUnique.mockResolvedValue({
      id: 1,
      ordine_id: 1,
      nome_fase: 'Punzonatura Euromac',
      stato: 'completata',
      ordine: { id: 1, numero_conferma: '2026-001', cliente: 'Test', stato: 'in_produzione' },
    });

    const res = await request(app)
      .post('/api/fasi/1/completa')
      .set('Authorization', `Bearer ${operatoreToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('ufficio non puo completare fasi', async () => {
    const res = await request(app)
      .post('/api/fasi/1/completa')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({});

    expect(res.status).toBe(403);
  });
});
