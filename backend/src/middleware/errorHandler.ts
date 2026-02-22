import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware globale di gestione errori.
 * Deve essere registrato per ultimo nella catena middleware di Express.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Errori operativi (AppError) - noti e gestiti
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', err, { path: req.path, method: req.method });
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
      },
    });
  }

  // Errori Prisma noti
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Dati non validi per il database',
        code: 'PRISMA_VALIDATION',
        statusCode: 400,
      },
    });
  }

  // Errore JSON body parsing
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'JSON non valido nel body della richiesta',
        code: 'INVALID_JSON',
        statusCode: 400,
      },
    });
  }

  // Errore generico / imprevisto
  logger.error('Unhandled error', err, { path: req.path, method: req.method });

  return res.status(500).json({
    success: false,
    error: {
      message: 'Errore interno del server',
      code: 'SERVER_ERROR',
      statusCode: 500,
    },
  });
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  switch (err.code) {
    case 'P2002': {
      const fields = (err.meta?.target as string[])?.join(', ') || 'campo';
      return res.status(409).json({
        success: false,
        error: {
          message: `Valore duplicato per: ${fields}`,
          code: 'DUPLICATE_ENTRY',
          statusCode: 409,
        },
      });
    }
    case 'P2025':
      return res.status(404).json({
        success: false,
        error: {
          message: 'Record non trovato',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
    case 'P2003':
      return res.status(400).json({
        success: false,
        error: {
          message: 'Riferimento a record inesistente',
          code: 'FOREIGN_KEY_ERROR',
          statusCode: 400,
        },
      });
    default:
      logger.error('Prisma error', err, { code: err.code });
      return res.status(500).json({
        success: false,
        error: {
          message: 'Errore database',
          code: 'DATABASE_ERROR',
          statusCode: 500,
        },
      });
  }
}
