import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Mail, Lock, User, Key, ShieldAlert, LogIn, RefreshCcw } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register, loginAsMock, forgotPassword } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name.trim()) throw new Error('Full Name is required for registration.');
        await register(email, name, password, 'customer');
        setMessage('Registration successful!');
      } else if (authMode === 'signin') {
        await login(email, password);
      } else if (authMode === 'forgot') {
        await forgotPassword(email);
        setMessage('Password reset email sent (simulated if external configurations are absent).');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please verify your entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockCustomerLogin = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await loginAsMock('customer');
    } catch (err: any) {
      setError('Connection failed. Customer profile could not load.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center relative overflow-hidden px-3 sm:px-4 py-8 text-theme-text transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="w-full max-w-md relative z-10 space-y-4 sm:space-y-6">
        {/* Logo Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2 sm:mb-3">
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mr.B Smart Shopping Cart</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supermarket Shopping & Payment Portal</p>
        </div>

        {/* Auth Panel */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl space-y-4 sm:space-y-5 text-left">
          {authMode !== 'forgot' && (
            <div className="flex border-b border-theme-border pb-1">
              <button
                onClick={() => { setAuthMode('signin'); setError(''); setMessage(''); }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${authMode === 'signin' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setError(''); setMessage(''); }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${authMode === 'signup' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Register
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white pb-1 border-b border-theme-border uppercase tracking-wider">
              Forgot Password
            </h3>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-theme-text"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. shopper@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-theme-text"
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setError(''); setMessage(''); }}
                      className="text-[9px] font-bold text-emerald-500 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-theme-text"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {authMode === 'signin' ? <LogIn className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
              {loading ? 'Processing...' : authMode === 'signin' ? 'Sign In as Customer' : authMode === 'signup' ? 'Create Customer Account' : 'Send Reset Link'}
            </button>
          </form>

          {authMode === 'forgot' && (
            <button
              onClick={() => { setAuthMode('signin'); setError(''); setMessage(''); }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 mt-2 underline block"
            >
              Return to Sign In
            </button>
          )}

          {/* Quick Mock Bypass */}
          <div className="pt-4 border-t border-theme-border space-y-3 mt-2">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Key className="w-3.5 h-3.5 text-emerald-500" /> Quick Demo Seeding Accounts
            </p>
            <button
              onClick={handleMockCustomerLogin}
              className="w-full py-3 rounded-xl border border-theme-border bg-theme-bg hover:bg-slate-100 dark:hover:bg-slate-850/50 text-xs font-bold text-theme-text transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
            >
              <span>👤 Quick Customer Login</span>
              <span className="text-[9px] text-emerald-500 font-medium">customer@smartcart.com (Customer123)</span>
            </button>
            <div className="text-center">
              <a
                href="/admin-login"
                className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 underline"
              >
                Go to Admin Portal Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon wrapper
const CheckCircle2Icon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Login;
