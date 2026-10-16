import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import LogoIcon from '../components/LogoIcon';

// What each role can open, taken from the route guards in App.tsx.
const testAccounts = [
  { role: 'Admin', email: 'admin@erp.com', password: 'Admin@123', opens: 'Every screen, every action' },
  { role: 'Sales', email: 'sales@erp.com', password: 'Sales@123', opens: 'Customers and orders. Products are read-only' },
  { role: 'Warehouse', email: 'warehouse@erp.com', password: 'Warehouse@123', opens: 'Products and stock movements' },
  { role: 'Accounts', email: 'accounts@erp.com', password: 'Accounts@123', opens: 'Customers, products and orders, read-only' },
];

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

  return (
    <div className="login">
      <main className="login__main">
        <form className="login__form" onSubmit={handleSubmit}>
          <h1 className="login__title">Sign in</h1>
          <p className="login__lede">Use the email and password for your ERP + CRM account.</p>

          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>

      <aside className="login__aside" aria-labelledby="test-accounts">
        <div className="brand brand--static">
          <LogoIcon size={30} />
          <span>ERP Portal</span>
        </div>

        <div>
          <h2 id="test-accounts" className="login__aside-title">Test accounts</h2>
          <p className="login__aside-lede">Choose a role to fill in its credentials.</p>
          <ul className="roles">
            {testAccounts.map((acc) => (
              <li key={acc.role}>
                <button
                  type="button"
                  className="roles__btn"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                >
                  <span className="roles__name">{acc.role}</span>
                  <span className="roles__opens">{acc.opens}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
