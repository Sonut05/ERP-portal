import { useState, useEffect, type FormEvent } from 'react';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', business_name: '', gst_no: '',
    type: 'Retail', address: '', status: 'Lead', follow_up_date: '', notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [page, search, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll({ page, limit: 10, search, status: statusFilter, type: typeFilter });
      setCustomers(res.data.data);
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
      if (editCustomer) {
        await customersApi.update(editCustomer.id, form);
        showToast('success', 'Customer updated successfully');
      } else {
        await customersApi.create(form);
        showToast('success', 'Customer created successfully');
      }
      setShowModal(false);
      setEditCustomer(null);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name, mobile: customer.mobile || '', email: customer.email || '',
      business_name: customer.business_name || '', gst_no: customer.gst_no || '',
      type: customer.type, address: customer.address || '', status: customer.status,
      follow_up_date: customer.follow_up_date?.split('T')[0] || '', notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!showDetail || !newNote.trim()) return;
    try {
      const res = await customersApi.addNote(showDetail.id, newNote);
      setShowDetail(res.data.data);
      setNewNote('');
      showToast('success', 'Note added');
      loadCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add note');
    }
  };

  const resetForm = () => {
    setForm({ name: '', mobile: '', email: '', business_name: '', gst_no: '', type: 'Retail', address: '', status: 'Lead', follow_up_date: '', notes: '' });
  };

  const openCreate = () => {
    setEditCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await customersApi.getById(id);
      setShowDetail(res.data.data);
    } catch (err) {
      console.error(err);
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
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer relationships</p>
        </div>
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Lead">Lead</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select className="form-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ cursor: 'pointer', color: '#818cf8' }} onClick={() => viewDetail(c.id)}>{c.name}</td>
                    <td>{c.business_name || '—'}</td>
                    <td>{c.mobile || '—'}</td>
                    <td><span className={`badge badge-${c.type.toLowerCase()}`}>{c.type}</span></td>
                    <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                    <td>{c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => viewDetail(c.id)}>👁️</button>
                        {hasRole('Admin', 'Sales') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">No customers found</div></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input className="form-input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input className="form-input" value={form.gst_no} onChange={(e) => setForm({ ...form, gst_no: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Type *</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input className="form-input" type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{showDetail.name}</h2>
              <button className="modal-close" onClick={() => setShowDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section glass-card-static">
                  <h3>Contact Info</h3>
                  <div className="detail-row"><span className="detail-label">Mobile</span><span className="detail-value">{showDetail.mobile || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{showDetail.email || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">Address</span><span className="detail-value">{showDetail.address || '—'}</span></div>
                </div>
                <div className="detail-section glass-card-static">
                  <h3>Business Info</h3>
                  <div className="detail-row"><span className="detail-label">Business</span><span className="detail-value">{showDetail.business_name || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">GST</span><span className="detail-value">{showDetail.gst_no || '—'}</span></div>
                  <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value"><span className={`badge badge-${showDetail.type.toLowerCase()}`}>{showDetail.type}</span></span></div>
                  <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge badge-${showDetail.status.toLowerCase()}`}>{showDetail.status}</span></span></div>
                  <div className="detail-row"><span className="detail-label">Follow-up</span><span className="detail-value">{showDetail.follow_up_date ? new Date(showDetail.follow_up_date).toLocaleDateString() : '—'}</span></div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8', marginBottom: '12px' }}>Follow-up Notes</h3>
                <div className="notes-list">
                  {showDetail.notes ? (
                    showDetail.notes.split('\n\n').map((note, i) => (
                      <div key={i} className="note-item">{note}</div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ padding: '16px' }}>No notes yet</div>
                  )}
                </div>
                {hasRole('Admin', 'Sales') && (
                  <form onSubmit={handleAddNote} className="note-add-form">
                    <input className="form-input" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a follow-up note..." />
                    <button type="submit" className="btn btn-primary">Add</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
