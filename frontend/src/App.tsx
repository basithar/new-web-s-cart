import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

// Views
import Home from './views/Home';
import Login from './views/Login';
import AdminLogin from './views/AdminLogin';
import BudgetSetup from './views/BudgetSetup';
import Shopping from './views/Shopping';
import ESP32Connection from './views/ESP32Connection';
import Checkout from './views/Checkout';
import Success from './views/Success';
import Profile from './views/Profile';
import Admin from './views/Admin';

// Shell Layout
import Layout from './components/Layout';

// --- ROUTE GUARD WRAPPERS ---

interface GuardProps {
  children: React.ReactElement;
}

// Only guests (not logged in) can see Login/Register/AdminLogin
const GuestRoute: React.FC<GuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/shopping" replace />;
    }
  }

  return children;
};

// Customer-only pages
const CustomerRoute: React.FC<GuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'customer') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Admin-only pages
const AdminRoute: React.FC<GuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/shopping" replace />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Initializing Kiosk Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Standalone Kiosk Presentation Demo views */}
      <Route path="/presentation" element={<Home />} />
      <Route path="/demo" element={<Home />} />

      <Route element={<Layout />}>
        {/* Public Portal Landing */}
        <Route path="/" element={<Home />} />

        {/* Guest Gates */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/admin-login" element={<GuestRoute><AdminLogin /></GuestRoute>} />

        {/* Customer Protected Flow */}
        <Route path="/budget-setup" element={<CustomerRoute><BudgetSetup /></CustomerRoute>} />
        <Route path="/shopping" element={<CustomerRoute><Shopping /></CustomerRoute>} />
        <Route path="/checkout" element={<CustomerRoute><Checkout /></CustomerRoute>} />
        <Route path="/success" element={<CustomerRoute><Success /></CustomerRoute>} />
        <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />

        {/* Admin Protected Console */}
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/transactions" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/sessions" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/rfid" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/esp32" element={<AdminRoute><ESP32Connection /></AdminRoute>} />
        <Route path="/admin/db" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/esp32" element={<Navigate to="/admin/esp32" replace />} />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
