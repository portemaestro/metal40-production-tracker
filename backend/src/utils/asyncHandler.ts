import { Request, Response, NextFunction } from 'express';

/**
 * Wrappa un handler async in modo che gli errori vengano passati
 * automaticamente al middleware di error handling di Express.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
