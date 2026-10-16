import { useState, useEffect, useRef, type FormEvent } from 'react';
import { stockApi } from '../api/stock';
import { productsApi } from '../api/products';
import type { StockMovement, Product } from '../types';
import { useToast } from '../hooks/useToast';
import Sheet from '../components/Sheet';
import Pagination from '../components/Pagination';
import StatusMark from '../components/StatusMark';
import { Empty, TableSkeleton } from '../components/TableState';
import { formatDateTime, plural } from '../lib/format';

const emptyForm = {
  product_id: 0,
  quantity: 1,
  movement_type: 'IN' as 'IN' | 'OUT',
  reason: '',
};

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();
  const latestRequest = useRef(0);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, [page]);

  const loadMovements = async () => {
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const res = await stockApi.getAll({ page, limit: 15 });
      if (requestId !== latestRequest.current) return;
      setMovements(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await stockApi.createMovement({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        movement_type: form.movement_type,
        reason: form.reason,
      });
      toast.show('success', `Stock ${form.movement_type === 'IN' ? 'added' : 'removed'} successfully`);
      setShowModal(false);
      setForm(emptyForm);
      loadMovements();
      loadProducts();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed to record movement');
    }
  };

  const selected = products.find((p) => p.id === Number(form.product_id));
  const after = selected ? selected.current_stock + (form.movement_type === 'IN' ? form.quantity : -form.quantity) : null;
  const overdrawn = after !== null && after < 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Stock movements</h1>
          <p className="page-meta">{loading && movements.length === 0 ? ' ' : plural(total, 'movement')}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
          Record movement
        </button>
      </div>

      <div className="ledger" aria-busy={loading}>
        {loading && movements.length === 0 ? (
          <TableSkeleton />
        ) : movements.length === 0 ? (
          <Empty
            title="No stock movements yet"
            action={
              <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>Record the first one</button>
            }
          >
            Goods received, damaged or sent out will be listed here.
          </Empty>
        ) : (
          <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th className="num">Quantity</th>
                  <th>Reason</th>
                  <th>Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Date">{formatDateTime(m.created_at)}</td>
                    <td data-label="Product"><strong>{m.product_name || '—'}</strong></td>
                    <td data-label="SKU" className="ref">{m.product_sku || '—'}</td>
                    <td data-label="Type"><StatusMark value={m.movement_type} label={m.movement_type === 'IN' ? 'In' : 'Out'} /></td>
                    <td data-label="Quantity" className={`num qty qty--${m.movement_type.toLowerCase()}`}>
                      {m.movement_type === 'IN' ? '+' : '−'}{m.quantity_changed}
                    </td>
                    <td data-label="Reason">{m.reason}</td>
                    <td data-label="Recorded by">{m.created_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {showModal && (
        <Sheet
          title="Record stock movement"
          onClose={() => setShowModal(false)}
          dismissOnBackdrop={false}
          onSubmit={handleSubmit}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={!form.product_id}>Record movement</button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="sm-product">Product</label>
            <select id="sm-product" className="select" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: parseInt(e.target.value) })} required>
              <option value={0}>Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}), {p.current_stock} in stock</option>
              ))}
            </select>
          </div>

          <fieldset className="segmented">
            <legend>Direction</legend>
            <label className={form.movement_type === 'IN' ? 'is-on' : ''}>
              <input type="radio" name="movement_type" value="IN" checked={form.movement_type === 'IN'} onChange={() => setForm({ ...form, movement_type: 'IN' })} />
              <span>Stock in</span>
              <small>Add to the shelf</small>
            </label>
            <label className={form.movement_type === 'OUT' ? 'is-on' : ''}>
              <input type="radio" name="movement_type" value="OUT" checked={form.movement_type === 'OUT'} onChange={() => setForm({ ...form, movement_type: 'OUT' })} />
              <span>Stock out</span>
              <small>Remove from the shelf</small>
            </label>
          </fieldset>

          <div className="field">
            <label htmlFor="sm-qty">Quantity</label>
            <input id="sm-qty" className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required />
            {selected && (
              <span className={`hint ${overdrawn ? 'hint--bad' : ''}`}>
                {overdrawn
                  ? `Only ${selected.current_stock} in stock. This would take it below zero.`
                  : `${selected.current_stock} in stock now, ${after} after this movement.`}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="sm-reason">Reason</label>
            <textarea id="sm-reason" className="textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="New shipment received, damaged goods, sample sent…" required />
          </div>
        </Sheet>
      )}
    </div>
  );
}
