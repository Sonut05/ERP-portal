import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { useToast } from '../hooks/useToast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        toast.show('error', 'Please enter your current password to update password');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.show('error', 'New password and confirm password do not match');
        return;
      }
      if (newPassword.length < 6) {
        toast.show('error', 'New password must be at least 6 characters long');
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
      toast.show('success', 'Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.show('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">Account settings</h1>
          <p className="page-meta">{user?.name}, signed in as {user?.role}</p>
        </div>
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="setting">
          <div className="setting__intro">
            <h2 className="section-title">Your details</h2>
            <p className="muted">Shown to colleagues on orders and stock records.</p>
          </div>
          <div className="setting__body">
            <div className="field-row">
              <div className="field">
                <label htmlFor="pr-name">Full name</label>
                <input id="pr-name" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="pr-email">Email address</label>
                <input id="pr-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="pr-mobile">Mobile number</label>
                <input id="pr-mobile" type="text" inputMode="tel" className="input" placeholder="+91 98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pr-role">Role</label>
                <input id="pr-role" type="text" className="input" value={user?.role || ''} disabled />
                <span className="hint">Only an admin can change this.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="setting">
          <div className="setting__intro">
            <h2 className="section-title">Password</h2>
            <p className="muted">Leave these blank to keep your current password.</p>
          </div>
          <div className="setting__body">
            <div className="field">
              <label htmlFor="pr-current">Current password</label>
              <input id="pr-current" type="password" className="input" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="pr-new">New password</label>
                <input id="pr-new" type="password" className="input" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <span className="hint">At least 6 characters.</span>
              </div>
              <div className="field">
                <label htmlFor="pr-confirm">Confirm new password</label>
                <input id="pr-confirm" type="password" className="input" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
