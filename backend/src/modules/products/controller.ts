import { Request, Response } from 'express';
import * as productService from './service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const lowStock = req.query.lowStock === 'true';

    const { products, total } = await productService.getAllProducts(page, limit, search, category, lowStock);
    sendPaginated(res, products, total, page, limit, 'Products retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);
    sendSuccess(res, product, 'Product retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.updateProduct(id, req.body);
    sendSuccess(res, product, 'Product updated successfully');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getStockMovements(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { movements, total } = await productService.getProductStockMovements(productId, page, limit);
    sendPaginated(res, movements, total, page, limit, 'Stock movements retrieved');
  } catch (error: any) {
    sendError(res, error.message, error.statusCode || 500);
  }
}
