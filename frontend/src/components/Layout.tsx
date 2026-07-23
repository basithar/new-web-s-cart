import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert } from 'lucide-react';

const Layout: React.FC = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  const { notifications, dismissNotification } = useSocket();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`min-h-screen bg-theme-bg text-theme-text flex transition-colors duration-300 relative ${
      cart?.weightMismatch ? 'theft-alarm-active' : ''
    }`}>
      {/* Collapsible Sidebar (only for logged-in users) */}
      {user && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}

      {/* Main Kiosk panel */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        user ? (collapsed ? 'pl-0 md:pl-20' : 'pl-0 md:pl-64') : 'pl-0'
      }`}>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content Area with compensating padding to prevent overlap with fixed navbar */}
        <main className="flex-1 pt-28 sm:pt-24 px-3 sm:px-6 pb-6 md:px-8 md:pb-8 bg-theme-bg text-theme-text">
          {/* Dashboard Wrapper Container */}
          <div className="dashboard-container max-w-6xl mx-auto h-full relative z-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Real-time Toast Notifications stack (Top Right) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-2xl shadow-xl border flex gap-3 items-start backdrop-blur-lg animate-slide-in ${
              notif.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/20 border-rose-500/30 text-rose-800 dark:text-rose-200'
                : notif.type === 'warning'
                ? 'bg-amber-50/95 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50/95 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {notif.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            <div className="flex-1 text-left">
              <h5 className="text-xs font-bold leading-tight">{notif.title}</h5>
              <p className="text-[11px] mt-0.5 opacity-90 leading-snug">{notif.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Layout;
