import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50),
  category: z.string().max(100).optional(),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  current_stock: z.number().int().min(0).default(0),
  min_stock_alert: z.number().int().min(0).default(0),
  location: z.string().max(100).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().min(1).max(50).optional(),
  category: z.string().max(100).optional(),
  unit_price: z.number().min(0).optional(),
  min_stock_alert: z.number().int().min(0).optional(),
  location: z.string().max(100).optional(),
});
