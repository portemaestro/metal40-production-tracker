import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../utils/validation';
import { success } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// ── Schemi di validazione ──

const updateMaterialeSchema = z.object({
  note: z.string().max(500).optional(),
  misure: z.string().max(100).optional(),
  data_consegna_prevista: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD')
    .optional(),
});

const ordinaMaterialeSchema = z
  .object({
    data_ordine_effettivo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD'),
    data_consegna_prevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD'),
    note: z.string().max(500).optional(),
  })
  .refine(
    (data) => new Date(data.data_consegna_prevista) >= new Date(data.data_ordine_effettivo),
    {
      message: 'La data di consegna prevista deve essere uguale o successiva alla data ordine',
      path: ['data_consegna_prevista'],
    },
  );

const arrivoMaterialeSchema = z.object({
  data_arrivo_effettivo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD'),
  note: z.string().max(500).optional(),
});

// ── GET /api/materiali/da-ordinare ──
// Lista materiali necessari non ancora ordinati (solo ufficio)
// NOTA: questa route DEVE stare prima di /:id per evitare conflitto
router.get(
  '/da-ordinare',
  authenticate,
  requireRole('ufficio'),
  asyncHandler(async (_req: Request, res: Response) => {
    // Trova tutti i materiali necessari ma non ancora ordinati
    const materiali = await prisma.materiale.findMany({
      where: {
        necessario: true,
        ordine_effettuato: false,
      },
      include: {
        ordine: {
          select: {
            id: true,
            numero_conferma: true,
            cliente: true,
            urgente: true,
            data_tassativa: true,
          },
        },
      },
      orderBy: [
        { ordine: { urgente: 'desc' } },
        { ordine: { created_at: 'desc' } },
      ],
    });

    // Raggruppa per ordine
    const ordiniMap = new Map<
      number,
      {
        ordine_id: number;
        numero_conferma: string;
        cliente: string;
        urgente: boolean;
        data_tassativa: Date | null;
        materiali: typeof materiali;
      }
    >();

    for (const mat of materiali) {
      if (!ordiniMap.has(mat.ordine_id)) {
        ordiniMap.set(mat.ordine_id, {
          ordine_id: mat.ordine.id,
          numero_conferma: mat.ordine.numero_conferma,
          cliente: mat.ordine.cliente,
          urgente: mat.ordine.urgente,
          data_tassativa: mat.ordine.data_tassativa,
          materiali: [],
        });
      }
      ordiniMap.get(mat.ordine_id)!.materiali.push(mat);
    }

    const ordini = Array.from(ordiniMap.values());

    return success(res, {
      totale: materiali.length,
      ordini,
    });
  }),
);

// ── GET /api/materiali/ordine/:ordineId ──
// Lista materiali per un ordine specifico
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

    const materiali = await prisma.materiale.findMany({
      where: { ordine_id: ordineId },
      orderBy: { id: 'asc' },
    });

    return success(res, materiali);
  }),
);

// ── PUT /api/materiali/:id ──
// Modifica dettagli materiale (note, misure, data consegna prevista)
router.put(
  '/:id',
  authenticate,
  requireRole('ufficio'),
  validateBody(updateMaterialeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    // Verifica che il materiale esista
    const materiale = await prisma.materiale.findUnique({ where: { id } });
    if (!materiale) throw new NotFoundError('Materiale non trovato');

    // Costruisci oggetto update (solo campi forniti)
    const updateData: Record<string, unknown> = {};
    if (data.note !== undefined) updateData.note = data.note;
    if (data.misure !== undefined) updateData.misure = data.misure;
    if (data.data_consegna_prevista !== undefined) {
      updateData.data_consegna_prevista = new Date(data.data_consegna_prevista);
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('Nessun campo da aggiornare');
    }

    const aggiornato = await prisma.$transaction(async (tx) => {
      const result = await tx.materiale.update({
        where: { id },
        data: updateData,
      });

      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: materiale.ordine_id,
          azione: 'materiale_modificato',
          dettagli: {
            materiale_id: id,
            tipo_materiale: materiale.tipo_materiale,
            campi_modificati: Object.keys(updateData),
          },
        },
      });

      return result;
    });

    logger.info('Materiale modificato', {
      materialeId: id,
      ordineId: materiale.ordine_id,
      campi: Object.keys(updateData),
      userId: req.user!.userId,
    });

    return success(res, aggiornato, 200, 'Materiale aggiornato con successo');
  }),
);

// ── POST /api/materiali/:id/ordina ──
// Segna materiale come ordinato (solo ufficio)
router.post(
  '/:id/ordina',
  authenticate,
  requireRole('ufficio'),
  validateBody(ordinaMaterialeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    const materiale = await prisma.materiale.findUnique({ where: { id } });
    if (!materiale) throw new NotFoundError('Materiale non trovato');

    if (materiale.ordine_effettuato) {
      throw new ValidationError('Materiale già segnato come ordinato');
    }

    const aggiornato = await prisma.$transaction(async (tx) => {
      const result = await tx.materiale.update({
        where: { id },
        data: {
          ordine_effettuato: true,
          data_ordine_effettivo: new Date(data.data_ordine_effettivo),
          data_consegna_prevista: new Date(data.data_consegna_prevista),
          ...(data.note !== undefined && { note: data.note }),
        },
      });

      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: materiale.ordine_id,
          azione: 'materiale_ordinato',
          dettagli: {
            materiale_id: id,
            tipo_materiale: materiale.tipo_materiale,
            sottotipo: materiale.sottotipo,
            data_ordine: data.data_ordine_effettivo,
            data_consegna_prevista: data.data_consegna_prevista,
          },
        },
      });

      return result;
    });

    logger.info('Materiale ordinato', {
      materialeId: id,
      ordineId: materiale.ordine_id,
      tipo: materiale.tipo_materiale,
      userId: req.user!.userId,
    });

    return success(res, aggiornato, 200, 'Materiale segnato come ordinato');
  }),
);

// ── POST /api/materiali/:id/arrivato ──
// Segna materiale come arrivato (tutti gli utenti autenticati)
// Emette evento WebSocket 'materiale_arrivato' alla room 'ufficio'
router.post(
  '/:id/arrivato',
  authenticate,
  validateBody(arrivoMaterialeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    const materiale = await prisma.materiale.findUnique({
      where: { id },
      include: {
        ordine: {
          select: {
            id: true,
            numero_conferma: true,
            cliente: true,
          },
        },
      },
    });
    if (!materiale) throw new NotFoundError('Materiale non trovato');

    if (materiale.arrivato) {
      throw new ValidationError('Materiale già segnato come arrivato');
    }

    if (!materiale.ordine_effettuato) {
      throw new ValidationError('Il materiale deve essere prima ordinato');
    }

    // Recupera nome utente per l'evento WebSocket
    const utente = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { nome: true, cognome: true },
    });

    const aggiornato = await prisma.$transaction(async (tx) => {
      const result = await tx.materiale.update({
        where: { id },
        data: {
          arrivato: true,
          data_arrivo_effettivo: new Date(data.data_arrivo_effettivo),
          ...(data.note !== undefined && { note: data.note }),
        },
      });

      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: materiale.ordine_id,
          azione: 'materiale_arrivato',
          dettagli: {
            materiale_id: id,
            tipo_materiale: materiale.tipo_materiale,
            sottotipo: materiale.sottotipo,
            data_arrivo: data.data_arrivo_effettivo,
          },
        },
      });

      return result;
    });

    // Emetti evento WebSocket alla room ufficio
    const io = req.app.get('io');
    if (io) {
      io.to('ufficio').emit('materiale_arrivato', {
        ordine_id: materiale.ordine.id,
        numero_conferma: materiale.ordine.numero_conferma,
        cliente: materiale.ordine.cliente,
        materiale_id: id,
        tipo_materiale: materiale.tipo_materiale,
        sottotipo: materiale.sottotipo,
        note: materiale.note,
        registrato_da: utente ? `${utente.nome} ${utente.cognome}` : 'Sconosciuto',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Materiale arrivato', {
      materialeId: id,
      ordineId: materiale.ordine_id,
      tipo: materiale.tipo_materiale,
      userId: req.user!.userId,
    });

    return success(res, aggiornato, 200, 'Materiale registrato come arrivato');
  }),
);

export default router;
