import { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
import type { Order, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface OrderItemInput {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  max_stock: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  // Create form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(0);
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [addProductId, setAddProductId] = useState(0);
  const [addQuantity, setAddQuantity] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.getAll({ page, limit: 10, status: statusFilter, search });
      setOrders(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [cusRes, prodRes] = await Promise.all([
        customersApi.getAll({ limit: 100 }),
        productsApi.getAll({ limit: 100 }),
      ]);
      setCustomers(cusRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = async () => {
    await loadFormData();
    setSelectedCustomer(0);
    setItems([]);
    setShowCreate(true);
  };

  const addItem = () => {
    if (!addProductId) return;
    const product = products.find(p => p.id === addProductId);
    if (!product) return;

    // Check if already added
    if (items.find(i => i.product_id === addProductId)) {
      showToast('error', 'Product already added');
      return;
    }

    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      product_price: product.unit_price,
      quantity: addQuantity,
      max_stock: product.current_stock,
    }]);
    setAddProductId(0);
    setAddQuantity(1);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity } : i));
  };

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.product_price), 0);

  const handleCreate = async (status: 'Draft' | 'Confirmed') => {
    if (!selectedCustomer || items.length === 0) {
      showToast('error', 'Please select a customer and add at least one product');
      return;
    }

    try {
      await ordersApi.create({
        customer_id: selectedCustomer,
        status,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      showToast('success', `Order created as ${status}`);
      setShowCreate(false);
      loadOrders();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create order');
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await ordersApi.getById(id);
      setShowDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      showToast('success', `Order ${status.toLowerCase()}`);
      if (showDetail) {
        const res = await ordersApi.getById(id);
        setShowDetail(res.data.data);
      }
      loadOrders();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatPrice = (price: number) => `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fadeIn">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">Manage sales delivery orders</p>
        </div>
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-primary" onClick={openCreate}>+ Create Order</button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search by order no. or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8', cursor: 'pointer' }} onClick={() => viewDetail(o.id)}>{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.total_quantity}</td>
                    <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td>{o.created_by_name}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => viewDetail(o.id)}>👁️</button>
                        {o.status === 'Draft' && hasRole('Admin', 'Sales') && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(o.id, 'Confirmed')}>✓</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'Cancelled')}>✕</button>
                          </>
                        )}
                        {o.status === 'Confirmed' && hasRole('Admin', 'Sales') && (
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'Cancelled')}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No orders found</div></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>Create New Order</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select className="form-select" value={selectedCustomer} onChange={(e) => setSelectedCustomer(parseInt(e.target.value))}>
                  <option value={0}>Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.business_name ? `(${c.business_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Add Products</label>
                <div className="order-add-item">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select className="form-select" value={addProductId} onChange={(e) => setAddProductId(parseInt(e.target.value))}>
                      <option value={0}>Select product</option>
                      {products.filter(p => !items.find(i => i.product_id === p.id)).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.current_stock} — {formatPrice(p.unit_price)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-input" type="number" min="1" value={addQuantity} onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)} placeholder="Qty" />
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={addItem} disabled={!addProductId}>Add</button>
                </div>
              </div>

              {/* Items list */}
              {items.length > 0 && (
                <div className="order-items-list">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 40px', gap: '8px', padding: '8px 12px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span>Product</span><span>Price</span><span>Qty</span><span>Total</span><span></span>
                  </div>
                  {items.map((item) => (
                    <div key={item.product_id} className="order-item-row" style={{ gridTemplateColumns: '1fr 100px 100px 100px 40px' }}>
                      <span style={{ color: '#f1f5f9', fontSize: '0.875rem' }}>{item.product_name}</span>
                      <span style={{ fontSize: '0.85rem' }}>{formatPrice(item.product_price)}</span>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        max={item.max_stock}
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                        style={{ padding: '6px 8px' }}
                      />
                      <span style={{ fontWeight: 600, color: '#818cf8' }}>{formatPrice(item.quantity * item.product_price)}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.product_id)} style={{ padding: '4px' }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="order-summary">
                  <div>
                    <div className="order-summary-label">Total Items: {items.length}</div>
                    <div className="order-summary-label">Total Quantity: {totalQuantity}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="order-summary-label">Total Amount</div>
                    <div className="order-summary-value">{formatPrice(totalAmount)}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => handleCreate('Draft')} disabled={!selectedCustomer || items.length === 0}>
                Save as Draft
              </button>
              <button className="btn btn-success" onClick={() => handleCreate('Confirmed')} disabled={!selectedCustomer || items.length === 0}>
                Confirm & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Order {showDetail.order_number}</h2>
              <button className="modal-close" onClick={() => setShowDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section glass-card-static">
                  <h3>Order Info</h3>
                  <div className="detail-row"><span className="detail-label">Order No.</span><span className="detail-value" style={{ fontFamily: 'monospace', color: '#818cf8' }}>{showDetail.order_number}</span></div>
                  <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge badge-${showDetail.status.toLowerCase()}`}>{showDetail.status}</span></span></div>
                  <div className="detail-row"><span className="detail-label">Created By</span><span className="detail-value">{showDetail.created_by_name}</span></div>
                  <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{new Date(showDetail.created_at).toLocaleString()}</span></div>
                </div>
                <div className="detail-section glass-card-static">
                  <h3>Customer</h3>
                  <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{showDetail.customer_name}</span></div>
                  <div className="detail-row"><span className="detail-label">Business</span><span className="detail-value">{showDetail.customer_business || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">Mobile</span><span className="detail-value">{showDetail.customer_mobile || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">GST</span><span className="detail-value">{showDetail.customer_gst || '—'}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8', marginBottom: '12px' }}>Items</h3>
                <div className="table-container glass-card-static" style={{ borderRadius: '12px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price (Snapshot)</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetail.items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name_snapshot}</td>
                          <td>{formatPrice(item.product_price_snapshot)}</td>
                          <td>{item.quantity}</td>
                          <td style={{ fontWeight: 600, color: '#818cf8' }}>{formatPrice(item.quantity * item.product_price_snapshot)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="order-summary" style={{ marginTop: '12px' }}>
                  <div className="order-summary-label">Total Quantity: {showDetail.total_quantity}</div>
                  <div>
                    <div className="order-summary-label">Total Amount</div>
                    <div className="order-summary-value">
                      {formatPrice(showDetail.items?.reduce((sum, i) => sum + i.quantity * i.product_price_snapshot, 0) || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              {hasRole('Admin', 'Sales') && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {showDetail.status === 'Draft' && (
                    <>
                      <button className="btn btn-success" onClick={() => updateStatus(showDetail.id, 'Confirmed')}>✓ Confirm & Deduct Stock</button>
                      <button className="btn btn-danger" onClick={() => updateStatus(showDetail.id, 'Cancelled')}>✕ Cancel</button>
                    </>
                  )}
                  {showDetail.status === 'Confirmed' && (
                    <button className="btn btn-danger" onClick={() => updateStatus(showDetail.id, 'Cancelled')}>Cancel Order (Restore Stock)</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
