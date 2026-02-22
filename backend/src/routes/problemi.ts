import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../utils/validation';
import { success, paginated } from '../utils/response';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { TIPI_PROBLEMA, PROBLEMA_GRAVITA } from '../constants';
import logger from '../utils/logger';

const router = Router();

// ── Schemi di validazione ──

const listProblemiQuerySchema = z.object({
  risolto: z.enum(['true', 'false', 'all']).optional().default('all'),
  gravita: z.enum([...PROBLEMA_GRAVITA, '' as const]).optional(),
  ordine_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const segnalaProblemaSchema = z.object({
  fase: z.string().max(100).optional(),
  tipo_problema: z.enum(TIPI_PROBLEMA),
  descrizione: z.string().min(10, 'La descrizione deve avere almeno 10 caratteri').max(2000),
  gravita: z.enum(PROBLEMA_GRAVITA),
  foto_paths: z.array(z.string().url()).max(10).optional().default([]),
});

const risolviProblemaSchema = z.object({
  descrizione_risoluzione: z
    .string()
    .min(10, 'La descrizione deve avere almeno 10 caratteri')
    .max(2000),
  foto_risoluzione_paths: z.array(z.string().url()).max(10).optional().default([]),
});

// ── GET /api/problemi ──
// Lista problemi con filtri e paginazione
router.get(
  '/',
  authenticate,
  validateQuery(listProblemiQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { risolto, gravita, ordine_id, page, limit } = req.query as unknown as {
      risolto: string;
      gravita?: string;
      ordine_id?: number;
      page: number;
      limit: number;
    };

    // Costruisci filtro where
    const where: Record<string, unknown> = {};

    if (risolto === 'true') where.risolto = true;
    else if (risolto === 'false') where.risolto = false;
    // 'all' = nessun filtro su risolto

    if (gravita && gravita !== '') where.gravita = gravita;
    if (ordine_id) where.ordine_id = ordine_id;

    const [problemi, total] = await Promise.all([
      prisma.problema.findMany({
        where,
        include: {
          ordine: {
            select: {
              id: true,
              numero_conferma: true,
              cliente: true,
            },
          },
          user_segnalatore: {
            select: { id: true, nome: true, cognome: true },
          },
          user_risolutore: {
            select: { id: true, nome: true, cognome: true },
          },
        },
        orderBy: [
          { risolto: 'asc' }, // Non risolti prima
          { gravita: 'desc' }, // Bloccanti prima
          { data_segnalazione: 'desc' }, // Più recenti prima
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problema.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return paginated(res, problemi, {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    });
  }),
);

// ── GET /api/problemi/:id ──
// Dettaglio singolo problema
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const problema = await prisma.problema.findUnique({
      where: { id },
      include: {
        ordine: {
          select: {
            id: true,
            numero_conferma: true,
            cliente: true,
            tipo_telaio: true,
            urgente: true,
            data_tassativa: true,
            stato: true,
          },
        },
        user_segnalatore: {
          select: { id: true, nome: true, cognome: true, ruolo: true },
        },
        user_risolutore: {
          select: { id: true, nome: true, cognome: true, ruolo: true },
        },
      },
    });

    if (!problema) throw new NotFoundError('Problema non trovato');

    return success(res, problema);
  }),
);

// ── POST /api/problemi/ordine/:ordineId ──
// Segnala un problema su un ordine (tutti gli utenti autenticati)
router.post(
  '/ordine/:ordineId',
  authenticate,
  validateBody(segnalaProblemaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ordineId = parseInt(req.params.ordineId);
    if (isNaN(ordineId) || ordineId <= 0) throw new ValidationError('ID ordine non valido');

    const data = req.body;

    // Verifica che l'ordine esista
    const ordine = await prisma.ordine.findUnique({
      where: { id: ordineId },
      select: { id: true, numero_conferma: true, cliente: true, stato: true },
    });
    if (!ordine) throw new NotFoundError('Ordine non trovato');

    // Recupera nome utente per WebSocket
    const utente = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { nome: true, cognome: true },
    });

    const problema = await prisma.$transaction(async (tx) => {
      const result = await tx.problema.create({
        data: {
          ordine_id: ordineId,
          fase: data.fase || null,
          tipo_problema: data.tipo_problema,
          descrizione: data.descrizione,
          gravita: data.gravita,
          segnalato_da: req.user!.userId,
          foto_segnalazione_paths: data.foto_paths.length > 0 ? data.foto_paths : undefined,
        },
        include: {
          user_segnalatore: {
            select: { id: true, nome: true, cognome: true },
          },
        },
      });

      // Se bloccante, aggiorna stato ordine
      if (data.gravita === 'alta_bloccante') {
        await tx.ordine.update({
          where: { id: ordineId },
          data: { stato: 'bloccato' },
        });
      }

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: ordineId,
          azione: 'problema_segnalato',
          dettagli: {
            problema_id: result.id,
            tipo_problema: data.tipo_problema,
            gravita: data.gravita,
            fase: data.fase || null,
          },
        },
      });

      return result;
    });

    // Emetti evento WebSocket alla room ufficio
    const io = req.app.get('io');
    if (io) {
      io.to('ufficio').emit('problema_segnalato', {
        problema_id: problema.id,
        ordine_id: ordine.id,
        numero_conferma: ordine.numero_conferma,
        cliente: ordine.cliente,
        fase: data.fase || null,
        gravita: data.gravita,
        tipo_problema: data.tipo_problema,
        descrizione: data.descrizione,
        segnalato_da: req.user!.userId,
        segnalato_da_nome: utente ? `${utente.nome} ${utente.cognome}` : 'Sconosciuto',
        data_segnalazione: problema.data_segnalazione.toISOString(),
        foto_segnalazione_paths: data.foto_paths,
      });
    }

    logger.info('Problema segnalato', {
      problemaId: problema.id,
      ordineId,
      gravita: data.gravita,
      tipo: data.tipo_problema,
      userId: req.user!.userId,
    });

    return success(res, problema, 201, 'Problema segnalato con successo');
  }),
);

// ── PUT /api/problemi/:id/risolvi ──
// Risolvi un problema (ufficio oppure chi lo ha segnalato)
router.put(
  '/:id/risolvi',
  authenticate,
  validateBody(risolviProblemaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    // Recupera il problema con dati ordine
    const problema = await prisma.problema.findUnique({
      where: { id },
      include: {
        ordine: {
          select: {
            id: true,
            numero_conferma: true,
            cliente: true,
            stato: true,
          },
        },
      },
    });
    if (!problema) throw new NotFoundError('Problema non trovato');

    if (problema.risolto) {
      throw new ValidationError('Problema già risolto');
    }

    // Verifica autorizzazione: ufficio oppure chi ha segnalato
    if (req.user!.ruolo !== 'ufficio' && req.user!.userId !== problema.segnalato_da) {
      throw new AuthorizationError('Non sei autorizzato a risolvere questo problema');
    }

    // Recupera nome utente per WebSocket
    const utente = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { nome: true, cognome: true },
    });

    const adesso = new Date();

    const aggiornato = await prisma.$transaction(async (tx) => {
      const result = await tx.problema.update({
        where: { id },
        data: {
          risolto: true,
          risolto_da: req.user!.userId,
          data_risoluzione: adesso,
          descrizione_risoluzione: data.descrizione_risoluzione,
          foto_risoluzione_paths:
            data.foto_risoluzione_paths.length > 0 ? data.foto_risoluzione_paths : undefined,
        },
        include: {
          user_risolutore: {
            select: { id: true, nome: true, cognome: true, ruolo: true },
          },
        },
      });

      // Se era bloccante e l'ordine è bloccato, ripristina in_produzione
      if (problema.gravita === 'alta_bloccante' && problema.ordine.stato === 'bloccato') {
        await tx.ordine.update({
          where: { id: problema.ordine_id },
          data: { stato: 'in_produzione' },
        });
      }

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: problema.ordine_id,
          azione: 'problema_risolto',
          dettagli: {
            problema_id: id,
            gravita: problema.gravita,
            tempo_risoluzione_ore: parseFloat(
              (
                (adesso.getTime() - problema.data_segnalazione.getTime()) /
                (1000 * 60 * 60)
              ).toFixed(2),
            ),
          },
        },
      });

      return result;
    });

    // Emetti evento WebSocket al segnalatore
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${problema.segnalato_da}`).emit('problema_risolto', {
        problema_id: id,
        ordine_id: problema.ordine.id,
        numero_conferma: problema.ordine.numero_conferma,
        cliente: problema.ordine.cliente,
        risolto_da: req.user!.userId,
        risolto_da_nome: utente ? `${utente.nome} ${utente.cognome}` : 'Sconosciuto',
        descrizione_risoluzione: data.descrizione_risoluzione,
        data_risoluzione: adesso.toISOString(),
        foto_risoluzione_paths: data.foto_risoluzione_paths,
      });
    }

    logger.info('Problema risolto', {
      problemaId: id,
      ordineId: problema.ordine_id,
      gravita: problema.gravita,
      tempoRisoluzione: `${((adesso.getTime() - problema.data_segnalazione.getTime()) / (1000 * 60 * 60)).toFixed(2)}h`,
      userId: req.user!.userId,
    });

    return success(res, aggiornato, 200, 'Problema risolto con successo');
  }),
);

export default router;
