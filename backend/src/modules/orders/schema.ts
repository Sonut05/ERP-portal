import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  customer_id: z.number().int().positive('Customer ID is required'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Draft', 'Confirmed', 'Cancelled'], {
    errorMap: () => ({ message: 'Status must be Draft, Confirmed, or Cancelled' }),
  }),
});
