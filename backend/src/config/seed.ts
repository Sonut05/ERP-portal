import pool from './db';
import bcrypt from 'bcryptjs';

export const initSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts')),
  mobile VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20),
  email VARCHAR(255),
  business_name VARCHAR(200),
  gst_no VARCHAR(20),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Active', 'Inactive')),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_changed INTEGER NOT NULL,
  movement_type VARCHAR(5) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  reason TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name_snapshot VARCHAR(200) NOT NULL,
  product_price_snapshot NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL
);
`;

export const seedUsers = [
  { name: 'Admin User', email: 'admin@erp.com', password: 'Admin@123', role: 'Admin' },
  { name: 'Sales User', email: 'sales@erp.com', password: 'Sales@123', role: 'Sales' },
  { name: 'Warehouse User', email: 'warehouse@erp.com', password: 'Warehouse@123', role: 'Warehouse' },
  { name: 'Accounts User', email: 'accounts@erp.com', password: 'Accounts@123', role: 'Accounts' },
];

export async function seed(targetPool = pool) {
  try {
    console.log('🔧 Initializing database tables...');
    await targetPool.query(initSQL);
    console.log('✅ Tables created successfully');

    console.log('🌱 Seeding users...');
    for (const user of seedUsers) {
      const existing = await targetPool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(user.password, 12);
        await targetPool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [user.name, user.email, hash, user.role]
        );
        console.log(`  ✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`  ⏭️  User already exists: ${user.email}`);
      }
    }

    // Seed sample products
    const sampleProducts = [
      { name: 'Wireless Keyboard', sku: 'WKB-001', category: 'Electronics', unit_price: 1499.00, current_stock: 50, min_stock_alert: 10, location: 'Warehouse A' },
      { name: 'USB-C Hub 7-in-1', sku: 'UCH-002', category: 'Electronics', unit_price: 2299.00, current_stock: 30, min_stock_alert: 5, location: 'Warehouse A' },
      { name: 'Office Chair Ergonomic', sku: 'OCE-003', category: 'Furniture', unit_price: 8999.00, current_stock: 15, min_stock_alert: 3, location: 'Warehouse B' },
      { name: 'A4 Copy Paper (500 sheets)', sku: 'ACP-004', category: 'Stationery', unit_price: 299.00, current_stock: 200, min_stock_alert: 50, location: 'Warehouse A' },
      { name: 'LED Monitor 24 inch', sku: 'LDM-005', category: 'Electronics', unit_price: 12499.00, current_stock: 20, min_stock_alert: 5, location: 'Warehouse B' },
    ];

    console.log('📦 Seeding sample products...');
    for (const product of sampleProducts) {
      const existing = await targetPool.query('SELECT id FROM products WHERE sku = $1', [product.sku]);
      if (existing.rows.length === 0) {
        await targetPool.query(
          'INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [product.name, product.sku, product.category, product.unit_price, product.current_stock, product.min_stock_alert, product.location]
        );
        console.log(`  ✅ Created product: ${product.name}`);
      } else {
        console.log(`  ⏭️  Product already exists: ${product.sku}`);
      }
    }

    // Seed sample customers
    const sampleCustomers = [
      { name: 'Rajesh Kumar', mobile: '9876543210', email: 'rajesh@techsupply.in', business_name: 'Tech Supply India', gst_no: '29ABCDE1234F1Z5', type: 'Wholesale', address: '45 MG Road, Bangalore', status: 'Active', notes: 'Long-term wholesale client' },
      { name: 'Priya Sharma', mobile: '9876543211', email: 'priya@homeoffice.com', business_name: 'Home Office Solutions', gst_no: null, type: 'Retail', address: '12 Park Street, Kolkata', status: 'Lead', notes: 'Interested in bulk stationery' },
      { name: 'Amit Patel', mobile: '9876543212', email: 'amit@distroking.com', business_name: 'DistroKing Pvt Ltd', gst_no: '24FGHIJ5678K2L3', type: 'Distributor', address: '78 SG Highway, Ahmedabad', status: 'Active', notes: 'Main distributor for Gujarat' },
    ];

    console.log('👥 Seeding sample customers...');
    for (const customer of sampleCustomers) {
      const existing = await targetPool.query('SELECT id FROM customers WHERE email = $1', [customer.email]);
      if (existing.rows.length === 0) {
        await targetPool.query(
          'INSERT INTO customers (name, mobile, email, business_name, gst_no, type, address, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [customer.name, customer.mobile, customer.email, customer.business_name, customer.gst_no, customer.type, customer.address, customer.status, customer.notes]
        );
        console.log(`  ✅ Created customer: ${customer.name}`);
      } else {
        console.log(`  ⏭️  Customer already exists: ${customer.email}`);
      }
    }

    console.log('\n🎉 Database seed complete!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
