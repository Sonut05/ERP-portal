import { Request, Response } from 'express';
import * as stockService from './service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function createMovement(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const result = await stockService.createStockMovement({
      ...req.body,
      created_by: req.user.userId,
    });
    sendSuccess(res, result, 'Stock movement recorded', 201);
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { movements, total } = await stockService.getAllStockMovements(page, limit);
    sendPaginated(res, movements, total, page, limit, 'Stock movements retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}
