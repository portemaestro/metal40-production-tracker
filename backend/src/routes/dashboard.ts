import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middleware/auth';
import { validateQuery } from '../utils/validation';
import { success } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

// ── Schemi di validazione ──

const dashboardStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('month'),
});

// ── Helper: calcola data inizio periodo ──

function getPeriodStart(period: 'day' | 'week' | 'month'): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
  }
}

// ── GET /api/dashboard/stats ──
// KPI aggregati per dashboard ufficio
router.get(
  '/stats',
  authenticate,
  requireRole('ufficio'),
  validateQuery(dashboardStatsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query as unknown as { period: 'day' | 'week' | 'month' };
    const periodStart = getPeriodStart(period);
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    // Esegui tutte le query in parallelo
    const [
      ordiniPerStato,
      urgenti,
      problemiAperti,
      problemiPerGravita,
      materialiStats,
      ordiniInRitardo,
      tempoMedioRisoluzione,
      tempoMedioProduzione,
      ftInAttesa,
    ] = await Promise.all([
      // Conteggio ordini per stato
      prisma.ordine.groupBy({
        by: ['stato'],
        _count: { id: true },
      }),

      // Ordini urgenti attivi
      prisma.ordine.count({
        where: {
          urgente: true,
          stato: { in: ['in_produzione', 'bloccato'] },
        },
      }),

      // Problemi aperti totali
      prisma.problema.count({
        where: { risolto: false },
      }),

      // Problemi aperti per gravità
      prisma.problema.groupBy({
        by: ['gravita'],
        where: { risolto: false },
        _count: { id: true },
      }),

      // Statistiche materiali (ordini attivi)
      Promise.all([
        // Da ordinare
        prisma.materiale.count({
          where: {
            necessario: true,
            ordine_effettuato: false,
            arrivato: false,
            ordine: { stato: { in: ['in_produzione', 'bloccato'] } },
          },
        }),
        // Ordinati in attesa
        prisma.materiale.count({
          where: {
            ordine_effettuato: true,
            arrivato: false,
            ordine: { stato: { in: ['in_produzione', 'bloccato'] } },
          },
        }),
        // Arrivati (nel periodo)
        prisma.materiale.count({
          where: {
            arrivato: true,
            data_arrivo_effettivo: { gte: periodStart },
          },
        }),
      ]),

      // Ordini in ritardo (data_tassativa passata e ancora attivi)
      prisma.ordine.count({
        where: {
          data_tassativa: { lt: oggi },
          stato: { in: ['in_produzione', 'bloccato'] },
        },
      }),

      // Tempo medio risoluzione problemi (ore) nel periodo
      prisma.problema.findMany({
        where: {
          risolto: true,
          data_risoluzione: { gte: periodStart },
        },
        select: {
          data_segnalazione: true,
          data_risoluzione: true,
        },
      }),

      // Tempo medio produzione (giorni) per ordini completati nel periodo
      prisma.ordine.findMany({
        where: {
          stato: 'spedito',
          updated_at: { gte: periodStart },
        },
        select: {
          created_at: true,
          updated_at: true,
        },
      }),

      // Falsetelaio anticipati in attesa (non ancora consegnati)
      prisma.ordine.count({
        where: {
          consegna_anticipata_ft: true,
          ft_consegnato: false,
          stato: { in: ['in_produzione', 'bloccato'] },
        },
      }),
    ]);

    // Calcola conteggi per stato
    const statiMap: Record<string, number> = {
      in_produzione: 0,
      bloccato: 0,
      pronto_spedizione: 0,
      spedito: 0,
    };
    for (const row of ordiniPerStato) {
      statiMap[row.stato] = row._count.id;
    }

    // Calcola problemi per gravità
    const gravitaMap: Record<string, number> = {
      bassa: 0,
      media: 0,
      alta_bloccante: 0,
    };
    for (const row of problemiPerGravita) {
      gravitaMap[row.gravita] = row._count.id;
    }

    // Materiali stats
    const [daOrdinare, ordinatiInAttesa, arrivati] = materialiStats;

    // Tempo medio risoluzione problemi (ore)
    let tempoMedioRisoluzioneOre: number | null = null;
    if (tempoMedioRisoluzione.length > 0) {
      const totaleOre = tempoMedioRisoluzione.reduce((acc, p) => {
        const ore =
          (p.data_risoluzione!.getTime() - p.data_segnalazione.getTime()) / (1000 * 60 * 60);
        return acc + ore;
      }, 0);
      tempoMedioRisoluzioneOre = parseFloat(
        (totaleOre / tempoMedioRisoluzione.length).toFixed(2),
      );
    }

    // Tempo medio produzione (giorni)
    let tempoMedioProduzioneGiorni: number | null = null;
    if (tempoMedioProduzione.length > 0) {
      const totaleGiorni = tempoMedioProduzione.reduce((acc, o) => {
        const giorni =
          (o.updated_at.getTime() - o.created_at.getTime()) / (1000 * 60 * 60 * 24);
        return acc + giorni;
      }, 0);
      tempoMedioProduzioneGiorni = parseFloat(
        (totaleGiorni / tempoMedioProduzione.length).toFixed(1),
      );
    }

    const data = {
      kpi: {
        in_produzione: statiMap.in_produzione + statiMap.bloccato,
        urgenti,
        problemi_aperti: problemiAperti,
        pronte_spedizione: statiMap.pronto_spedizione,
        ft_in_attesa: ftInAttesa,
      },
      dettagli: {
        ordini_stato: statiMap,
        problemi_per_gravita: gravitaMap,
        materiali: {
          da_ordinare: daOrdinare,
          ordinati_in_attesa: ordinatiInAttesa,
          arrivati,
        },
        tempi: {
          tempo_medio_produzione_giorni: tempoMedioProduzioneGiorni,
          ordini_in_ritardo: ordiniInRitardo,
          tempo_medio_risoluzione_problemi_ore: tempoMedioRisoluzioneOre,
        },
      },
      timestamp: new Date().toISOString(),
    };

    logger.info('Dashboard stats consultata', {
      userId: req.user!.userId,
      period,
    });

    return success(res, data);
  }),
);

// ── GET /api/dashboard/alert ──
// Alert giornalieri per popup login ufficio
router.get(
  '/alert',
  authenticate,
  requireRole('ufficio'),
  asyncHandler(async (req: Request, res: Response) => {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 2); // Fine di domani (inizio dopodomani)

    // Esegui tutte le query in parallelo
    const [materialiDaOrdinareRaw, problemiApertiRaw, materialiInArrivoRaw, ftInAttesaRaw] = await Promise.all([
      // Materiali da ordinare (necessari, non ordinati, ordini attivi)
      prisma.materiale.findMany({
        where: {
          necessario: true,
          ordine_effettuato: false,
          arrivato: false,
          ordine: { stato: { in: ['in_produzione', 'bloccato'] } },
        },
        include: {
          ordine: {
            select: {
              id: true,
              numero_conferma: true,
              cliente: true,
              riferimento: true,
            },
          },
        },
        orderBy: { ordine: { created_at: 'desc' } },
      }),

      // Problemi aperti (non risolti)
      prisma.problema.findMany({
        where: { risolto: false },
        include: {
          ordine: {
            select: {
              id: true,
              numero_conferma: true,
              cliente: true,
            },
          },
          user_segnalatore: {
            select: { nome: true, cognome: true },
          },
        },
        orderBy: [
          { gravita: 'desc' },
          { data_segnalazione: 'desc' },
        ],
      }),

      // Materiali in arrivo oggi/domani
      prisma.materiale.findMany({
        where: {
          ordine_effettuato: true,
          arrivato: false,
          data_consegna_prevista: { lte: domani },
          ordine: { stato: { in: ['in_produzione', 'bloccato'] } },
        },
        include: {
          ordine: {
            select: {
              id: true,
              numero_conferma: true,
              cliente: true,
            },
          },
        },
        orderBy: { data_consegna_prevista: 'asc' },
      }),

      // Falsotelaio anticipati in attesa
      prisma.ordine.findMany({
        where: {
          consegna_anticipata_ft: true,
          ft_consegnato: false,
          stato: { in: ['in_produzione', 'bloccato'] },
        },
        include: {
          user_ft_preparato: {
            select: { nome: true, cognome: true },
          },
        },
        orderBy: { data_consegna_ft: 'asc' },
      }),
    ]);

    // Raggruppa materiali da ordinare per ordine
    const materialiPerOrdine = new Map<
      number,
      {
        ordine_id: number;
        numero_conferma: string;
        cliente: string;
        riferimento: string | null;
        materiali: Array<{
          materiale_id: number;
          tipo_materiale: string;
          sottotipo: string | null;
          necessario: boolean;
          ordine_effettuato: boolean;
          arrivato: boolean;
        }>;
      }
    >();

    for (const m of materialiDaOrdinareRaw) {
      if (!materialiPerOrdine.has(m.ordine_id)) {
        materialiPerOrdine.set(m.ordine_id, {
          ordine_id: m.ordine.id,
          numero_conferma: m.ordine.numero_conferma,
          cliente: m.ordine.cliente,
          riferimento: m.ordine.riferimento,
          materiali: [],
        });
      }
      materialiPerOrdine.get(m.ordine_id)!.materiali.push({
        materiale_id: m.id,
        tipo_materiale: m.tipo_materiale,
        sottotipo: m.sottotipo,
        necessario: m.necessario,
        ordine_effettuato: m.ordine_effettuato,
        arrivato: m.arrivato,
      });
    }

    const materialiDaOrdinare = Array.from(materialiPerOrdine.values());

    // Formatta problemi aperti con ore_aperto
    const adesso = new Date();
    const problemiAperti = problemiApertiRaw.map((p) => ({
      problema_id: p.id,
      ordine_id: p.ordine_id,
      numero_conferma: p.ordine.numero_conferma,
      cliente: p.ordine.cliente,
      fase: p.fase,
      gravita: p.gravita,
      tipo_problema: p.tipo_problema,
      descrizione: p.descrizione,
      segnalato_da_nome: `${p.user_segnalatore.nome} ${p.user_segnalatore.cognome}`,
      data_segnalazione: p.data_segnalazione.toISOString(),
      ore_aperto: parseFloat(
        ((adesso.getTime() - p.data_segnalazione.getTime()) / (1000 * 60 * 60)).toFixed(2),
      ),
    }));

    // Formatta materiali in arrivo con giorni_mancanti
    const oggiDate = new Date();
    oggiDate.setHours(0, 0, 0, 0);
    const materialiInArrivo = materialiInArrivoRaw.map((m) => {
      const consegna = new Date(m.data_consegna_prevista!);
      consegna.setHours(0, 0, 0, 0);
      const giorniMancanti = Math.ceil(
        (consegna.getTime() - oggiDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        ordine_id: m.ordine.id,
        numero_conferma: m.ordine.numero_conferma,
        cliente: m.ordine.cliente,
        materiale_id: m.id,
        tipo_materiale: m.tipo_materiale,
        sottotipo: m.sottotipo,
        data_consegna_prevista: m.data_consegna_prevista!.toISOString().split('T')[0],
        giorni_mancanti: giorniMancanti,
        arrivato: m.arrivato,
      };
    });

    // Formatta FT in attesa
    const oggiDateFt = new Date();
    oggiDateFt.setHours(0, 0, 0, 0);
    const ftInAttesa = ftInAttesaRaw.map((o) => {
      const dataConsegna = o.data_consegna_ft ? new Date(o.data_consegna_ft) : null;
      let giorniMancanti: number | null = null;
      if (dataConsegna) {
        dataConsegna.setHours(0, 0, 0, 0);
        giorniMancanti = Math.ceil(
          (dataConsegna.getTime() - oggiDateFt.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
      return {
        ordine_id: o.id,
        numero_conferma: o.numero_conferma,
        cliente: o.cliente,
        tipo_consegna_ft: o.tipo_consegna_ft,
        data_consegna_ft: o.data_consegna_ft ? o.data_consegna_ft.toISOString().split('T')[0] : null,
        giorni_mancanti: giorniMancanti,
        ft_preparato: o.ft_preparato,
        preparato_da: o.user_ft_preparato
          ? `${o.user_ft_preparato.nome} ${o.user_ft_preparato.cognome}`
          : null,
        data_preparazione_ft: o.data_preparazione_ft?.toISOString() ?? null,
      };
    });

    const ha_alert =
      materialiDaOrdinare.length > 0 ||
      problemiAperti.length > 0 ||
      materialiInArrivo.length > 0 ||
      ftInAttesa.length > 0;

    const data = {
      materiali_da_ordinare: materialiDaOrdinare,
      problemi_aperti: problemiAperti,
      materiali_in_arrivo: materialiInArrivo,
      ft_in_attesa: ftInAttesa,
      ha_alert,
      timestamp: new Date().toISOString(),
    };

    logger.info('Dashboard alert consultata', {
      userId: req.user!.userId,
      ha_alert,
      materiali_da_ordinare: materialiDaOrdinare.length,
      problemi_aperti: problemiAperti.length,
      materiali_in_arrivo: materialiInArrivo.length,
      ft_in_attesa: ftInAttesa.length,
    });

    return success(res, data);
  }),
);

export default router;
