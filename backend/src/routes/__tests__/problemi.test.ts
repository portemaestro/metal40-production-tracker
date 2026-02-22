import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { getApp, ufficioToken, operatoreToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/problemi', () => {
  it('lista problemi con token valido', async () => {
    mockPrismaClient.problema.findMany.mockResolvedValue([]);
    mockPrismaClient.problema.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/problemi')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toBeDefined();
  });
});

describe('POST /api/problemi/ordine/:ordineId', () => {
  it('segnala problema su ordine esistente', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({
      id: 1, numero_conferma: '2026-001', cliente: 'Test', stato: 'in_produzione',
    });
    mockPrismaClient.user.findUnique.mockResolvedValue({ nome: 'Mario', cognome: 'Rossi' });
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    });
    mockPrismaClient.problema.create.mockResolvedValue({
      id: 1,
      ordine_id: 1,
      tipo_problema: 'Manca materiale',
      descrizione: 'Manca il pannello esterno per questa porta',
      gravita: 'media',
      segnalato_da: 2,
      data_segnalazione: new Date(),
      risolto: false,
      user_segnalatore: { id: 2, nome: 'Mario', cognome: 'Rossi' },
    });
    mockPrismaClient.logAttivita.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/problemi/ordine/1')
      .set('Authorization', `Bearer ${operatoreToken}`)
      .send({
        tipo_problema: 'Manca materiale',
        descrizione: 'Manca il pannello esterno per questa porta',
        gravita: 'media',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('validazione: descrizione troppo corta', async () => {
    const res = await request(app)
      .post('/api/problemi/ordine/1')
      .set('Authorization', `Bearer ${operatoreToken}`)
      .send({
        tipo_problema: 'Manca materiale',
        descrizione: 'corta',
        gravita: 'media',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/note/ordine/:ordineId', () => {
  it('aggiunge nota a ordine esistente', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue({ id: 1 });
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    });
    mockPrismaClient.nota.create.mockResolvedValue({
      id: 1,
      ordine_id: 1,
      testo: 'Nota di test per questo ordine',
      creato_da: 1,
      created_at: new Date(),
      user: { id: 1, nome: 'Giuseppe', cognome: 'Rossi', ruolo: 'ufficio', reparti: null },
    });
    mockPrismaClient.logAttivita.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/note/ordine/1')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({ testo: 'Nota di test per questo ordine' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('nota su ordine inesistente restituisce 404', async () => {
    mockPrismaClient.ordine.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/note/ordine/999')
      .set('Authorization', `Bearer ${ufficioToken}`)
      .send({ testo: 'Nota di test per questo ordine' });

    expect(res.status).toBe(404);
  });
});
