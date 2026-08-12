import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    // Fetch latest user details on mount
    authApi.getMe().then((res) => {
      if (res.data?.data) {
        const u = res.data.data;
        setName(u.name || '');
        setEmail(u.email || '');
        setMobile(u.mobile || '');
        updateUser(u);
      }
    }).catch(console.error);
  }, []);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        showToast('error', 'Please enter your current password to update password');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('error', 'New password and confirm password do not match');
        return;
      }
      if (newPassword.length < 6) {
        showToast('error', 'New password must be at least 6 characters long');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await authApi.updateProfile({
        name,
        email,
        mobile,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      const updatedUser = res.data.data;
      updateUser(updatedUser);
      showToast('success', 'Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">View and update your profile information</p>
        </div>
        <button className="btn btn-secondary" onClick={handleGoBack}>
          ← Go Back
        </button>
      </div>

      {/* User Header Summary Card */}
      <div className="glass-card-static" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', marginBottom: '24px' }}>
        <div className="sidebar-user-avatar" style={{ width: '64px', height: '64px', fontSize: '1.6rem' }}>
          {user?.name?.charAt(0) || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>{user?.name}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>
        <div className="badge badge-wholesale" style={{ fontSize: '0.85rem', padding: '6px 14px', textTransform: 'uppercase' }}>
          {user?.role}
        </div>
      </div>

      {/* Profile Form Card */}
      <form onSubmit={handleSubmit} className="glass-card-static" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          Personal Information
        </h3>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Full Name / Username *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="+91 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role (Assigned)</label>
            <input
              type="text"
              className="form-input"
              value={user?.role || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginTop: '28px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          Update Password (Optional)
        </h3>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Required only if changing password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Leave blank to keep current"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '20px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
