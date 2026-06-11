import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Wallet, ShoppingCart, CreditCard, User, LogOut, 
  LayoutDashboard, Settings, Users, Receipt, Radio, Cpu, Server,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Determine sidebar items based on role
  const customerItems = [
    { name: 'Home Portal', path: '/', icon: Home },
    { name: 'Budget Setup', path: '/budget-setup', icon: Wallet },
    { name: 'Shopping Cart', path: '/shopping', icon: ShoppingCart },
    { name: 'Checkout', path: '/checkout', icon: CreditCard },
    { name: 'User Profile', path: '/profile', icon: User },
  ];

  const adminItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Product Management', path: '/admin/products', icon: Settings },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Transactions', path: '/admin/transactions', icon: Receipt },
    { name: 'RFID Management', path: '/admin/rfid', icon: Radio },
    { name: 'ESP32 Monitoring', path: '/admin/esp32', icon: Cpu },
    { name: 'Database Management', path: '/admin/db', icon: Server },
  ];

  const navItems = user.role === 'admin' ? adminItems : customerItems;

  return (
    <aside className={`glass-panel border-r border-theme-border flex flex-col justify-between h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="flex flex-col">
        {/* Logo Header */}
        <div className="p-5 border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-extrabold text-sm text-theme-text leading-none">Smart Cart</h1>
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                  {user.role === 'admin' ? 'Store Console' : 'Kiosk Assistant'}
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-theme-bg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className="p-4 mx-4 mt-5 rounded-2xl bg-theme-bg border border-theme-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs text-theme-text truncate">{user.name}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">{user.role} Account</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="mt-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            // For dashboard, we want exact path matching to prevent highlighting everything starting with /admin
            const isDashboard = item.path === '/admin';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={isDashboard}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                      : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
