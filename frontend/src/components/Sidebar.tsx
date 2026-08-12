import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoIcon from './LogoIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { path: '/customers', icon: '👥', label: 'Customers', roles: ['Admin', 'Sales', 'Accounts'] },
    { path: '/products', icon: '📦', label: 'Products', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { path: '/stock', icon: '🏭', label: 'Stock Movements', roles: ['Admin', 'Warehouse'] },
    { path: '/orders', icon: '📋', label: 'Sales Orders', roles: ['Admin', 'Sales', 'Accounts'] },
  ];

  return (
    <>
      <button className="hamburger" onClick={() => onClose()}>
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: 'none', boxShadow: 'none' }}>
            <LogoIcon size={38} />
          </div>
          <h1>ERP Portal</h1>
        </div>

        <div className="sidebar-section-title">Navigation</div>

        <nav className="sidebar-nav">
          {navItems.map((item) =>
            hasRole(...item.roles) ? (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => onClose()}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ) : null
          )}
        </nav>

        <div
          className="sidebar-user"
          onClick={() => {
            navigate('/profile');
            onClose();
          }}
          style={{ cursor: 'pointer' }}
          title="View Account Settings"
        >
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            className="logout-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            title="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
