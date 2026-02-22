import { Router, Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadPdf, uploadFoto } from '../utils/upload';
import { uploadToR2 } from '../utils/r2';
import { extractOrderFromPdf } from '../utils/claude';
import { success } from '../utils/response';
import { ValidationError, AppError } from '../utils/errors';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

const router = Router();

// Wrapper per gestire errori Multer come AppError
function handleMulter(multerMiddleware: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File troppo grande (max 10MB)'));
        }
        if (err instanceof ValidationError) {
          return next(err);
        }
        return next(new AppError(err.message || 'Errore upload file', 400, 'UPLOAD_ERROR'));
      }
      next();
    });
  };
}

/**
 * POST /api/upload/pdf
 * Upload PDF foglio produzione + estrazione dati con Claude AI.
 * Solo ruolo "ufficio".
 */
router.post(
  '/pdf',
  authenticate,
  requireRole('ufficio'),
  handleMulter(uploadPdf),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('Nessun file PDF caricato');
    }

    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `pdfs/${timestamp}-${originalName}`;

    // Upload su R2
    const pdfUrl = await uploadToR2(key, req.file.buffer, 'application/pdf');

    // Estrazione dati con Claude AI
    let extractedData;
    try {
      extractedData = await extractOrderFromPdf(req.file.buffer);
    } catch (err) {
      logger.error('Errore estrazione AI, il PDF e\' stato caricato comunque', err);
      // Il PDF e' stato caricato su R2 anche se l'AI fallisce
      extractedData = null;
    }

    // Log attivita'
    await prisma.logAttivita.create({
      data: {
        azione: 'upload_pdf',
        dettagli: `PDF caricato: ${originalName}`,
        user_id: req.user!.userId,
      },
    });

    success(res, {
      pdf_url: pdfUrl,
      pdf_key: key,
      extracted_data: extractedData,
      ai_success: extractedData !== null,
    }, 201, 'PDF caricato con successo');
  }),
);

/**
 * POST /api/upload/foto
 * Upload foto (problemi, note). Compressa a max 1920px width, qualita' 85%.
 * Tutti gli utenti autenticati.
 */
router.post(
  '/foto',
  authenticate,
  handleMulter(uploadFoto),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('Nessun file immagine caricato');
    }

    // Comprimi con Sharp: max 1920px larghezza, qualita' 85%, formato JPEG
    const compressed = await sharp(req.file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const ordineId = req.body.ordine_id || 'general';
    const tipo = req.body.tipo || 'foto'; // "problema", "nota", "foto"
    const key = `foto/${ordineId}-${tipo}-${timestamp}.jpg`;

    // Upload su R2
    const fotoUrl = await uploadToR2(key, compressed, 'image/jpeg');

    // Log attivita'
    await prisma.logAttivita.create({
      data: {
        azione: 'upload_foto',
        dettagli: `Foto caricata: ${tipo} (${(compressed.length / 1024).toFixed(0)}KB)`,
        user_id: req.user!.userId,
      },
    });

    success(res, {
      foto_url: fotoUrl,
      foto_key: key,
      size_kb: Math.round(compressed.length / 1024),
    }, 201, 'Foto caricata con successo');
  }),
);

export default router;
