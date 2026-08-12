import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRouter from './modules/auth/router';
import customersRouter from './modules/customers/router';
import productsRouter from './modules/products/router';
import stockRouter from './modules/stock/router';
import ordersRouter from './modules/orders/router';

// Dashboard stats
import { authenticate } from './middleware/auth';
import pool, { initDatabase } from './config/db';
import { sendSuccess, sendError } from './utils/response';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path normalization for Netlify Serverless Functions
app.use((req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    const [customers, products, orders, lowStock, recentOrders] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Active\') as active, COUNT(*) FILTER (WHERE status = \'Lead\') as leads FROM customers'),
      pool.query('SELECT COUNT(*) as total FROM products'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Draft\') as drafts, COUNT(*) FILTER (WHERE status = \'Confirmed\') as confirmed FROM orders'),
      pool.query('SELECT COUNT(*) as total FROM products WHERE current_stock <= min_stock_alert'),
      pool.query(`SELECT o.*, cu.name as customer_name FROM orders o LEFT JOIN customers cu ON o.customer_id = cu.id ORDER BY o.created_at DESC LIMIT 5`),
    ]);

    sendSuccess(res, {
      customers: {
        total: parseInt(customers.rows[0]?.total || '0'),
        active: parseInt(customers.rows[0]?.active || '0'),
        leads: parseInt(customers.rows[0]?.leads || '0'),
      },
      products: {
        total: parseInt(products.rows[0]?.total || '0'),
        lowStock: parseInt(lowStock.rows[0]?.total || '0'),
      },
      orders: {
        total: parseInt(orders.rows[0]?.total || '0'),
        drafts: parseInt(orders.rows[0]?.drafts || '0'),
        confirmed: parseInt(orders.rows[0]?.confirmed || '0'),
      },
      recentOrders: recentOrders.rows,
    }, 'Dashboard stats retrieved');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// API Routes (supports both /api/route and /route for Netlify serverless functions)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/customers', customersRouter);
app.use('/customers', customersRouter);

app.use('/api/products', productsRouter);
app.use('/products', productsRouter);

app.use('/api/stock', stockRouter);
app.use('/stock', stockRouter);

app.use('/api/orders', ordersRouter);
app.use('/orders', ordersRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Initialize DB and Start server (only in non-serverless environment)
if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT) {
  initDatabase().then(() => {
    app.listen(env.PORT, () => {
      console.log(`\n🚀 Mini ERP+CRM Backend running on port ${env.PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 http://localhost:${env.PORT}/api/health\n`);
    });
  }).catch((err) => {
    console.error('Failed to initialize database:', err);
  });
}

export default app;
