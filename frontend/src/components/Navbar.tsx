import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, Search, Cpu, LogOut, User, ShoppingCart, LogIn, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface NavbarProps {
  collapsed: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { esp32Status, cart } = useCart();
  const { user, logout } = useAuth();
  const { notifications, dismissNotification } = useSocket();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <header className={`h-32 sm:h-24 glass-panel border-b border-theme-border fixed top-0 right-0 z-[1000] flex flex-col sm:flex-row items-center justify-center sm:justify-between px-4 sm:px-6 md:px-8 py-2 sm:py-0 gap-2 sm:gap-0 transition-all duration-300 ${
      user ? (collapsed ? 'left-20' : 'left-64') : 'left-0'
    }`}>
      {/* Brand Logo & Controls wrapper for mobile layout */}
      <div className="flex items-center justify-between w-full sm:contents">
        {/* Brand Logo (only visible to logged out guests, since sidebar is hidden) */}
        {!user && (
          <div className="flex items-center gap-2 cursor-pointer mr-2 shrink-0" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xs text-theme-text hidden sm:inline tracking-tight">Smart Cart</span>
          </div>
        )}

        {/* Responsive Desktop/Tablet Header Aligned Search Bar */}
        <div className="hidden sm:block relative w-full sm:max-w-[400px] lg:max-w-[500px] mx-1.5 sm:mx-4">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-theme-bg border border-theme-border focus:outline-none focus:border-emerald-500 text-xs text-theme-text shadow-sm"
          />
        </div>

        <div className="md:hidden font-extrabold text-xs text-emerald-500 hidden">
          Smart Kiosk
        </div>

        {/* Control Actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Admin-only ESP32 Status Badge */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/esp32')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                esp32Status?.connected 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-theme-bg text-slate-400 border-theme-border'
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${esp32Status?.connected ? 'animate-pulse text-emerald-500' : ''}`} />
              <span className="hidden lg:inline">ESP32 Monitor:</span>
              <span>{esp32Status?.connected ? 'Connected' : 'Offline'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${esp32Status?.connected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            </button>
          )}

          {/* Customer-only Cart icon with badge count */}
          {user?.role === 'customer' && (
            <button
              onClick={() => navigate('/shopping')}
              className="relative w-10 h-10 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors shadow-sm"
              title="View Cart"
            >
              <ShoppingCart className="w-4.5 h-4.5 text-emerald-500" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-md animate-bounce-slow">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Switcher Toggle button with clear label */}
          <button
            onClick={toggleTheme}
            className="px-3 py-2 rounded-xl bg-theme-bg border border-theme-border text-[10px] md:text-xs font-bold flex items-center gap-1.5 hover:bg-slate-105 dark:hover:bg-slate-850/60 transition-all shadow-sm text-slate-650 dark:text-slate-350"
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Notifications and User Avatar (Only when logged in) */}
          {user ? (
            <>
              {/* Notifications Alert Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-xl bg-theme-bg border border-theme-border text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors shadow-sm"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl shadow-xl border border-theme-border overflow-hidden z-50">
                    <div className="p-4 border-b border-theme-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                      <h4 className="font-bold text-xs text-theme-text">Live System Alerts</h4>
                      <span className="text-[9px] bg-theme-bg border border-theme-border px-2 py-0.5 rounded-full font-bold text-slate-500">
                        {notifications.length} new
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-theme-border">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium">
                          No active scanning pings or warnings.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-slate-100/30 dark:hover:bg-slate-900/20 flex flex-col gap-0.5 text-left">
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] font-bold ${
                                n.type === 'error' ? 'text-rose-500' :
                                n.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {n.title}
                              </span>
                              <span className="text-[8px] text-slate-400">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-normal font-medium">{n.message}</p>
                            <button
                              onClick={() => dismissNotification(n.id)}
                              className="text-[9px] text-slate-400 dark:text-slate-500 hover:text-emerald-500 font-bold underline mt-1 text-left"
                            >
                              Dismiss
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar trigger */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shadow-md border border-emerald-500/20"
                >
                  {user.name.charAt(0)}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-48 glass-panel rounded-2xl shadow-xl border border-theme-border overflow-hidden z-50 py-1.5 text-xs text-theme-text">
                    <div className="px-4 py-2 border-b border-theme-border bg-slate-50/40 dark:bg-slate-900/40 mb-1">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className="text-[9px] text-slate-400 truncate capitalize">{user.role} Account</p>
                    </div>
                    {user.role === 'customer' ? (
                      <NavLink
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-left font-bold"
                      >
                        <User className="w-4 h-4 text-slate-400" /> My Profile
                      </NavLink>
                    ) : (
                      <NavLink
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-left font-bold"
                      >
                        <Settings className="w-4 h-4 text-slate-400" /> Store Manager
                      </NavLink>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-rose-500/10 hover:text-rose-500 text-left font-bold border-t border-theme-border mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" /> Shopper Login
              </button>
              
              <button
                onClick={() => navigate('/admin-login')}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 hidden sm:inline-flex"
              >
                🛡️ Admin
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Responsive Mobile Header Aligned Search Bar */}
      <div className="sm:hidden relative w-full pb-1">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-theme-bg border border-theme-border focus:outline-none focus:border-emerald-500 text-xs text-theme-text shadow-sm"
        />
      </div>
    </header>
  );
};

export default Navbar;
