import { Router } from 'express';
import { createMovement, getAll } from './controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { stockMovementSchema } from './schema';

const router = Router();

router.use(authenticate);

// GET /api/stock/movements
router.get('/movements', authorizeRoles('Admin', 'Warehouse'), getAll);

// POST /api/stock/movement
router.post('/movement', authorizeRoles('Admin', 'Warehouse'), validate(stockMovementSchema), createMovement);

export default router;
