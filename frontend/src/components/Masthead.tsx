import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoIcon from './LogoIcon';

interface MastheadProps {
  open: boolean;
  onToggle: (open: boolean) => void;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
  { path: '/customers', label: 'Customers', roles: ['Admin', 'Sales', 'Accounts'] },
  { path: '/products', label: 'Products', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
  { path: '/stock', label: 'Stock movements', roles: ['Admin', 'Warehouse'] },
  { path: '/orders', label: 'Sales orders', roles: ['Admin', 'Sales', 'Accounts'] },
];

export default function Masthead({ open, onToggle }: MastheadProps) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const close = () => onToggle(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="masthead no-print">
      <div className="masthead__bar">
        <NavLink to="/dashboard" className="brand" onClick={close}>
          <LogoIcon size={28} />
          <span>ERP Portal</span>
        </NavLink>

        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="masthead-panel"
          onClick={() => onToggle(!open)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <div id="masthead-panel" className={`masthead__panel ${open ? 'is-open' : ''}`}>
          <nav className="masthead__nav" aria-label="Primary">
            {NAV_ITEMS.map((item) =>
              hasRole(...item.roles) ? (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `navlink ${isActive ? 'is-active' : ''}`}
                  onClick={close}
                >
                  {item.label}
                </NavLink>
              ) : null,
            )}
          </nav>

          <div className="masthead__user">
            <NavLink to="/profile" className="who" onClick={close} title="Account settings">
              <span className="who__name">{user?.name}</span>
              <span className="who__role">{user?.role}</span>
            </NavLink>
            <button type="button" className="signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
