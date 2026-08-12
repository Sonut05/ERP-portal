import { Router } from 'express';
import { getAll, getById, create, update, addNote } from './controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema, addNoteSchema } from './schema';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// GET /api/customers
router.get('/', authorizeRoles('Admin', 'Sales', 'Accounts'), getAll);

// GET /api/customers/:id
router.get('/:id', authorizeRoles('Admin', 'Sales', 'Accounts'), getById);

// POST /api/customers
router.post('/', authorizeRoles('Admin', 'Sales'), validate(createCustomerSchema), create);

// PUT /api/customers/:id
router.put('/:id', authorizeRoles('Admin', 'Sales'), validate(updateCustomerSchema), update);

// POST /api/customers/:id/notes
router.post('/:id/notes', authorizeRoles('Admin', 'Sales'), validate(addNoteSchema), addNote);

export default router;
