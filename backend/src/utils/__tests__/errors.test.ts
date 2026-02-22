import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
} from '../errors';

describe('AppError', () => {
  it('crea errore con parametri corretti', () => {
    const err = new AppError('Test error', 418, 'TEST_CODE');

    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEST_CODE');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('supporta isOperational false', () => {
    const err = new AppError('Fatal', 500, 'FATAL', false);
    expect(err.isOperational).toBe(false);
  });
});

describe('Sottoclassi AppError', () => {
  it('ValidationError ha statusCode 400', () => {
    const err = new ValidationError('Campo non valido');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Campo non valido');
  });

  it('AuthenticationError ha statusCode 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_ERROR');
  });

  it('AuthorizationError ha statusCode 403', () => {
    const err = new AuthorizationError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('AUTHORIZATION_ERROR');
  });

  it('NotFoundError ha statusCode 404', () => {
    const err = new NotFoundError('Ordine non trovato');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('ConflictError ha statusCode 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('ServerError ha statusCode 500 e isOperational false', () => {
    const err = new ServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.isOperational).toBe(false);
  });
});
