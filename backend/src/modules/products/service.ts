import pool from '../../config/db';

export interface CreateProductData {
  name: string;
  sku: string;
  category?: string;
  unit_price: number;
  current_stock?: number;
  min_stock_alert?: number;
  location?: string;
}

export async function getAllProducts(
  page: number,
  limit: number,
  search?: string,
  category?: string,
  lowStock?: boolean
) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereClause += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  if (category) {
    paramCount++;
    whereClause += ` AND category = $${paramCount}`;
    params.push(category);
  }

  if (lowStock) {
    whereClause += ` AND current_stock <= min_stock_alert`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;

  const dataResult = await pool.query(
    `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...params, limit, offset]
  );

  return { products: dataResult.rows, total };
}

export async function getProductById(id: number) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Product not found' };
  }
  return result.rows[0];
}

export async function createProduct(data: CreateProductData) {
  // Check SKU uniqueness
  const existing = await pool.query('SELECT id FROM products WHERE sku = $1', [data.sku]);
  if (existing.rows.length > 0) {
    throw { statusCode: 409, message: `Product with SKU '${data.sku}' already exists` };
  }

  const result = await pool.query(
    `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.name,
      data.sku,
      data.category || null,
      data.unit_price,
      data.current_stock || 0,
      data.min_stock_alert || 0,
      data.location || null,
    ]
  );
  return result.rows[0];
}

export async function updateProduct(id: number, data: Partial<CreateProductData>) {
  await getProductById(id);

  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  const allowedFields = ['name', 'sku', 'category', 'unit_price', 'min_stock_alert', 'location'];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      paramCount++;
      fields.push(`${field} = $${paramCount}`);
      values.push((data as any)[field]);
    }
  }

  if (fields.length === 0) {
    throw { statusCode: 400, message: 'No fields to update' };
  }

  // If updating SKU, check uniqueness
  if (data.sku) {
    const existing = await pool.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [data.sku, id]);
    if (existing.rows.length > 0) {
      throw { statusCode: 409, message: `Product with SKU '${data.sku}' already exists` };
    }
  }

  paramCount++;
  values.push(id);

  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function getProductStockMovements(productId: number, page: number, limit: number) {
  await getProductById(productId);

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM stock_movements WHERE product_id = $1',
    [productId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  const dataResult = await pool.query(
    `SELECT sm.*, u.name as created_by_name
     FROM stock_movements sm
     LEFT JOIN users u ON sm.created_by = u.id
     WHERE sm.product_id = $1
     ORDER BY sm.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );

  return { movements: dataResult.rows, total };
}
