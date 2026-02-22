import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // ── Middleware di sicurezza ──
  app.use(helmet());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    }),
  );

  // ── Logging HTTP ──
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // ── Rate limiting generale ──
  if (process.env.NODE_ENV !== 'test') {
    const generalLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { message: 'Troppe richieste, riprova tra poco', code: 'RATE_LIMIT', statusCode: 429 },
      },
    });
    app.use(generalLimiter);
  }

  // ── Body parsing ──
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ──
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // ── Route API ──
  app.use('/api', routes);

  // ── 404 per route non trovate ──
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { message: 'Endpoint non trovato', code: 'NOT_FOUND', statusCode: 404 },
    });
  });

  // ── Error handler globale (DEVE essere ultimo) ──
  app.use(errorHandler);

  return app;
}
