import jwt from 'jsonwebtoken';
import { createApp } from '../app';

const JWT_SECRET = 'test-jwt-secret-for-testing-only';

export function getApp() {
  return createApp();
}

export function generateToken(payload: { userId: number; email: string; ruolo: 'ufficio' | 'operatore' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

// Token pre-generati per i test
export const ufficioUser = { userId: 1, email: 'giuseppe@metal40.it', ruolo: 'ufficio' as const };
export const operatoreUser = { userId: 2, email: 'mario@metal40.it', ruolo: 'operatore' as const };

export const ufficioToken = generateToken(ufficioUser);
export const operatoreToken = generateToken(operatoreUser);
