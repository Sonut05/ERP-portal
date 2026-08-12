import pool from '../../config/db';

export interface StockMovementData {
  product_id: number;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: number;
}

export async function createStockMovement(data: StockMovementData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current product stock
    const productResult = await client.query(
      'SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE',
      [data.product_id]
    );

    if (productResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Product not found' };
    }

    const product = productResult.rows[0];
    let newStock: number;

    if (data.movement_type === 'IN') {
      newStock = product.current_stock + data.quantity;
    } else {
      newStock = product.current_stock - data.quantity;
      if (newStock < 0) {
        throw {
          statusCode: 400,
          message: `Insufficient stock. Current stock: ${product.current_stock}, Requested: ${data.quantity}`,
        };
      }
    }

    // Update product stock
    await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, data.product_id]);

    // Create movement record
    const movementResult = await client.query(
      `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.product_id, data.quantity, data.movement_type, data.reason, data.created_by]
    );

    await client.query('COMMIT');

    return {
      movement: movementResult.rows[0],
      product_name: product.name,
      previous_stock: product.current_stock,
      new_stock: newStock,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllStockMovements(page: number, limit: number) {
  const countResult = await pool.query('SELECT COUNT(*) FROM stock_movements');
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  const dataResult = await pool.query(
    `SELECT sm.*, p.name as product_name, p.sku as product_sku, u.name as created_by_name
     FROM stock_movements sm
     LEFT JOIN products p ON sm.product_id = p.id
     LEFT JOIN users u ON sm.created_by = u.id
     ORDER BY sm.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { movements: dataResult.rows, total };
}
