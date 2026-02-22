import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../utils/validation';
import { success } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// ── Mappatura nome_fase → reparto ──
// Collega ogni fase produttiva al reparto responsabile

const FASE_REPARTO_MAP: Record<string, string> = {
  'Punzonatura Dalcos Falsetelaio': 'punzonatura_dalcos',
  'Punzonatura Dalcos Telaio': 'punzonatura_dalcos',
  'Taglio Barre': 'punzonatura_dalcos',
  'Punzonatura Euromac': 'punzonatura_euromac',
  'Piegatura Falsetelaio': 'piegatura',
  'Piegatura Telaio': 'piegatura',
  'Piegatura Accessori': 'piegatura',
  'Assemblaggio Falsetelaio': 'saldatura_assemblaggio',
  'Assemblaggio Telaio': 'saldatura_assemblaggio',
  'Saldatura/Assemblaggio': 'saldatura_assemblaggio',
  'Rivestimento Interno': 'rivestimento',
  'Rivestimento Esterno': 'rivestimento',
  'Prova in Telaio e Imballaggio': 'imballaggio',
  'Riconsegna Ufficio': 'imballaggio',
  'Verniciatura Esterna': 'verniciatura',
};

/**
 * Data una lista di reparti dell'operatore, restituisce
 * i nomi delle fasi che l'operatore puo' completare.
 */
function getFasiPerReparti(reparti: string[]): string[] {
  return Object.entries(FASE_REPARTO_MAP)
    .filter(([, reparto]) => reparti.includes(reparto))
    .map(([nomeFase]) => nomeFase);
}

// ── Schemi di validazione ──

const completaFaseSchema = z.object({
  note: z.string().max(1000).optional(),
  foto_paths: z.array(z.string().url()).max(5).optional(),
});

const listFasiMieQuerySchema = z.object({
  completate: z.enum(['true', 'false']).optional(),
});

// ── GET /api/fasi/mie ──
// Fasi assegnate ai reparti dell'operatore loggato
// NOTA: questa route DEVE stare prima di /:id per evitare conflitto
router.get(
  '/mie',
  authenticate,
  requireRole('operatore'),
  validateQuery(listFasiMieQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Recupera i reparti dell'operatore dal DB
    const utente = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { reparti: true },
    });

    if (!utente || !utente.reparti) {
      return success(res, []);
    }

    const repartiUtente = utente.reparti as string[];
    if (repartiUtente.length === 0) {
      return success(res, []);
    }

    // Nomi fasi che corrispondono ai reparti dell'operatore
    const fasiConsentite = getFasiPerReparti(repartiUtente);
    if (fasiConsentite.length === 0) {
      return success(res, []);
    }

    // Filtro completate/da_fare
    const { completate } = req.query as { completate?: string };
    const statoFiltro = completate === 'true' ? 'completata' : 'da_fare';

    // Recupera le fasi filtrate per nome_fase e stato,
    // solo per ordini in_produzione o bloccato (non spediti/pronti)
    const fasi = await prisma.faseProduzione.findMany({
      where: {
        nome_fase: { in: fasiConsentite },
        stato: statoFiltro,
        ordine: {
          stato: { in: ['in_produzione', 'bloccato'] },
        },
      },
      include: {
        ordine: {
          select: {
            id: true,
            numero_conferma: true,
            cliente: true,
            urgente: true,
            data_tassativa: true,
            stato: true,
            tipo_telaio: true,
            pdf_path: true,
          },
        },
        user: {
          select: { id: true, nome: true, cognome: true },
        },
      },
      orderBy: [
        { ordine: { urgente: 'desc' } },
        { ordine: { data_tassativa: 'asc' } },
        { ordine: { created_at: 'asc' } },
      ],
    });

    return success(res, fasi);
  }),
);

// ── GET /api/fasi/ordine/:ordineId ──
// Lista fasi di produzione per un ordine specifico
router.get(
  '/ordine/:ordineId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const ordineId = parseInt(req.params.ordineId);
    if (isNaN(ordineId) || ordineId <= 0) throw new ValidationError('ID ordine non valido');

    // Verifica che l'ordine esista
    const ordine = await prisma.ordine.findUnique({
      where: { id: ordineId },
      select: { id: true },
    });
    if (!ordine) throw new NotFoundError('Ordine non trovato');

    const fasi = await prisma.faseProduzione.findMany({
      where: { ordine_id: ordineId },
      include: {
        user: {
          select: { id: true, nome: true, cognome: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return success(res, fasi);
  }),
);

// ── POST /api/fasi/:id/completa ──
// Segna una fase come completata (solo operatore)
// Emette evento WebSocket 'fase_completata' alla room 'ufficio'
router.post(
  '/:id/completa',
  authenticate,
  requireRole('operatore'),
  validateBody(completaFaseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    // Recupera la fase con info ordine
    const fase = await prisma.faseProduzione.findUnique({
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
    if (!fase) throw new NotFoundError('Fase non trovata');

    // Non completare fasi gia' completate
    if (fase.stato === 'completata') {
      throw new ValidationError('Fase già completata');
    }

    // Verifica che l'operatore sia assegnato al reparto della fase
    const repartoFase = FASE_REPARTO_MAP[fase.nome_fase];
    if (repartoFase) {
      const utente = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { reparti: true, nome: true, cognome: true },
      });

      const repartiUtente = (utente?.reparti as string[]) ?? [];
      if (!repartiUtente.includes(repartoFase)) {
        throw new ValidationError(
          `Non sei assegnato al reparto "${repartoFase}" per completare questa fase`,
        );
      }
    }

    // Recupera nome utente per WebSocket (se non gia' recuperato sopra)
    const utente = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { nome: true, cognome: true },
    });

    const adesso = new Date();

    const aggiornata = await prisma.$transaction(async (tx) => {
      const result = await tx.faseProduzione.update({
        where: { id },
        data: {
          stato: 'completata',
          completata_da: req.user!.userId,
          data_completamento: adesso,
          ...(data.note !== undefined && { note: data.note }),
          ...(data.foto_paths !== undefined && { foto_paths: data.foto_paths }),
        },
        include: {
          user: {
            select: { id: true, nome: true, cognome: true },
          },
        },
      });

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: fase.ordine_id,
          azione: 'fase_completata',
          dettagli: {
            fase_id: id,
            nome_fase: fase.nome_fase,
          },
        },
      });

      return result;
    });

    // Emetti evento WebSocket alla room ufficio
    const io = req.app.get('io');
    if (io) {
      io.to('ufficio').emit('fase_completata', {
        ordine_id: fase.ordine.id,
        numero_conferma: fase.ordine.numero_conferma,
        cliente: fase.ordine.cliente,
        fase_id: id,
        nome_fase: fase.nome_fase,
        completata_da: utente ? `${utente.nome} ${utente.cognome}` : 'Sconosciuto',
        data_completamento: adesso.toISOString(),
      });
    }

    logger.info('Fase completata', {
      faseId: id,
      nomeFase: fase.nome_fase,
      ordineId: fase.ordine_id,
      userId: req.user!.userId,
    });

    return success(res, aggiornata, 200, 'Fase completata con successo');
  }),
);

export default router;
