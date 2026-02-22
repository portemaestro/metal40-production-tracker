import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { getApp, ufficioToken } from '../../__tests__/helpers';
import { mockPrismaClient } from '../../__tests__/setup';

const app = getApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  const validUser = {
    id: 1,
    nome: 'Giuseppe',
    cognome: 'Rossi',
    email: 'giuseppe@metal40.it',
    pin: bcrypt.hashSync('1234', 10),
    ruolo: 'ufficio',
    reparti: null,
    attivo: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('login valido restituisce token e user', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(validUser);
    mockPrismaClient.logAttivita.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'giuseppe@metal40.it', pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('giuseppe@metal40.it');
    expect(res.body.data.user.ruolo).toBe('ufficio');
    expect(res.body.data.user).not.toHaveProperty('pin');
  });

  it('email inesistente restituisce 401', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexist@metal40.it', pin: '1234' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('PIN errato restituisce 401', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'giuseppe@metal40.it', pin: '9999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('utente disabilitato restituisce 401', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({ ...validUser, attivo: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'giuseppe@metal40.it', pin: '1234' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('validazione fallisce senza email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ pin: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('validazione fallisce con PIN non di 4 cifre', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'giuseppe@metal40.it', pin: '12' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('restituisce utente con token valido', async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Giuseppe',
      cognome: 'Rossi',
      email: 'giuseppe@metal40.it',
      ruolo: 'ufficio',
      reparti: null,
      attivo: true,
      created_at: new Date(),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('giuseppe@metal40.it');
  });

  it('restituisce 401 senza token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  it('logout con token valido restituisce successo', async () => {
    mockPrismaClient.logAttivita.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${ufficioToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
