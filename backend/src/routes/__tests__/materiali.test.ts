import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { getApp, ufficioToken, operatoreToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

const mockMateriale = {
  id: 1,
  ordine_id: 1,
  tipo_materiale: 'pannello_esterno',
  sottotipo: 'okoume',
  necessario: true,
  ordine_effettuato: false,
  arrivato: false,
  data_ordine_effettivo: null,
  data_consegna_prevista: null,
  data_arrivo_effettivo: null,
  note: null,
  misure: null,
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/materiali/da-ordinare', () => {
  it('lista materiali da ordinare (solo ufficio)', async () => {
    mockPrismaClient.materiale.findMany.mockResolvedValue([
      {
        ...mockMateriale,
        ordine: { id: 1, numero_conferma: '2026-001', cliente: 'Test', urgente: false, data_tassativa: null },
      },
    ]);

    const res = await request(app)
      .get('/api/materiali/da-ordinare')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totale).toBe(1);
  });

  it('operatore non accede a da-ordinare', async () => {
    const res = await request(app)
      .get('/api/materiali/da-ordinare')
      .set('Authorization', `Bearer ${operatoreToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/materiali/ordine/:ordineId', () => {
  it('lista materiali per ordine', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({ id: 1 });
    mockPrismaClient.materiale.findMany.mockResolvedValue([mockMateriale]);

    const res = await request(app)
      .get('/api/materiali/ordine/1')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('ordine non trovato restituisce 404', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/materiali/ordine/999')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/materiali/:id/ordina', () => {
  it('segna materiale come ordinato', async () => {
    mockPrismaClient.materiale.findUnique.mockResolvedValue(mockMateriale);
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    });
    mockPrismaClient.materiale.update.mockResolvedValue({ ...mockMateriale, ordine_effettuato: true });
    mockPrismaClient.logAttivita.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/materiali/1/ordina')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({
        data_ordine_effettivo: '2026-02-20',
        data_consegna_prevista: '2026-03-20',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('materiale gia ordinato restituisce 400', async () => {
    mockPrismaClient.materiale.findUnique.mockResolvedValue({ ...mockMateriale, ordine_effettuato: true });

    const res = await request(app)
      .post('/api/materiali/1/ordina')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({
        data_ordine_effettivo: '2026-02-20',
        data_consegna_prevista: '2026-03-20',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/materiali/:id/arrivato', () => {
  it('materiale non ordinato non puo arrivare', async () => {
    mockPrismaClient.materiale.findUnique.mockResolvedValue({
      ...mockMateriale,
      ordine_effettuato: false,
      ordine: { id: 1, numero_conferma: '2026-001', cliente: 'Test' },
    });

    const res = await request(app)
      .post('/api/materiali/1/arrivato')
      .set('Authorization', `Bearer ${operatoreToken}`)
      .send({ data_arrivo_effettivo: '2026-03-20' });

    expect(res.status).toBe(400);
  });
});
