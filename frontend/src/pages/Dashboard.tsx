import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, Product } from '../types';
import StatusMark from '../components/StatusMark';
import { Empty, TableSkeleton } from '../components/TableState';
import { formatDate, formatLongDate } from '../lib/format';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { hasRole } = useAuth();

  const canSeeOrders = hasRole('Admin', 'Sales', 'Accounts');
  const canSeeCustomers = hasRole('Admin', 'Sales', 'Accounts');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
    // The shortlist of what is actually running low uses the existing products endpoint.
    try {
      const res = await productsApi.getAll({ lowStock: true, limit: 8 });
      setLowStock(res.data.data);
    } catch (err) {
      console.error('Failed to load low stock list:', err);
    }
  };

  const drafts = stats?.orders?.drafts || 0;
  const lowCount = stats?.products?.lowStock || 0;
  const leads = stats?.customers?.leads || 0;

  const attention = [
    {
      count: drafts,
      text: drafts === 1 ? 'draft order is waiting to be confirmed' : 'draft orders are waiting to be confirmed',
      to: canSeeOrders ? '/orders' : null,
      cta: 'Review orders',
    },
    {
      count: lowCount,
      text: lowCount === 1 ? 'product is at or below its minimum stock' : 'products are at or below their minimum stock',
      to: '/products',
      cta: 'See products',
    },
    {
      count: leads,
      text: leads === 1 ? 'customer is still a lead' : 'customers are still leads',
      to: canSeeCustomers ? '/customers' : null,
      cta: 'Open customers',
    },
  ].filter((a) => a.count > 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-meta">{formatLongDate()}</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : failed || !stats ? (
        <div className="ledger">
          <Empty
            title="The figures didn’t load"
            action={
              <button type="button" className="btn" onClick={loadStats}>
                Try again
              </button>
            }
          >
            Check your connection, then try again.
          </Empty>
        </div>
      ) : (
        <>
          <section aria-labelledby="attention-h" className="block">
            <h2 id="attention-h" className="section-title">Needs attention</h2>
            {attention.length === 0 ? (
              <p className="all-clear">Nothing is waiting on you. No drafts, no low stock, no open leads.</p>
            ) : (
              <ul className="attention">
                {attention.map((a) => (
                  <li key={a.cta} className="attention__row">
                    <span className="attention__count">{a.count}</span>
                    <span className="attention__text">{a.text}</span>
                    {a.to && (
                      <Link to={a.to} className="link-btn">
                        {a.cta}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Totals" className="totals block">
            <div className="totals__col">
              <div className="totals__label">Customers</div>
              <div className="totals__value">{stats.customers?.total || 0}</div>
              <div className="totals__detail">
                {stats.customers?.active || 0} active, {leads} leads
              </div>
            </div>
            <div className="totals__col">
              <div className="totals__label">Products</div>
              <div className="totals__value">{stats.products?.total || 0}</div>
              <div className="totals__detail">{lowCount} below minimum</div>
            </div>
            <div className="totals__col">
              <div className="totals__label">Sales orders</div>
              <div className="totals__value">{stats.orders?.total || 0}</div>
              <div className="totals__detail">
                {stats.orders?.confirmed || 0} confirmed, {drafts} drafts
              </div>
            </div>
          </section>

          <div className="split">
            <section aria-labelledby="recent-h">
              <h2 id="recent-h" className="section-title">Recent sales orders</h2>
              <div className="ledger">
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="table-wrap">
                    <table className="table table--stack">
                      <thead>
                        <tr>
                          <th>Order no.</th>
                          <th>Customer</th>
                          <th className="num">Qty</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map((order) => (
                          <tr key={order.id} className={order.status === 'Cancelled' ? 'is-void' : ''}>
                            <td data-label="Order no." className="ref">
                              {canSeeOrders ? <Link to="/orders" className="ref-link">{order.order_number}</Link> : order.order_number}
                            </td>
                            <td data-label="Customer">{order.customer_name}</td>
                            <td data-label="Qty" className="num">{order.total_quantity}</td>
                            <td data-label="Status"><StatusMark value={order.status} /></td>
                            <td data-label="Date">{formatDate(order.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty title="No orders yet">Orders appear here as soon as the first one is raised.</Empty>
                )}
              </div>
            </section>

            <section aria-labelledby="low-h">
              <h2 id="low-h" className="section-title">Running low</h2>
              <div className="ledger">
                {lowStock.length > 0 ? (
                  <ul className="lowlist">
                    {lowStock.map((p) => {
                      const ratio = p.min_stock_alert > 0 ? Math.min(100, Math.round((p.current_stock / p.min_stock_alert) * 100)) : 0;
                      return (
                        <li key={p.id} className="lowlist__row">
                          <div className="lowlist__top">
                            <span className="lowlist__name">{p.name}</span>
                            <span className="lowlist__qty">
                              <strong>{p.current_stock}</strong> of {p.min_stock_alert}
                            </span>
                          </div>
                          <div className="gauge" aria-hidden="true">
                            <span style={{ width: `${ratio}%` }} />
                          </div>
                          <div className="lowlist__meta">
                            {p.sku}
                            {p.location ? `, ${p.location}` : ''}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <Empty title="Nothing is below its minimum">Every product is above its alert level.</Empty>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
