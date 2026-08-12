import { useState, useEffect, type FormEvent } from 'react';
import { productsApi } from '../api/products';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    name: '', sku: '', category: '', unit_price: 0,
    current_stock: 0, min_stock_alert: 0, location: '',
  });

  useEffect(() => {
    loadProducts();
  }, [page, search, lowStockOnly]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll({ page, limit: 10, search, lowStock: lowStockOnly || undefined });
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, unit_price: Number(form.unit_price), current_stock: Number(form.current_stock), min_stock_alert: Number(form.min_stock_alert) };
      if (editProduct) {
        const { current_stock, ...updatePayload } = payload;
        await productsApi.update(editProduct.id, updatePayload);
        showToast('success', 'Product updated');
      } else {
        await productsApi.create(payload);
        showToast('success', 'Product created');
      }
      setShowModal(false);
      setEditProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name, sku: product.sku, category: product.category || '',
      unit_price: product.unit_price, current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert, location: product.location || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', sku: '', category: '', unit_price: 0, current_stock: 0, min_stock_alert: 0, location: '' });
  };

  const openCreate = () => {
    setEditProduct(null);
    resetForm();
    setShowModal(true);
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
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage inventory and product catalog</p>
        </div>
        {hasRole('Admin', 'Warehouse') && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search by name or SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}>
          ⚠️ Low Stock {lowStockOnly ? '(Active)' : ''}
        </button>
      </div>

      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Min Alert</th>
                  <th>Location</th>
                  {hasRole('Admin', 'Warehouse') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8' }}>{p.sku}</td>
                    <td>{p.category || '—'}</td>
                    <td>{formatPrice(p.unit_price)}</td>
                    <td>
                      {p.current_stock}
                      {p.current_stock <= p.min_stock_alert && (
                        <span className="badge badge-low-stock" style={{ marginLeft: '8px' }}>Low</span>
                      )}
                    </td>
                    <td>{p.min_stock_alert}</td>
                    <td>{p.location || '—'}</td>
                    {hasRole('Admin', 'Warehouse') && (
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>✏️</button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">No products found</div></div></td></tr>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU Code *</label>
                    <input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input className="form-input" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
                {!editProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input className="form-input" type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Stock Alert</label>
                    <input className="form-input" type="number" value={form.min_stock_alert} onChange={(e) => setForm({ ...form, min_stock_alert: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location / Warehouse</label>
                    <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
