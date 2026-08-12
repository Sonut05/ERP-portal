import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global error handler middleware — catches all unhandled errors
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('❌ Unhandled Error:', err.message);
  console.error(err.stack);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
}
