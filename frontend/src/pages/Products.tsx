import { useState, useEffect, useRef, type FormEvent } from 'react';
import { productsApi } from '../api/products';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import Sheet from '../components/Sheet';
import Pagination from '../components/Pagination';
import { Empty, TableSkeleton } from '../components/TableState';
import { formatPrice, plural } from '../lib/format';

const emptyForm = {
  name: '', sku: '', category: '', unit_price: 0,
  current_stock: 0, min_stock_alert: 0, location: '',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const toast = useToast();
  const { hasRole } = useAuth();
  const latestRequest = useRef(0);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadProducts();
  }, [page, search, lowStockOnly]);

  const loadProducts = async () => {
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const res = await productsApi.getAll({ page, limit: 10, search, lowStock: lowStockOnly || undefined });
      if (requestId !== latestRequest.current) return;
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, unit_price: Number(form.unit_price), current_stock: Number(form.current_stock), min_stock_alert: Number(form.min_stock_alert) };
      if (editProduct) {
        const { current_stock, ...updatePayload } = payload;
        await productsApi.update(editProduct.id, updatePayload);
        toast.show('success', 'Product updated');
      } else {
        await productsApi.create(payload);
        toast.show('success', 'Product created');
      }
      setShowModal(false);
      setEditProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed');
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

  const resetForm = () => setForm(emptyForm);

  const openCreate = () => {
    setEditProduct(null);
    resetForm();
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditProduct(null);
  };

  const canEdit = hasRole('Admin', 'Warehouse');
  const filtered = Boolean(searchInput || lowStockOnly);
  const clearFilters = () => {
    setSearchInput('');
    setLowStockOnly(false);
    setPage(1);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-meta">{loading && products.length === 0 ? ' ' : filtered ? plural(total, 'match', 'matches') : plural(total, 'product')}</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            Add product
          </button>
        )}
      </div>

      <div className="filters" role="search">
        <div className="field field--grow">
          <label htmlFor="p-search">Search</label>
          <input
            id="p-search"
            className="input"
            type="search"
            placeholder="Product name or SKU"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />
          <span>Low stock only</span>
        </label>
        {filtered && (
          <button type="button" className="link-btn filters__clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="ledger" aria-busy={loading}>
        {loading && products.length === 0 ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
          <Empty
            title={lowStockOnly && !searchInput ? 'Nothing is below its minimum' : filtered ? 'No products match' : 'No products yet'}
            action={
              filtered ? (
                <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
              ) : canEdit ? (
                <button type="button" className="btn btn--primary" onClick={openCreate}>Add the first product</button>
              ) : undefined
            }
          />
        ) : (
          <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th className="num">Minimum</th>
                  <th>Location</th>
                  {canEdit && <th className="num">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const low = p.current_stock <= p.min_stock_alert;
                  return (
                    <tr key={p.id}>
                      <td data-label="" className="primary-cell"><strong>{p.name}</strong></td>
                      <td data-label="SKU" className="ref">{p.sku}</td>
                      <td data-label="Category">{p.category || '—'}</td>
                      <td data-label="Price" className="num">{formatPrice(p.unit_price)}</td>
                      <td data-label="Stock" className={`num ${low ? 'is-low' : ''}`}>
                        {low && <span className="flag">Low</span>}
                        <strong>{p.current_stock}</strong>
                      </td>
                      <td data-label="Minimum" className="num">{p.min_stock_alert}</td>
                      <td data-label="Location">{p.location || '—'}</td>
                      {canEdit && (
                        <td data-label="" className="actions">
                          <button type="button" className="link-btn" onClick={() => handleEdit(p)}>Edit</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {showModal && (
        <Sheet
          title={editProduct ? 'Edit product' : 'Add product'}
          onClose={closeForm}
          dismissOnBackdrop={false}
          onSubmit={handleSubmit}
          footer={
            <>
              <button type="button" className="btn" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">{editProduct ? 'Save changes' : 'Create product'}</button>
            </>
          }
        >
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-name">Product name <span className="req">(required)</span></label>
              <input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="pf-sku">SKU code <span className="req">(required)</span></label>
              <input id="pf-sku" className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-cat">Category</label>
              <input id="pf-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pf-price">Unit price (₹)</label>
              <input id="pf-price" className="input" type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} required />
            </div>
          </div>
          {!editProduct ? (
            <div className="field">
              <label htmlFor="pf-stock">Opening stock</label>
              <input id="pf-stock" className="input" type="number" min="0" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })} />
            </div>
          ) : (
            <p className="hint hint--block">
              Current stock is {editProduct.current_stock}. To change it, record a movement under Stock movements.
            </p>
          )}
          <div className="field-row">
            <div className="field">
              <label htmlFor="pf-min">Minimum stock alert</label>
              <input id="pf-min" className="input" type="number" min="0" value={form.min_stock_alert} onChange={(e) => setForm({ ...form, min_stock_alert: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="field">
              <label htmlFor="pf-loc">Location / warehouse</label>
              <input id="pf-loc" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
