import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../utils/validation';
import { success, paginated } from '../utils/response';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { getPaginationParams, createPaginationMeta, richiedeVerniciatura } from '../utils/db';
import { TIPI_TELAIO, ORDINE_STATI } from '../constants';
import logger from '../utils/logger';

const router = Router();

// ── Schemi di validazione ──

const createOrdineSchema = z
  .object({
    numero_conferma: z.string().min(1, 'Numero conferma obbligatorio').max(20),
    cliente: z.string().min(1, 'Cliente obbligatorio').max(255),
    riferimento: z.string().max(255).optional().nullable(),
    data_ordine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD'),
    quantita_porte: z.number().int().positive('Quantità porte deve essere positiva').default(1),
    tipo_telaio: z.enum(TIPI_TELAIO),
    colore_telaio_interno: z.string().max(50).optional().nullable(),
    colore_telaio_esterno: z.string().max(50).optional().nullable(),
    verniciatura_necessaria: z.boolean().optional(),
    urgente: z.boolean().default(false),
    data_tassativa: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD')
      .optional()
      .nullable(),
    pdf_path: z.string().optional().nullable(),
    note_generali: z.string().optional().nullable(),
    materiali_pdf: z.array(z.object({
      tipo_materiale: z.string(),
      sottotipo: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
    })).optional(),
  })
  .refine((data) => !data.urgente || data.data_tassativa, {
    message: 'Data tassativa obbligatoria per ordini urgenti',
    path: ['data_tassativa'],
  });

const updateOrdineSchema = z.object({
  cliente: z.string().min(1).max(255).optional(),
  riferimento: z.string().max(255).optional().nullable(),
  data_ordine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD').optional(),
  quantita_porte: z.number().int().positive().optional(),
  tipo_telaio: z.enum(TIPI_TELAIO).optional(),
  colore_telaio_interno: z.string().max(50).optional().nullable(),
  colore_telaio_esterno: z.string().max(50).optional().nullable(),
  verniciatura_necessaria: z.boolean().optional(),
  urgente: z.boolean().optional(),
  data_tassativa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD')
    .optional()
    .nullable(),
  note_generali: z.string().optional().nullable(),
  stato: z.enum(ORDINE_STATI).optional(),
});

const listOrdiniQuerySchema = z.object({
  stato: z.enum(ORDINE_STATI).optional(),
  urgente: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Helper: genera fasi di produzione in base al tipo telaio ──

function generaFasiProduzione(tipoTelaio: string, verniciaturaNecessaria: boolean): string[] {
  const fasi: string[] = [];

  // Fasi telaio/falsetelaio (variano per tipo)
  switch (tipoTelaio) {
    case 'standard_falsotelaio':
      // Tracciato falsetelaio (parallelo al telaio)
      fasi.push('Punzonatura Dalcos Falsetelaio');
      fasi.push('Piegatura Falsetelaio');
      fasi.push('Assemblaggio Falsetelaio');
      // Tracciato telaio
      fasi.push('Punzonatura Dalcos Telaio');
      fasi.push('Piegatura Telaio');
      fasi.push('Assemblaggio Telaio');
      break;

    case 'ristrutturazione_l':
    case 'ristrutturazione_z':
      // Barre gia' piegate, solo taglio e assemblaggio
      fasi.push('Taglio Barre');
      fasi.push('Assemblaggio Telaio');
      break;

    case 'falsotelaio_non_nostro':
      // Solo telaio (falsetelaio fornito dal cliente)
      fasi.push('Punzonatura Dalcos Telaio');
      fasi.push('Piegatura Telaio');
      fasi.push('Assemblaggio Telaio');
      break;
  }

  // Verniciatura (solo se colore fuori standard)
  if (verniciaturaNecessaria) {
    fasi.push('Verniciatura Esterna');
  }

  // Scocca (comune a tutti i tipi)
  fasi.push('Punzonatura Euromac');
  fasi.push('Piegatura Accessori');
  fasi.push('Saldatura/Assemblaggio');
  fasi.push('Rivestimento Interno');
  fasi.push('Rivestimento Esterno');

  // Assemblaggio finale
  fasi.push('Prova in Telaio e Imballaggio');
  fasi.push('Riconsegna Ufficio');

  return fasi;
}

// ── GET /api/ordini ──
// Lista ordini con filtri, paginazione e ordinamento
router.get(
  '/',
  authenticate,
  validateQuery(listOrdiniQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(req);
    const { stato, urgente, search } = req.query as {
      stato?: string;
      urgente?: string;
      search?: string;
    };

    // Costruzione clausola WHERE
    const where: Record<string, unknown> = {};
    if (stato) where.stato = stato;
    if (urgente !== undefined) where.urgente = urgente === 'true';
    if (search) {
      where.OR = [
        { numero_conferma: { contains: search } },
        { cliente: { contains: search } },
      ];
    }

    const [ordini, total] = await Promise.all([
      prisma.ordine.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ urgente: 'desc' }, { created_at: 'desc' }],
        include: {
          _count: {
            select: {
              fasi: true,
              problemi: true,
              materiali: true,
            },
          },
        },
      }),
      prisma.ordine.count({ where }),
    ]);

    const pagination = createPaginationMeta(page, limit, total);
    return paginated(res, ordini, pagination);
  }),
);

// ── GET /api/ordini/:id ──
// Dettaglio ordine completo con tutte le relazioni
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const ordine = await prisma.ordine.findUnique({
      where: { id },
      include: {
        materiali: {
          orderBy: { id: 'asc' },
        },
        fasi: {
          include: {
            user: {
              select: { id: true, nome: true, cognome: true },
            },
          },
          orderBy: { id: 'asc' },
        },
        problemi: {
          include: {
            user_segnalatore: {
              select: { id: true, nome: true, cognome: true },
            },
            user_risolutore: {
              select: { id: true, nome: true, cognome: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        note: {
          include: {
            user: {
              select: { id: true, nome: true, cognome: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!ordine) throw new NotFoundError('Ordine non trovato');

    return success(res, ordine);
  }),
);

// ── POST /api/ordini ──
// Crea nuovo ordine con generazione automatica fasi di produzione
router.post(
  '/',
  authenticate,
  requireRole('ufficio'),
  validateBody(createOrdineSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    // Verifica unicita' numero conferma
    const esistente = await prisma.ordine.findUnique({
      where: { numero_conferma: data.numero_conferma },
    });
    if (esistente) {
      throw new ConflictError(`Numero conferma "${data.numero_conferma}" già esistente`);
    }

    // Auto-detect verniciatura se non specificata esplicitamente
    const verniciaturaNecessaria =
      data.verniciatura_necessaria ??
      richiedeVerniciatura(data.colore_telaio_esterno ?? null, data.colore_telaio_interno ?? null);

    // Genera fasi di produzione
    const nomiFasi = generaFasiProduzione(data.tipo_telaio, verniciaturaNecessaria);

    // Crea ordine + fasi in transazione
    const ordine = await prisma.$transaction(async (tx) => {
      const nuovoOrdine = await tx.ordine.create({
        data: {
          numero_conferma: data.numero_conferma,
          cliente: data.cliente,
          riferimento: data.riferimento ?? null,
          data_ordine: new Date(data.data_ordine),
          quantita_porte: data.quantita_porte,
          tipo_telaio: data.tipo_telaio,
          colore_telaio_interno: data.colore_telaio_interno ?? null,
          colore_telaio_esterno: data.colore_telaio_esterno ?? null,
          verniciatura_necessaria: verniciaturaNecessaria,
          urgente: data.urgente,
          data_tassativa: data.data_tassativa ? new Date(data.data_tassativa) : null,
          pdf_path: data.pdf_path ?? null,
          note_generali: data.note_generali ?? null,
        },
      });

      // Crea fasi di produzione
      await tx.faseProduzione.createMany({
        data: nomiFasi.map((nome) => ({
          ordine_id: nuovoOrdine.id,
          nome_fase: nome,
          stato: 'da_fare',
        })),
      });

      // Crea materiali da PDF (se presenti)
      if (data.materiali_pdf && data.materiali_pdf.length > 0) {
        // Escludi laminato (a magazzino, non tracciato)
        const materialiDaCreare = data.materiali_pdf.filter(
          (m: { sottotipo?: string | null }) => m.sottotipo?.toLowerCase() !== 'laminato'
        );
        if (materialiDaCreare.length > 0) {
          await tx.materiale.createMany({
            data: materialiDaCreare.map((m: { tipo_materiale: string; sottotipo?: string | null; note?: string | null }) => ({
              ordine_id: nuovoOrdine.id,
              tipo_materiale: m.tipo_materiale,
              sottotipo: m.sottotipo ?? null,
              note: m.note ?? null,
              necessario: true,
            })),
          });
        }
      }

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: nuovoOrdine.id,
          azione: 'ordine_creato',
          dettagli: {
            numero_conferma: nuovoOrdine.numero_conferma,
            cliente: nuovoOrdine.cliente,
          },
        },
      });

      // Restituisci ordine con relazioni
      return tx.ordine.findUnique({
        where: { id: nuovoOrdine.id },
        include: {
          fasi: { orderBy: { id: 'asc' } },
          materiali: true,
        },
      });
    });

    logger.info('Ordine creato', {
      ordineId: ordine!.id,
      numero_conferma: ordine!.numero_conferma,
      userId: req.user!.userId,
    });

    return success(res, ordine, 201, 'Ordine creato con successo');
  }),
);

// ── PUT /api/ordini/:id ──
// Aggiorna ordine esistente (solo ufficio)
router.put(
  '/:id',
  authenticate,
  requireRole('ufficio'),
  validateBody(updateOrdineSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const data = req.body;

    // Recupera ordine esistente con fasi
    const ordineEsistente = await prisma.ordine.findUnique({
      where: { id },
      include: { fasi: true },
    });

    if (!ordineEsistente) throw new NotFoundError('Ordine non trovato');

    // Regola: non cambiare tipo_telaio se fasi gia' completate
    if (data.tipo_telaio && data.tipo_telaio !== ordineEsistente.tipo_telaio) {
      const haFasiCompletate = ordineEsistente.fasi.some((f) => f.stato === 'completata');
      if (haFasiCompletate) {
        throw new ValidationError(
          'Impossibile cambiare tipo telaio: alcune fasi sono già completate',
        );
      }
    }

    // Regola: urgente richiede data_tassativa
    const urgente = data.urgente ?? ordineEsistente.urgente;
    const dataTassativa = data.data_tassativa !== undefined
      ? data.data_tassativa
      : ordineEsistente.data_tassativa;
    if (urgente && !dataTassativa) {
      throw new ValidationError('Data tassativa obbligatoria per ordini urgenti');
    }

    // Auto-ricalcola verniciatura se i colori cambiano
    let verniciaturaNecessaria = data.verniciatura_necessaria;
    if (
      verniciaturaNecessaria === undefined &&
      (data.colore_telaio_esterno !== undefined || data.colore_telaio_interno !== undefined)
    ) {
      const coloreEsterno =
        data.colore_telaio_esterno !== undefined
          ? data.colore_telaio_esterno
          : ordineEsistente.colore_telaio_esterno;
      const coloreInterno =
        data.colore_telaio_interno !== undefined
          ? data.colore_telaio_interno
          : ordineEsistente.colore_telaio_interno;
      verniciaturaNecessaria = richiedeVerniciatura(coloreEsterno, coloreInterno);
    }

    // Costruisci oggetto update (solo campi forniti)
    const updateData: Record<string, unknown> = {};
    if (data.cliente !== undefined) updateData.cliente = data.cliente;
    if (data.riferimento !== undefined) updateData.riferimento = data.riferimento;
    if (data.data_ordine !== undefined) updateData.data_ordine = new Date(data.data_ordine);
    if (data.quantita_porte !== undefined) updateData.quantita_porte = data.quantita_porte;
    if (data.colore_telaio_interno !== undefined)
      updateData.colore_telaio_interno = data.colore_telaio_interno;
    if (data.colore_telaio_esterno !== undefined)
      updateData.colore_telaio_esterno = data.colore_telaio_esterno;
    if (verniciaturaNecessaria !== undefined)
      updateData.verniciatura_necessaria = verniciaturaNecessaria;
    if (data.urgente !== undefined) updateData.urgente = data.urgente;
    if (data.data_tassativa !== undefined)
      updateData.data_tassativa = data.data_tassativa ? new Date(data.data_tassativa) : null;
    if (data.note_generali !== undefined) updateData.note_generali = data.note_generali;
    if (data.stato !== undefined) updateData.stato = data.stato;

    const ordine = await prisma.$transaction(async (tx) => {
      // Se tipo_telaio cambia, rigenera le fasi
      if (data.tipo_telaio && data.tipo_telaio !== ordineEsistente.tipo_telaio) {
        updateData.tipo_telaio = data.tipo_telaio;

        await tx.faseProduzione.deleteMany({ where: { ordine_id: id } });

        const nuovaVerniciatura =
          verniciaturaNecessaria ?? ordineEsistente.verniciatura_necessaria;
        const nomiFasi = generaFasiProduzione(data.tipo_telaio, nuovaVerniciatura);

        await tx.faseProduzione.createMany({
          data: nomiFasi.map((nome) => ({
            ordine_id: id,
            nome_fase: nome,
            stato: 'da_fare',
          })),
        });
      }

      const aggiornato = await tx.ordine.update({
        where: { id },
        data: updateData,
        include: {
          materiali: true,
          fasi: { orderBy: { id: 'asc' } },
        },
      });

      // Audit log
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          ordine_id: id,
          azione: 'ordine_modificato',
          dettagli: { campi_modificati: Object.keys(updateData) },
        },
      });

      return aggiornato;
    });

    logger.info('Ordine modificato', {
      ordineId: id,
      campi: Object.keys(updateData),
      userId: req.user!.userId,
    });

    return success(res, ordine, 200, 'Ordine aggiornato con successo');
  }),
);

// ── DELETE /api/ordini/:id ──
// Elimina ordine (solo ufficio, non spediti/pronti)
router.delete(
  '/:id',
  authenticate,
  requireRole('ufficio'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('ID non valido');

    const ordine = await prisma.ordine.findUnique({ where: { id } });
    if (!ordine) throw new NotFoundError('Ordine non trovato');

    await prisma.$transaction(async (tx) => {
      // Log SENZA ordine_id (altrimenti cascade delete lo rimuoverebbe)
      await tx.logAttivita.create({
        data: {
          user_id: req.user!.userId,
          azione: 'ordine_eliminato',
          dettagli: {
            numero_conferma: ordine.numero_conferma,
            cliente: ordine.cliente,
          },
        },
      });

      // Le relazioni (materiali, fasi, problemi, note, log) vengono
      // eliminate in cascata grazie a onDelete: Cascade nello schema
      await tx.ordine.delete({ where: { id } });
    });

    logger.info('Ordine eliminato', {
      ordineId: id,
      numero_conferma: ordine.numero_conferma,
      userId: req.user!.userId,
    });

    return success(res, null, 200, 'Ordine eliminato con successo');
  }),
);

export default router;
