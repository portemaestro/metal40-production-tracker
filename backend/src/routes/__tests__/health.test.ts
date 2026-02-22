import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getApp } from '../../__tests__/helpers';

const app = getApp();

describe('GET /api/health', () => {
  it('restituisce status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.timestamp).toBeDefined();
  });
});
