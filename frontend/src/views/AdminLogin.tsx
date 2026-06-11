import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Mail, Lock, Key, ShieldAlert, LogIn } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const { login, loginAsMock } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.includes('admin')) {
        throw new Error('This login screen is for Admin access only.');
      }
      await login(email, password);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Authentication failed. Invalid Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsMock('admin');
    } catch (err: any) {
      setError('Connection failed. Admin profile could not load.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center relative overflow-hidden px-4 text-theme-text transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supermarket Store Management Portal</p>
        </div>

        {/* Auth Panel */}
        <div className="glass-panel rounded-3xl p-8 shadow-xl space-y-5 text-left border border-violet-500/15">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white pb-1 border-b border-theme-border uppercase tracking-wider">
            🛡️ Store Manager Login
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@smartcart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-theme-text"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secret Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-theme-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-750 active:scale-[0.98] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authorizing...' : 'Sign In as Admin'}
            </button>
          </form>

          {/* Quick Mock Bypass */}
          <div className="pt-4 border-t border-theme-border space-y-3 mt-2">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Key className="w-3.5 h-3.5 text-violet-500" /> Manager Demo Bypass
            </p>
            <button
              onClick={handleMockAdminLogin}
              className="w-full py-3 rounded-xl border border-theme-border bg-theme-bg hover:bg-slate-100 dark:hover:bg-slate-850/50 text-xs font-bold text-theme-text transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
            >
              <span>🛡️ Quick Admin Bypass</span>
              <span className="text-[9px] text-violet-500 font-medium">admin@smartcart.com (Admin123)</span>
            </button>
            <div className="text-center">
              <a
                href="/login"
                className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 underline"
              >
                Go to Shopper Portal Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
