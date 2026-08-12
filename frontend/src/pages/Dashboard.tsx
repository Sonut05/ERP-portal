import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your business operations</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card stat-card-purple" onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{stats?.customers?.total || 0}</div>
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-sub">
            <span>{stats?.customers?.active || 0}</span> active · <span>{stats?.customers?.leads || 0}</span> leads
          </div>
        </div>

        <div className="glass-card stat-card stat-card-cyan" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-value">{stats?.products?.total || 0}</div>
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-sub">
            <span style={{ color: stats?.products?.lowStock ? '#f59e0b' : undefined }}>
              {stats?.products?.lowStock || 0}
            </span> low stock alerts
          </div>
        </div>

        <div className="glass-card stat-card stat-card-green" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-value">{stats?.orders?.total || 0}</div>
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-sub">
            <span>{stats?.orders?.confirmed || 0}</span> confirmed · <span>{stats?.orders?.drafts || 0}</span> drafts
          </div>
        </div>

        <div className="glass-card stat-card stat-card-orange">
          <div className="stat-card-icon">⚠️</div>
          <div className="stat-card-value">{stats?.products?.lowStock || 0}</div>
          <div className="stat-card-label">Low Stock Alerts</div>
          <div className="stat-card-sub">
            Products below minimum threshold
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8' }}>Recent Sales Orders</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} onClick={() => navigate(`/orders`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace', color: '#818cf8' }}>{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.total_quantity}</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">No orders yet</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
