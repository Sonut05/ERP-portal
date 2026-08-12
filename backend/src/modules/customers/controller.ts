import { Request, Response } from 'express';
import * as customerService from './service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const { customers, total } = await customerService.getAllCustomers(page, limit, search, status, type);
    sendPaginated(res, customers, total, page, limit, 'Customers retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const customer = await customerService.getCustomerById(id);
    sendSuccess(res, customer, 'Customer retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const customer = await customerService.createCustomer(req.body);
    sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const customer = await customerService.updateCustomer(id, req.body);
    sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function addNote(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { note } = req.body;
    const customer = await customerService.addFollowUpNote(id, note);
    sendSuccess(res, customer, 'Follow-up note added');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}
