import { useState, useEffect, type FormEvent } from 'react';
import { stockApi } from '../api/stock';
import { productsApi } from '../api/products';
import type { StockMovement, Product } from '../types';

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [form, setForm] = useState({
    product_id: 0,
    quantity: 1,
    movement_type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, [page]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await stockApi.getAll({ page, limit: 15 });
      setMovements(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getAll({ limit: 100 });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await stockApi.createMovement({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        movement_type: form.movement_type,
        reason: form.reason,
      });
      showToast('success', `Stock ${form.movement_type === 'IN' ? 'added' : 'removed'} successfully`);
      setShowModal(false);
      setForm({ product_id: 0, quantity: 1, movement_type: 'IN', reason: '' });
      loadMovements();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to record movement');
    }
  };

  return (
    <div className="animate-fadeIn">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">Track inventory in and out movements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Movement</button>
      </div>

      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {movements.length > 0 ? movements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>{m.product_name || '—'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8' }}>{m.product_sku || '—'}</td>
                    <td><span className={`badge badge-${m.movement_type.toLowerCase()}`}>{m.movement_type}</span></td>
                    <td style={{ fontWeight: 600, color: m.movement_type === 'IN' ? '#10b981' : '#ef4444' }}>
                      {m.movement_type === 'IN' ? '+' : '-'}{m.quantity_changed}
                    </td>
                    <td>{m.reason}</td>
                    <td>{m.created_by_name || '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-text">No stock movements recorded</div></div></td></tr>
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
              <h2>Record Stock Movement</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: parseInt(e.target.value) })} required>
                    <option value={0}>Select a product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.current_stock}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Movement Type *</label>
                    <select className="form-select" value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value as 'IN' | 'OUT' })}>
                      <option value="IN">📥 Stock IN (Add)</option>
                      <option value="OUT">📤 Stock OUT (Remove)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="form-textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g., New shipment received, Damaged goods..." required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!form.product_id}>Record Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
