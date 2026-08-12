import pool from '../../config/db';
import { generateOrderNumber } from '../../utils/orderNumber';

interface OrderItemInput {
  product_id: number;
  quantity: number;
}

interface CreateOrderData {
  customer_id: number;
  status: 'Draft' | 'Confirmed';
  items: OrderItemInput[];
  created_by: number;
}

export async function createOrder(data: CreateOrderData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify customer exists
    const customerResult = await client.query('SELECT id FROM customers WHERE id = $1', [data.customer_id]);
    if (customerResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Customer not found' };
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate total quantity
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

    // Validate all products and get snapshot data
    const itemsWithSnapshot: Array<{
      product_id: number;
      product_name_snapshot: string;
      product_price_snapshot: number;
      quantity: number;
    }> = [];

    for (const item of data.items) {
      const productResult = await client.query(
        'SELECT id, name, unit_price, current_stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw { statusCode: 404, message: `Product with ID ${item.product_id} not found` };
      }

      const product = productResult.rows[0];

      // If confirming, check stock availability
      if (data.status === 'Confirmed') {
        if (product.current_stock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`,
          };
        }
      }

      itemsWithSnapshot.push({
        product_id: item.product_id,
        product_name_snapshot: product.name,
        product_price_snapshot: product.unit_price,
        quantity: item.quantity,
      });
    }

    // If confirming, deduct stock
    if (data.status === 'Confirmed') {
      for (const item of data.items) {
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Order ${orderNumber} confirmed`, data.created_by]
        );
      }
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, status, total_quantity, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderNumber, data.customer_id, data.status, totalQuantity, data.created_by]
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of itemsWithSnapshot) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name_snapshot, product_price_snapshot, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.product_name_snapshot, item.product_price_snapshot, item.quantity]
      );
    }

    await client.query('COMMIT');

    // Fetch complete order with items
    return getOrderById(order.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllOrders(page: number, limit: number, status?: string, search?: string) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    whereClause += ` AND o.status = $${paramCount}`;
    params.push(status);
  }

  if (search) {
    paramCount++;
    whereClause += ` AND (o.order_number ILIKE $${paramCount} OR cu.name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM orders o LEFT JOIN customers cu ON o.customer_id = cu.id ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;

  const dataResult = await pool.query(
    `SELECT o.*, cu.name as customer_name, cu.business_name as customer_business, u.name as created_by_name
     FROM orders o
     LEFT JOIN customers cu ON o.customer_id = cu.id
     LEFT JOIN users u ON o.created_by = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...params, limit, offset]
  );

  return { orders: dataResult.rows, total };
}

export async function getOrderById(id: number) {
  const orderResult = await pool.query(
    `SELECT o.*, cu.name as customer_name, cu.business_name as customer_business,
            cu.mobile as customer_mobile, cu.email as customer_email, cu.address as customer_address,
            cu.gst_no as customer_gst, u.name as created_by_name
     FROM orders o
     LEFT JOIN customers cu ON o.customer_id = cu.id
     LEFT JOIN users u ON o.created_by = u.id
     WHERE o.id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) {
    throw { statusCode: 404, message: 'Order not found' };
  }

  const order = orderResult.rows[0];

  // Get items
  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [id]
  );

  return { ...order, items: itemsResult.rows };
}

export async function updateOrderStatus(id: number, newStatus: string, userId: number) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Order not found' };
    }

    const order = orderResult.rows[0];

    // Validate status transitions
    if (order.status === 'Cancelled') {
      throw { statusCode: 400, message: 'Cannot update a cancelled order' };
    }

    if (order.status === 'Confirmed' && newStatus === 'Draft') {
      throw { statusCode: 400, message: 'Cannot revert a confirmed order to draft' };
    }

    // If confirming a draft, deduct stock
    if (order.status === 'Draft' && newStatus === 'Confirmed') {
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        const productResult = await client.query(
          'SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw { statusCode: 404, message: `Product with ID ${item.product_id} no longer exists` };
        }

        const product = productResult.rows[0];
        if (product.current_stock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`,
          };
        }

        // Deduct stock
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Record movement
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Order ${order.order_number} confirmed`, userId]
        );
      }
    }

    // If cancelling a confirmed order, restore stock
    if (order.status === 'Confirmed' && newStatus === 'Cancelled') {
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET current_stock = current_stock + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'IN', $3, $4)`,
          [item.product_id, item.quantity, `Order ${order.order_number} cancelled - stock restored`, userId]
        );
      }
    }

    // Update status
    await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [newStatus, id]
    );

    await client.query('COMMIT');

    return getOrderById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
