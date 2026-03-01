import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../utils/validation';
import { createUserSchema, updateUserSchema } from '../utils/validation';
import { success } from '../utils/response';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// All admin routes require ufficio role
router.use(authenticate, requireRole('ufficio'));

// ── GET /api/admin/users ── Lista tutti gli utenti ──
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        reparti: true,
        attivo: true,
        created_at: true,
      },
      orderBy: [{ attivo: 'desc' }, { nome: 'asc' }],
    });

    // Parse reparti JSON string to array
    const parsed = users.map((u) => ({
      ...u,
      reparti: u.reparti ? JSON.parse(u.reparti as string) : [],
    }));

    return success(res, { users: parsed });
  })
);

// ── POST /api/admin/users ── Crea nuovo utente ──
router.post(
  '/users',
  validateBody(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { nome, cognome, email, pin, ruolo, reparti } = req.body;
    const emailValue = email || null;

    // Check email uniqueness (only if email provided)
    if (emailValue) {
      const existing = await prisma.user.findUnique({ where: { email: emailValue } });
      if (existing) {
        throw new ConflictError('Esiste già un utente con questa email');
      }
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        cognome,
        email: emailValue,
        pin: hashedPin,
        ruolo,
        reparti: ruolo === 'operatore' ? JSON.stringify(reparti) : Prisma.DbNull,
        attivo: true,
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        reparti: true,
        attivo: true,
        created_at: true,
      },
    });

    logger.info(`Utente creato: ${nome} ${cognome} (${ruolo}) da userId=${req.user!.userId}`);

    return success(
      res,
      {
        user: {
          ...user,
          reparti: user.reparti ? JSON.parse(user.reparti as string) : [],
        },
      },
      201,
      'Utente creato con successo'
    );
  })
);

// ── PUT /api/admin/users/:id ── Modifica utente ──
router.put(
  '/users/:id',
  validateBody(updateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('ID non valido');

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Utente non trovato');
    }

    const { nome, cognome, email, pin, ruolo, reparti, attivo } = req.body;
    const emailValue = email === '' ? null : email;

    // Check email uniqueness if changing
    if (emailValue && emailValue !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: emailValue } });
      if (emailTaken) {
        throw new ConflictError('Esiste già un utente con questa email');
      }
    }

    // Determine final role for reparti validation
    const finalRuolo = ruolo ?? existing.ruolo;
    const finalReparti = reparti ?? (existing.reparti ? JSON.parse(existing.reparti as string) : []);
    if (finalRuolo === 'operatore' && finalReparti.length === 0) {
      throw new ValidationError('Un operatore deve avere almeno un reparto assegnato');
    }

    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = nome;
    if (cognome !== undefined) data.cognome = cognome;
    if (email !== undefined) data.email = emailValue;
    if (ruolo !== undefined) data.ruolo = ruolo;
    if (attivo !== undefined) data.attivo = attivo;
    if (reparti !== undefined) {
      data.reparti = finalRuolo === 'operatore' ? JSON.stringify(reparti) : Prisma.DbNull;
    }
    if (ruolo === 'ufficio' && reparti === undefined) {
      data.reparti = Prisma.DbNull;
    }
    if (pin) {
      data.pin = await bcrypt.hash(pin, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        ruolo: true,
        reparti: true,
        attivo: true,
        created_at: true,
      },
    });

    logger.info(`Utente modificato: id=${id} da userId=${req.user!.userId}`);

    return success(res, {
      user: {
        ...user,
        reparti: user.reparti ? JSON.parse(user.reparti as string) : [],
      },
    });
  })
);

// ── DELETE /api/admin/users/:id ── Disattiva utente (soft delete) ──
router.delete(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('ID non valido');

    if (id === req.user!.userId) {
      throw new ValidationError('Non puoi disattivare il tuo stesso account');
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Utente non trovato');
    }

    await prisma.user.update({
      where: { id },
      data: { attivo: false },
    });

    logger.info(`Utente disattivato: id=${id} da userId=${req.user!.userId}`);

    return success(res, null, 200, 'Utente disattivato');
  })
);

export default router;
