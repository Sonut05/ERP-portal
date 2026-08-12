import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import ThreeBackground from '../components/ThreeBackground';
import LogoIcon from '../components/LogoIcon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status ? `Server Error (${err.response.status}). Please try again.` : err.message || 'Login failed. Please check network connection.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = [
    { role: 'Admin', email: 'admin@erp.com', password: 'Admin@123' },
    { role: 'Sales', email: 'sales@erp.com', password: 'Sales@123' },
    { role: 'Warehouse', email: 'warehouse@erp.com', password: 'Warehouse@123' },
    { role: 'Accounts', email: 'accounts@erp.com', password: 'Accounts@123' },
  ];

  return (
    <>
      <ThreeBackground />
      <div className="login-page">
        <div className="login-card glass-card-static animate-slideUp">
          <div className="login-header">
            <div className="login-logo" style={{ background: 'none', boxShadow: 'none' }}>
              <LogoIcon size={56} />
            </div>
            <h1>ERP + CRM Portal</h1>
            <p>Sign in to your operations dashboard</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
              Quick Login (Test Accounts)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {testCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                  }}
                >
                  {cred.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
