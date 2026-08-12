import { Request, Response } from 'express';
import * as orderService from './service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const { orders, total } = await orderService.getAllOrders(page, limit, status, search);
    sendPaginated(res, orders, total, page, limit, 'Orders retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const order = await orderService.getOrderById(id);
    sendSuccess(res, order, 'Order retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const order = await orderService.createOrder({
      ...req.body,
      created_by: req.user.userId,
    });
    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }

    const id = parseInt(req.params.id);
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status, req.user.userId);
    sendSuccess(res, order, `Order status updated to ${status}`);
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}
