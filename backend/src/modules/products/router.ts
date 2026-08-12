import { Router } from 'express';
import { getAll, getById, create, update, getStockMovements } from './controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './schema';

const router = Router();

router.use(authenticate);

// GET /api/products
router.get('/', getAll);

// GET /api/products/:id
router.get('/:id', getById);

// POST /api/products
router.post('/', authorizeRoles('Admin', 'Warehouse'), validate(createProductSchema), create);

// PUT /api/products/:id
router.put('/:id', authorizeRoles('Admin', 'Warehouse'), validate(updateProductSchema), update);

// GET /api/products/:id/stock-movements
router.get('/:id/stock-movements', authorizeRoles('Admin', 'Warehouse'), getStockMovements);

export default router;
