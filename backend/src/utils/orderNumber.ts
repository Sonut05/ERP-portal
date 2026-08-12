import pool from '../config/db';

/**
 * Generates a unique order number in format: ORD-YYYYMMDD-XXXX
 * where XXXX is a sequential counter for that day
 */
export async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const result = await pool.query(
    "SELECT order_number FROM orders WHERE order_number LIKE $1 ORDER BY order_number DESC LIMIT 1",
    [`${prefix}%`]
  );

  let counter = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].order_number;
    const lastCounter = parseInt(lastNumber.split('-').pop() || '0', 10);
    counter = lastCounter + 1;
  }

  return `${prefix}${counter.toString().padStart(4, '0')}`;
}
