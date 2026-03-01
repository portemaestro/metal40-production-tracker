import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { z } from 'zod';
import { ValidationError } from './errors';

// ── Middleware di validazione ──

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => e.message).join(', ');
        next(new ValidationError(messages));
      } else {
        next(err);
      }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => e.message).join(', ');
        next(new ValidationError(messages));
      } else {
        next(err);
      }
    }
  };
}

// ── Schemi comuni ──

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  pin: z
    .string()
    .length(4, 'Il PIN deve essere di 4 cifre')
    .regex(/^\d{4}$/, 'Il PIN deve contenere solo numeri'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID non valido'),
});

// ── Schemi utenti admin ──

export const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio').max(50),
  cognome: z.string().min(1, 'Cognome obbligatorio').max(50),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  pin: z
    .string()
    .length(4, 'Il PIN deve essere di 4 cifre')
    .regex(/^\d{4}$/, 'Il PIN deve contenere solo numeri'),
  ruolo: z.enum(['ufficio', 'operatore'], { errorMap: () => ({ message: 'Ruolo non valido' }) }),
  reparti: z.array(z.string()).optional().default([]),
}).refine(
  (data) => data.ruolo !== 'operatore' || (data.reparti && data.reparti.length > 0),
  { message: 'Un operatore deve avere almeno un reparto assegnato', path: ['reparti'] }
);

export const updateUserSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio').max(50).optional(),
  cognome: z.string().min(1, 'Cognome obbligatorio').max(50).optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  pin: z
    .string()
    .length(4, 'Il PIN deve essere di 4 cifre')
    .regex(/^\d{4}$/, 'Il PIN deve contenere solo numeri')
    .optional(),
  ruolo: z.enum(['ufficio', 'operatore'], { errorMap: () => ({ message: 'Ruolo non valido' }) }).optional(),
  reparti: z.array(z.string()).optional(),
  attivo: z.boolean().optional(),
});
