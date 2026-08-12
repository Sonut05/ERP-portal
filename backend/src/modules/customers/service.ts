import pool from '../../config/db';

export interface CreateCustomerData {
  name: string;
  mobile?: string;
  email?: string;
  business_name?: string;
  gst_no?: string;
  type: string;
  address?: string;
  status?: string;
  follow_up_date?: string | null;
  notes?: string;
}

export async function getAllCustomers(
  page: number,
  limit: number,
  search?: string,
  status?: string,
  type?: string
) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereClause += ` AND (name ILIKE $${paramCount} OR business_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR mobile ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  if (type) {
    paramCount++;
    whereClause += ` AND type = $${paramCount}`;
    params.push(type);
  }

  // Count query
  const countResult = await pool.query(`SELECT COUNT(*) FROM customers ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query with pagination
  const offset = (page - 1) * limit;
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;

  const dataResult = await pool.query(
    `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
    [...params, limit, offset]
  );

  return { customers: dataResult.rows, total };
}

export async function getCustomerById(id: number) {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Customer not found' };
  }
  return result.rows[0];
}

export async function createCustomer(data: CreateCustomerData) {
  const result = await pool.query(
    `INSERT INTO customers (name, mobile, email, business_name, gst_no, type, address, status, follow_up_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.name,
      data.mobile || null,
      data.email || null,
      data.business_name || null,
      data.gst_no || null,
      data.type,
      data.address || null,
      data.status || 'Lead',
      data.follow_up_date || null,
      data.notes || null,
    ]
  );
  return result.rows[0];
}

export async function updateCustomer(id: number, data: Partial<CreateCustomerData>) {
  // Check exists
  await getCustomerById(id);

  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  const allowedFields = [
    'name', 'mobile', 'email', 'business_name', 'gst_no',
    'type', 'address', 'status', 'follow_up_date', 'notes',
  ];

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

  paramCount++;
  values.push(id);

  const result = await pool.query(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function addFollowUpNote(id: number, note: string) {
  const customer = await getCustomerById(id);
  const existingNotes = customer.notes || '';
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newNotes = existingNotes
    ? `${existingNotes}\n\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  const result = await pool.query(
    'UPDATE customers SET notes = $1 WHERE id = $2 RETURNING *',
    [newNotes, id]
  );

  return result.rows[0];
}
