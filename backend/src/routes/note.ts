import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../utils/validation';
import { success, paginated } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// ── Schemi di validazione ──

const listNoteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const creaNotaSchema = z.object({
  testo: z.string().min(1, 'Il testo è obbligatorio').max(1000),
  foto_paths: z.array(z.string().url()).max(10).optional().default([]),
});

// ── GET /api/note/ordine/:ordineId ──
// Lista note per un ordine specifico (ordinate per data, più recenti prima)
router.get(
  '/ordine/:ordineId',
  authenticate,
  validateQuery(listNoteQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ordineId = parseInt(req.params.ordineId);
    if (isNaN(ordineId) || ordineId <= 0) throw new ValidationError('ID ordine non valido');

    const { page, limit } = req.query as unknown as { page: number; limit: number };

    // Verifica che l'ordine esista
    const ordine = await prisma.ordine.findUnique({
      where: { id: ordineId },
      select: { id: true },
    });
    if (!ordine) throw new NotFoundError('Ordine non trovato');

    const [note, total] = await Promise.all([
      prisma.nota.findMany({
        where: { ordine_id: ordineId },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              ruolo: true,
              reparti: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.nota.count({ where: { ordine_id: ordineId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return paginated(res, note, {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    });
  }),
);

// ── POST /api/note/ordine/:ordineId ──
// Aggiungi una nota a un ordine (tutti gli utenti autenticati)
router.post(
  '/ordine/:ordineId',
  authenticate,
  validateBody(creaNotaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ordineId = parseInt(req.params.ordineId);
    if (isNaN(ordineId) || ordineId <= 0) throw new ValidationError('ID ordine non valido');

    const data = req.body;

    // Verifica che l'ordine esista
    const ordine = await prisma.ordine.findUnique({
      where: { id: ordineId },
      select: { id: true },
    });
    if (!ordine) throw new NotFoundError('Ordine non trovato');

    const nota = await prisma.$transaction(async (tx) => {
      const result = await tx.nota.create({
        data: {
          ordine_id: ordineId,
          testo: data.testo,
          foto_paths: data.foto_paths.length > 0 ? data.foto_paths : undefined,
          creato_da: req.user!.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              ruolo: true,
              reparti: true,
            },
          },
        },
      });

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: ordineId,
          azione: 'nota_aggiunta',
          dettagli: {
            nota_id: result.id,
            testo_preview: data.testo.substring(0, 50),
          },
        },
      });

      return result;
    });

    logger.info('Nota aggiunta', {
      notaId: nota.id,
      ordineId,
      userId: req.user!.userId,
    });

    return success(res, nota, 201, 'Nota aggiunta con successo');
  }),
);

export default router;
