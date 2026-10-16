import { useState, useEffect, useRef, type FormEvent } from 'react';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import Sheet from '../components/Sheet';
import Pagination from '../components/Pagination';
import StatusMark from '../components/StatusMark';
import { Empty, TableSkeleton } from '../components/TableState';
import { formatDate, plural } from '../lib/format';

const emptyForm = {
  name: '', mobile: '', email: '', business_name: '', gst_no: '',
  type: 'Retail', address: '', status: 'Lead', follow_up_date: '', notes: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const toast = useToast();
  const { hasRole } = useAuth();
  const latestRequest = useRef(0);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadCustomers();
  }, [page, search, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const res = await customersApi.getAll({ page, limit: 10, search, status: statusFilter, type: typeFilter });
      if (requestId !== latestRequest.current) return; // a newer search has already replaced this one
      setCustomers(res.data.data);
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
      if (editCustomer) {
        await customersApi.update(editCustomer.id, form);
        toast.show('success', 'Customer updated successfully');
      } else {
        await customersApi.create(form);
        toast.show('success', 'Customer created successfully');
      }
      setShowModal(false);
      setEditCustomer(null);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Operation failed');
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
      toast.show('success', 'Note added');
      loadCustomers();
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed to add note');
    }
  };

  const resetForm = () => setForm(emptyForm);

  const openCreate = () => {
    setEditCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditCustomer(null);
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await customersApi.getById(id);
      setShowDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = hasRole('Admin', 'Sales');
  const filtered = Boolean(searchInput || statusFilter || typeFilter);
  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-meta">{loading && customers.length === 0 ? ' ' : filtered ? `${plural(total, 'match', 'matches')}` : plural(total, 'customer')}</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            Add customer
          </button>
        )}
      </div>

      <div className="filters" role="search">
        <div className="field field--grow">
          <label htmlFor="c-search">Search</label>
          <input
            id="c-search"
            className="input"
            type="search"
            placeholder="Name, business, mobile"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <div className="field">
          <label htmlFor="c-status">Status</label>
          <select id="c-status" className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="c-type">Type</label>
          <select id="c-type" className="select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
        {filtered && (
          <button type="button" className="link-btn filters__clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="ledger" aria-busy={loading}>
        {loading && customers.length === 0 ? (
          <TableSkeleton />
        ) : customers.length === 0 ? (
          <Empty
            title={filtered ? 'No customers match these filters' : 'No customers yet'}
            action={
              filtered ? (
                <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
              ) : canEdit ? (
                <button type="button" className="btn btn--primary" onClick={openCreate}>Add the first customer</button>
              ) : undefined
            }
          />
        ) : (
          <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td data-label="" className="primary-cell">
                      <button type="button" className="link-btn link-btn--strong" onClick={() => viewDetail(c.id)}>{c.name}</button>
                    </td>
                    <td data-label="Business">{c.business_name || '—'}</td>
                    <td data-label="Mobile">{c.mobile || '—'}</td>
                    <td data-label="Type">{c.type}</td>
                    <td data-label="Status"><StatusMark value={c.status} /></td>
                    <td data-label="Follow-up">{formatDate(c.follow_up_date)}</td>
                    <td data-label="" className="actions">
                      <button type="button" className="link-btn" onClick={() => viewDetail(c.id)}>View</button>
                      {canEdit && (
                        <button type="button" className="link-btn" onClick={() => handleEdit(c)}>Edit</button>
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

      {showModal && (
        <Sheet
          title={editCustomer ? 'Edit customer' : 'Add customer'}
          onClose={closeForm}
          dismissOnBackdrop={false}
          onSubmit={handleSubmit}
          footer={
            <>
              <button type="button" className="btn" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn--primary">{editCustomer ? 'Save changes' : 'Create customer'}</button>
            </>
          }
        >
          <div className="field-row">
            <div className="field">
              <label htmlFor="f-name">Customer name <span className="req">(required)</span></label>
              <input id="f-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="f-mobile">Mobile</label>
              <input id="f-mobile" className="input" inputMode="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="f-email">Email</label>
              <input id="f-email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="f-biz">Business name</label>
              <input id="f-biz" className="input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="f-gst">GST number</label>
              <input id="f-gst" className="input" value={form.gst_no} onChange={(e) => setForm({ ...form, gst_no: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="f-type">Customer type</label>
              <select id="f-type" className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-address">Address</label>
            <textarea id="f-address" className="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="f-status">Status</label>
              <select id="f-status" className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-follow">Follow-up date</label>
              <input id="f-follow" className="input" type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-notes">Notes</label>
            <textarea id="f-notes" className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Sheet>
      )}

      {showDetail && (
        <Sheet
          title={showDetail.name}
          subtitle={<StatusMark value={showDetail.status} />}
          onClose={() => setShowDetail(null)}
          footer={
            canEdit ? (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const c = showDetail;
                  setShowDetail(null);
                  handleEdit(c);
                }}
              >
                Edit customer
              </button>
            ) : undefined
          }
        >
          <section className="facts">
            <h3 className="facts__title">Contact</h3>
            <dl>
            <div className="facts__row"><dt>Mobile</dt><dd>{showDetail.mobile || '—'}</dd></div>
            <div className="facts__row"><dt>Email</dt><dd>{showDetail.email || '—'}</dd></div>
            <div className="facts__row"><dt>Address</dt><dd>{showDetail.address || '—'}</dd></div>
          </dl>
          </section>

          <section className="facts">
            <h3 className="facts__title">Business</h3>
            <dl>
            <div className="facts__row"><dt>Business</dt><dd>{showDetail.business_name || '—'}</dd></div>
            <div className="facts__row"><dt>GST</dt><dd>{showDetail.gst_no || '—'}</dd></div>
            <div className="facts__row"><dt>Type</dt><dd>{showDetail.type}</dd></div>
            <div className="facts__row"><dt>Follow-up</dt><dd>{formatDate(showDetail.follow_up_date)}</dd></div>
            </dl>
          </section>

          <h3 className="facts__title">Follow-up notes</h3>
          {showDetail.notes ? (
            <div className="notes">
              {showDetail.notes.split('\n\n').map((note, i) => (
                <p key={i} className="note">{note}</p>
              ))}
            </div>
          ) : (
            <p className="muted">No notes yet.</p>
          )}
          {canEdit && (
            <form onSubmit={handleAddNote} className="inline-form">
              <label className="sr-only" htmlFor="new-note">New follow-up note</label>
              <input id="new-note" className="input" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="What happened on the last call?" />
              <button type="submit" className="btn" disabled={!newNote.trim()}>Add note</button>
            </form>
          )}
        </Sheet>
      )}
    </div>
  );
}
