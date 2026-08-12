import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Middleware factory to restrict routes to specific roles
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
      return;
    }

    next();
  };
}
