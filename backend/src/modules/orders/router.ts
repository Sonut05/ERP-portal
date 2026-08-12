import { Router } from 'express';
import { getAll, getById, create, updateStatus } from './controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from './schema';

const router = Router();

router.use(authenticate);

// GET /api/orders
router.get('/', authorizeRoles('Admin', 'Sales', 'Accounts'), getAll);

// GET /api/orders/:id
router.get('/:id', authorizeRoles('Admin', 'Sales', 'Accounts'), getById);

// POST /api/orders
router.post('/', authorizeRoles('Admin', 'Sales'), validate(createOrderSchema), create);

// PUT /api/orders/:id/status
router.put('/:id/status', authorizeRoles('Admin', 'Sales'), validate(updateOrderStatusSchema), updateStatus);

export default router;
