import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext.tsx';
import ProtectedRoute from './components/ProtectedRoute';
import Masthead from './components/Masthead';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import StockMovements from './pages/StockMovements';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Masthead open={menuOpen} onToggle={setMenuOpen} />
      <main id="main" className="page" tabIndex={-1}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute roles={['Admin', 'Sales', 'Accounts']}><Customers /></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute><Products /></ProtectedRoute>
          } />
          <Route path="/stock" element={
            <ProtectedRoute roles={['Admin', 'Warehouse']}><StockMovements /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute roles={['Admin', 'Sales', 'Accounts']}><Orders /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
