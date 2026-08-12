import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import { signToken } from '../../utils/jwt';

export async function loginUser(email: string, password: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
    },
  };
}

export async function getUserById(userId: number) {
  const result = await pool.query(
    'SELECT id, name, email, mobile, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  return result.rows[0];
}

export async function updateUserProfile(userId: number, data: {
  name: string;
  email: string;
  mobile?: string | null;
  currentPassword?: string | null;
  newPassword?: string | null;
}) {
  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const user = userResult.rows[0];

  // Check email uniqueness if email changed
  if (data.email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [data.email, userId]);
    if (existing.rows.length > 0) {
      throw { statusCode: 400, message: 'Email is already in use' };
    }
  }

  let newPasswordHash = user.password_hash;
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw { statusCode: 400, message: 'Current password is required to change password' };
    }
    const isMatch = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }
    newPasswordHash = await bcrypt.hash(data.newPassword, 12);
  }

  const updatedResult = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, mobile = $3, password_hash = $4
     WHERE id = $5
     RETURNING id, name, email, mobile, role, created_at`,
    [data.name, data.email, data.mobile || null, newPasswordHash, userId]
  );

  return updatedResult.rows[0];
}
