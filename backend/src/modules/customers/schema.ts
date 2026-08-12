import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(150),
  mobile: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  business_name: z.string().max(200).optional(),
  gst_no: z.string().max(20).optional(),
  type: z.enum(['Retail', 'Wholesale', 'Distributor'], {
    errorMap: () => ({ message: 'Type must be Retail, Wholesale, or Distributor' }),
  }),
  address: z.string().optional(),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required'),
});
