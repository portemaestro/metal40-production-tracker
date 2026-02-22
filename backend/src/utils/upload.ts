import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from './errors';

const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const FOTO_MAX_SIZE = 10 * 1024 * 1024; // 10 MB (prima della compressione)

/**
 * Multer per upload PDF (singolo file, max 10MB, solo application/pdf)
 */
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PDF_MAX_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo file PDF accettati'));
    }
  },
}).single('pdf');

/**
 * Multer per upload foto (singolo file, max 10MB, solo immagini)
 */
export const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FOTO_MAX_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo file immagine accettati'));
    }
  },
}).single('foto');
