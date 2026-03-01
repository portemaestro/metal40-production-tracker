import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';
import { AppError } from './errors';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `Estrai questi dati dal foglio produzione porta blindata.
Rispondi SOLO con JSON valido, senza markdown o altro testo.

Campi da estrarre:
- numero_conferma: string (numero conferma ordine)
- cliente: string (nome cliente)
- tipo_telaio: string (una di: "standard_falsotelaio", "ristrutturazione_l", "ristrutturazione_z", "falsotelaio_non_nostro")
- colore_telaio_esterno: string
- colore_telaio_interno: string
- pannello_esterno_tipo: string (es: "PVC", "Alluminio", "Okoume", "MDF", "Laminato")
- pannello_esterno_colore: string
- pannello_interno_tipo: string
- pannello_interno_colore: string
- mostrine: string (descrizione mostrine, o "" se assenti)
- kit_imbotte: string (descrizione kit imbotte, o "" se assente)
- vetro: string (descrizione vetro con misure, o "" se assente)
- maniglione: string (descrizione maniglione, o "" se assente)
- note: string (note aggiuntive trovate, o "")
- consegna_anticipata_ft: boolean (true se nel documento si menziona consegna anticipata del falsotelaio/controtelaio, consegna anticipata FT, spedizione anticipata falsotelaio, o simili)
- tipo_consegna_ft: string (se consegna anticipata: "assemblato" se consegna diretta/ritiro/assemblato, "kit_montaggio" se kit montaggio/spedizione, o "" se non specificato)
- data_consegna_ft: string (data consegna anticipata falsotelaio in formato YYYY-MM-DD se presente, o "")

Se un campo non è presente o leggibile, usa stringa vuota "" (o false per booleani).
Rispondi SOLO JSON valido.`;

export interface ExtractedOrderData {
  numero_conferma: string;
  cliente: string;
  tipo_telaio: string;
  colore_telaio_esterno: string;
  colore_telaio_interno: string;
  pannello_esterno_tipo: string;
  pannello_esterno_colore: string;
  pannello_interno_tipo: string;
  pannello_interno_colore: string;
  mostrine: string;
  kit_imbotte: string;
  vetro: string;
  maniglione: string;
  note: string;
  consegna_anticipata_ft: boolean;
  tipo_consegna_ft: string;
  data_consegna_ft: string;
}

/**
 * Invia un PDF a Claude per estrarre i dati dell'ordine.
 * Il PDF viene convertito in base64 e inviato come documento.
 */
export async function extractOrderFromPdf(pdfBuffer: Buffer): Promise<ExtractedOrderData> {
  const base64Pdf = pdfBuffer.toString('base64');

  logger.info('Invio PDF a Claude per estrazione dati', { size: pdfBuffer.length });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Pdf,
            },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new AppError('Claude non ha restituito testo', 500, 'AI_ERROR');
  }

  try {
    // Rimuovi eventuale wrapping markdown (```json ... ```)
    let jsonText = textBlock.text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText) as ExtractedOrderData;
    logger.info('Dati estratti da PDF con successo', { numero_conferma: parsed.numero_conferma });
    return parsed;
  } catch {
    logger.error('Errore parsing JSON risposta Claude', undefined, { raw: textBlock.text });
    throw new AppError('Impossibile interpretare la risposta AI', 500, 'AI_PARSE_ERROR');
  }
}

export default anthropic;
