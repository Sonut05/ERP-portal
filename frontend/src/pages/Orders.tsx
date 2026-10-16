import { useState, useEffect, useRef } from 'react';
import { ordersApi } from '../api/orders';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
import type { Order, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import Sheet from '../components/Sheet';
import Confirm from '../components/Confirm';
import Pagination from '../components/Pagination';
import StatusMark from '../components/StatusMark';
import { Empty, TableSkeleton } from '../components/TableState';
import { formatDate, formatDateTime, formatPrice, plural } from '../lib/format';

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
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [pendingCancel, setPendingCancel] = useState<{ id: number; number: string; status: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();
  const { hasRole } = useAuth();
  const latestRequest = useRef(0);

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
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const res = await ordersApi.getAll({ page, limit: 10, status: statusFilter, search });
      if (requestId !== latestRequest.current) return;
      setOrders(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
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

  const openCreate = async () => {
    await loadFormData();
    setSelectedCustomer(0);
    setItems([]);
    setAddProductId(0);
    setAddQuantity(1);
    setShowCreate(true);
  };

  const addItem = () => {
    if (!addProductId) return;
    const product = products.find(p => p.id === addProductId);
    if (!product) return;

    // Check if already added
    if (items.find(i => i.product_id === addProductId)) {
      toast.show('error', 'Product already added');
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
  const overStock = items.filter(i => i.quantity > i.max_stock);

  const handleCreate = async (status: 'Draft' | 'Confirmed') => {
    if (!selectedCustomer || items.length === 0) {
      toast.show('error', 'Please select a customer and add at least one product');
      return;
    }

    try {
      await ordersApi.create({
        customer_id: selectedCustomer,
        status,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      toast.show('success', `Order created as ${status}`);
      setShowCreate(false);
      loadOrders();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed to create order');
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
      toast.show('success', `Order ${status.toLowerCase()}`);
      if (showDetail) {
        const res = await ordersApi.getById(id);
        setShowDetail(res.data.data);
      }
      loadOrders();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    await updateStatus(pendingCancel.id, 'Cancelled');
    setCancelling(false);
    setPendingCancel(null);
  };

  const canWrite = hasRole('Admin', 'Sales');
  const filtered = Boolean(searchInput || statusFilter);
  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPage(1);
  };

  const detailTotal = showDetail?.items?.reduce((sum, i) => sum + i.quantity * i.product_price_snapshot, 0) || 0;

  return (
    <div>
      <div className="page-head no-print">
        <div>
          <h1 className="page-title">Sales orders</h1>
          <p className="page-meta">{loading && orders.length === 0 ? ' ' : filtered ? plural(total, 'match', 'matches') : plural(total, 'order')}</p>
        </div>
        {canWrite && (
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            Create order
          </button>
        )}
      </div>

      <div className="filters" role="search">
        <div className="field field--grow">
          <label htmlFor="o-search">Search</label>
          <input
            id="o-search"
            className="input"
            type="search"
            placeholder="Order number or customer"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <div className="field">
          <label htmlFor="o-status">Status</label>
          <select id="o-status" className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        {filtered && (
          <button type="button" className="link-btn filters__clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="ledger" aria-busy={loading}>
        {loading && orders.length === 0 ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <Empty
            title={filtered ? 'No orders match these filters' : 'No orders yet'}
            action={
              filtered ? (
                <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
              ) : canWrite ? (
                <button type="button" className="btn btn--primary" onClick={openCreate}>Create the first order</button>
              ) : undefined
            }
          />
        ) : (
          <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>Order no.</th>
                  <th>Customer</th>
                  <th className="num">Total qty</th>
                  <th>Status</th>
                  <th>Created by</th>
                  <th>Date</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={o.status === 'Cancelled' ? 'is-void' : ''}>
                    <td data-label="" className="ref primary-cell">
                      <button type="button" className="ref-link" onClick={() => viewDetail(o.id)}>{o.order_number}</button>
                    </td>
                    <td data-label="Customer">{o.customer_name}</td>
                    <td data-label="Total qty" className="num">{o.total_quantity}</td>
                    <td data-label="Status"><StatusMark value={o.status} /></td>
                    <td data-label="Created by">{o.created_by_name}</td>
                    <td data-label="Date">{formatDate(o.created_at)}</td>
                    <td data-label="" className="actions">
                      <button type="button" className="link-btn" onClick={() => viewDetail(o.id)}>View</button>
                      {o.status === 'Draft' && canWrite && (
                        <>
                          <button type="button" className="link-btn link-btn--good" title="Confirms the order and deducts stock" onClick={() => updateStatus(o.id, 'Confirmed')}>Confirm</button>
                          <button type="button" className="link-btn link-btn--bad" onClick={() => setPendingCancel({ id: o.id, number: o.order_number, status: o.status })}>Cancel</button>
                        </>
                      )}
                      {o.status === 'Confirmed' && canWrite && (
                        <button type="button" className="link-btn link-btn--bad" onClick={() => setPendingCancel({ id: o.id, number: o.order_number, status: o.status })}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {showCreate && (
        <Sheet
          title="Create order"
          size="lg"
          onClose={() => setShowCreate(false)}
          dismissOnBackdrop={false}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="button" className="btn" onClick={() => handleCreate('Draft')} disabled={!selectedCustomer || items.length === 0}>
                Save as draft
              </button>
              <button type="button" className="btn btn--confirm" onClick={() => handleCreate('Confirmed')} disabled={!selectedCustomer || items.length === 0}>
                Confirm and deduct stock
              </button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="oc-customer">Customer</label>
            <select id="oc-customer" className="select" value={selectedCustomer} onChange={(e) => setSelectedCustomer(parseInt(e.target.value))}>
              <option value={0}>Select a customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.business_name ? `(${c.business_name})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="add-line">
            <div className="field">
              <label htmlFor="oc-product">Add a product</label>
              <select id="oc-product" className="select" value={addProductId} onChange={(e) => setAddProductId(parseInt(e.target.value))}>
                <option value={0}>Select product</option>
                {products.filter(p => !items.find(i => i.product_id === p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}), {p.current_stock} in stock, {formatPrice(p.unit_price)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="oc-qty">Quantity</label>
              <input id="oc-qty" className="input" type="number" min="1" value={addQuantity} onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)} />
            </div>
            <button type="button" className="btn" onClick={addItem} disabled={!addProductId}>Add line</button>
          </div>

          {items.length > 0 ? (
            <>
              <div className="table-wrap lines">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Rate</th>
                      <th className="num">Qty</th>
                      <th className="num">Amount</th>
                      <th><span className="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product_id}>
                        <td>
                          {item.product_name}
                          {item.quantity > item.max_stock && <span className="hint hint--bad hint--block">Only {item.max_stock} in stock</span>}
                        </td>
                        <td className="num">{formatPrice(item.product_price)}</td>
                        <td className="num">
                          <input
                            className="input input--qty"
                            type="number"
                            min="1"
                            max={item.max_stock}
                            value={item.quantity}
                            aria-label={`Quantity for ${item.product_name}`}
                            onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="num"><strong>{formatPrice(item.quantity * item.product_price)}</strong></td>
                        <td className="actions">
                          <button type="button" className="link-btn link-btn--bad" onClick={() => removeItem(item.product_id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sum">
                <div className="sum__left">
                  <span>{plural(items.length, 'line')}</span>
                  <span>{totalQuantity} units</span>
                  {overStock.length > 0 && <span className="hint hint--bad">{plural(overStock.length, 'line')} above current stock</span>}
                </div>
                <div className="sum__total">
                  <span>Total</span>
                  <strong>{formatPrice(totalAmount)}</strong>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">No lines yet. Pick a product above and set a quantity.</p>
          )}
        </Sheet>
      )}

      {showDetail && (
        <Sheet
          title={showDetail.order_number}
          subtitle={<StatusMark value={showDetail.status} />}
          size="lg"
          printable
          onClose={() => setShowDetail(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => window.print()}>Print order</button>
              {canWrite && showDetail.status === 'Draft' && (
                <>
                  <button type="button" className="btn btn--danger" onClick={() => setPendingCancel({ id: showDetail.id, number: showDetail.order_number, status: showDetail.status })}>Cancel order</button>
                  <button type="button" className="btn btn--confirm" onClick={() => updateStatus(showDetail.id, 'Confirmed')}>Confirm and deduct stock</button>
                </>
              )}
              {canWrite && showDetail.status === 'Confirmed' && (
                <button type="button" className="btn btn--danger" onClick={() => setPendingCancel({ id: showDetail.id, number: showDetail.order_number, status: showDetail.status })}>Cancel and restore stock</button>
              )}
            </>
          }
        >
          <div className="docket">
            <div className="docket__parties">
              <section>
                <h3 className="docket__h">Customer</h3>
                <p className="docket__name">{showDetail.customer_name}</p>
                {showDetail.customer_business && <p>{showDetail.customer_business}</p>}
                {showDetail.customer_address && <p>{showDetail.customer_address}</p>}
                {showDetail.customer_mobile && <p>{showDetail.customer_mobile}</p>}
                {showDetail.customer_gst && <p>GST {showDetail.customer_gst}</p>}
              </section>
              <section>
                <h3 className="docket__h">Order</h3>
                <dl className="docket__meta">
                  <div><dt>Order no.</dt><dd className="ref">{showDetail.order_number}</dd></div>
                  <div><dt>Date</dt><dd>{formatDateTime(showDetail.created_at)}</dd></div>
                  <div><dt>Created by</dt><dd>{showDetail.created_by_name}</dd></div>
                </dl>
              </section>
            </div>

            <div className="table-wrap">
              <table className="table docket__items">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Rate</th>
                    <th className="num">Qty</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {showDetail.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name_snapshot}</td>
                      <td className="num">{formatPrice(item.product_price_snapshot)}</td>
                      <td className="num">{item.quantity}</td>
                      <td className="num"><strong>{formatPrice(item.quantity * item.product_price_snapshot)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td className="num">{showDetail.total_quantity}</td>
                    <td className="num">{formatPrice(detailTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="hint hint--block no-print">Rates are the prices on the day the order was raised.</p>

            <div className="docket__sign print-only">
              <div><span>Prepared by</span></div>
              <div><span>Received by</span></div>
            </div>
          </div>
        </Sheet>
      )}

      {pendingCancel && (
        <Confirm
          title={`Cancel ${pendingCancel.number}?`}
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          busy={cancelling}
          onConfirm={confirmCancel}
          onCancel={() => setPendingCancel(null)}
        >
          {pendingCancel.status === 'Confirmed'
            ? 'The quantities on this order go back into stock. The order stays on record as cancelled.'
            : 'This draft will be marked as cancelled. No stock changes.'}
        </Confirm>
      )}
    </div>
  );
}
