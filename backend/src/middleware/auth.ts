import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export interface JwtPayload {
  userId: number;
  email: string;
  ruolo: 'ufficio' | 'operatore';
}

// Estende Request per includere l'utente autenticato
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware obbligatorio: verifica il JWT Bearer token.
 * Blocca la richiesta con 401 se il token manca o non è valido.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AuthenticationError('Token mancante'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AuthenticationError('Token non valido o scaduto'));
  }
}

/**
 * Middleware di autorizzazione per ruolo.
 * Da usare DOPO authenticate.
 */
export function requireRole(...roles: Array<'ufficio' | 'operatore'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(req.user.ruolo)) {
      return next(new AuthorizationError('Ruolo non autorizzato per questa operazione'));
    }
    next();
  };
}

/**
 * Middleware opzionale: se c'è un token lo decodifica, altrimenti prosegue.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
  } catch {
    // Token non valido, ma opzionale: proseguiamo senza utente
  }

  next();
}
