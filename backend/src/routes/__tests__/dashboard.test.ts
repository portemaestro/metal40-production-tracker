import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { getApp, ufficioToken, operatoreToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/dashboard/stats', () => {
  it('restituisce KPI per ufficio', async () => {
    mockPrismaClient.ordine.groupBy.mockResolvedValue([
      { stato: 'in_produzione', _count: { id: 3 } },
      { stato: 'bloccato', _count: { id: 1 } },
    ]);
    mockPrismaClient.ordine.count
      .mockResolvedValueOnce(2) // urgenti
      .mockResolvedValueOnce(0); // in ritardo
    mockPrismaClient.problema.count.mockResolvedValue(1);
    mockPrismaClient.problema.groupBy.mockResolvedValue([
      { gravita: 'media', _count: { id: 1 } },
    ]);
    mockPrismaClient.materiale.count
      .mockResolvedValueOnce(5)  // da_ordinare
      .mockResolvedValueOnce(2)  // ordinati_in_attesa
      .mockResolvedValueOnce(3); // arrivati
    mockPrismaClient.problema.findMany.mockResolvedValue([]);
    mockPrismaClient.ordine.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpi).toBeDefined();
    expect(res.body.data.kpi.in_produzione).toBe(4); // 3 + 1 bloccato
    expect(res.body.data.dettagli).toBeDefined();
  });

  it('operatore non accede alla dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${operatoreToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/dashboard/alert', () => {
  it('restituisce alert per ufficio', async () => {
    mockPrismaClient.materiale.findMany
      .mockResolvedValueOnce([]) // materiali da ordinare
      .mockResolvedValueOnce([]); // materiali in arrivo
    mockPrismaClient.problema.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/dashboard/alert')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ha_alert).toBe(false);
    expect(res.body.data.materiali_da_ordinare).toEqual([]);
    expect(res.body.data.problemi_aperti).toEqual([]);
    expect(res.body.data.materiali_in_arrivo).toEqual([]);
  });
});
