import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { getApp, ufficioToken, operatoreToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

const mockOrdine = {
  id: 1,
  numero_conferma: '2026-001',
  cliente: 'Test Cliente',
  riferimento: null,
  data_ordine: new Date('2026-02-01'),
  quantita_porte: 1,
  tipo_telaio: 'standard_falsotelaio',
  colore_telaio_interno: 'marrone',
  colore_telaio_esterno: 'marrone',
  verniciatura_necessaria: false,
  urgente: false,
  data_tassativa: null,
  pdf_path: null,
  note_generali: null,
  stato: 'in_produzione',
  created_at: new Date(),
  updated_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/ordini', () => {
  it('lista ordini con token valido', async () => {
    mockPrismaClient.ordine.findMany.mockResolvedValue([mockOrdine]);
    mockPrismaClient.ordine.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/ordini')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('restituisce 401 senza token', async () => {
    const res = await request(app).get('/api/ordini');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/ordini/:id', () => {
  it('dettaglio ordine esistente', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({
      ...mockOrdine,
      materiali: [],
      fasi: [],
      problemi: [],
      note: [],
    });

    const res = await request(app)
      .get('/api/ordini/1')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.numero_conferma).toBe('2026-001');
  });

  it('ordine non trovato restituisce 404', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/ordini/999')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(404);
  });

  it('ID non valido restituisce 400', async () => {
    const res = await request(app)
      .get('/api/ordini/abc')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/ordini', () => {
  it('crea ordine con ruolo ufficio', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue(null); // no duplicato
    // $transaction chiama la funzione con il mock prisma client
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    });
    mockPrismaClient.ordine.create.mockResolvedValue({ ...mockOrdine, id: 2 });
    mockPrismaClient.faseProduzione.createMany.mockResolvedValue({ count: 13 });
    mockPrismaClient.logAttivita.create.mockResolvedValue({});
    // findUnique nella transaction per restituire ordine con fasi
    mockPrismaClient.ordine.findUnique
      .mockResolvedValueOnce(null) // primo: check duplicato
      .mockResolvedValueOnce({ ...mockOrdine, id: 2, fasi: [], materiali: [] }); // secondo: return

    const res = await request(app)
      .post('/api/ordini')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({
        numero_conferma: '2026-002',
        cliente: 'Nuovo Cliente',
        data_ordine: '2026-02-20',
        quantita_porte: 1,
        tipo_telaio: 'standard_falsotelaio',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('operatore non puo creare ordini', async () => {
    const res = await request(app)
      .post('/api/ordini')
      .set('Authorization', `Bearer ${operatoreToken}`)
      .send({
        numero_conferma: '2026-002',
        cliente: 'Nuovo Cliente',
        data_ordine: '2026-02-20',
        tipo_telaio: 'standard_falsotelaio',
      });

    expect(res.status).toBe(403);
  });

  it('validazione: numero_conferma obbligatorio', async () => {
    const res = await request(app)
      .post('/api/ordini')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({
        cliente: 'Nuovo Cliente',
        data_ordine: '2026-02-20',
        tipo_telaio: 'standard_falsotelaio',
      });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/ordini/:id', () => {
  it('elimina ordine in produzione', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue(mockOrdine);
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    });
    mockPrismaClient.logAttivita.create.mockResolvedValue({});
    mockPrismaClient.ordine.delete.mockResolvedValue(mockOrdine);

    const res = await request(app)
      .delete('/api/ordini/1')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('non elimina ordine spedito', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({ ...mockOrdine, stato: 'spedito' });

    const res = await request(app)
      .delete('/api/ordini/1')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(400);
  });
});
