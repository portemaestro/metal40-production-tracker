import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, JwtPayload } from '../middleware/auth';
import { validateBody, loginSchema } from '../utils/validation';
import { success } from '../utils/response';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// Rate limiter specifico per login: 5 tentativi ogni 15 minuti
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Troppi tentativi di login, riprova tra 15 minuti', code: 'LOGIN_RATE_LIMIT', statusCode: 429 },
  },
});

// ── POST /api/auth/login ──
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, pin } = req.body;

    // Cerca utente per email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Credenziali non valide');
    }

    // Verifica che l'utente sia attivo
    if (!user.attivo) {
      throw new AuthenticationError('Utente disabilitato');
    }

    // Verifica PIN
    const pinValido = await bcrypt.compare(pin, user.pin);
    if (!pinValido) {
      throw new AuthenticationError('Credenziali non valide');
    }

    // Genera JWT (scadenza 8 ore)
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email!,
      ruolo: user.ruolo as 'ufficio' | 'operatore',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '8h',
    });

    // Log attivita'
    await prisma.logAttivita.create({
      data: {
        user_id: user.id,
        azione: 'login',
        dettagli: { ip: req.ip },
      },
    });

    logger.info('Login effettuato', { userId: user.id, ruolo: user.ruolo });

    // Risposta (senza PIN)
    return success(res, {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo,
        reparti: user.reparti,
      },
    });
  }),
);

// ── GET /api/auth/me ──
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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

    if (!user || !user.attivo) {
      throw new NotFoundError('Utente non trovato o disabilitato');
    }

    return success(res, { user });
  }),
);

// ── POST /api/auth/logout ──
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // JWT e' stateless: il client rimuove il token.
    // Logghiamo solo l'evento per audit trail.
    await prisma.logAttivita.create({
      data: {
        user_id: req.user!.userId,
        azione: 'logout',
      },
    });

    logger.info('Logout effettuato', { userId: req.user!.userId });

    return success(res, null, 200, 'Logout effettuato');
  }),
);

export default router;
