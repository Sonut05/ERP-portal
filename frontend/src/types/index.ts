export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string | null;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_no: string | null;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: number;
  created_by_name: string;
  product_name?: string;
  product_sku?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  product_price_snapshot: number;
  quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_business: string;
  customer_mobile?: string;
  customer_email?: string;
  customer_address?: string;
  customer_gst?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items?: OrderItem[];
}

export interface DashboardStats {
  customers: { total: number; active: number; leads: number };
  products: { total: number; lowStock: number };
  orders: { total: number; drafts: number; confirmed: number };
  recentOrders: Order[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
