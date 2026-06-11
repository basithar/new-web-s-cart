import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Wallet, Cpu, CreditCard, ShieldCheck, 
  ArrowRight, Scan, Receipt, Sparkles, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartShopping = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/budget-setup');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-16 py-6 text-theme-text transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center pt-4 max-w-5xl mx-auto">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart Retail
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Smart Shopping <span className="text-emerald-500">Cart</span>
          </h1>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
            Track your shopping budget in real time using RFID technology and mobile checkout. 
            An advanced IoT-integrated kiosk system designed to eliminate checkout queues and prevent budget overruns.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleStartShopping}
              className="glass-button font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 px-8 py-3.5"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </button>
            
            {!user && (
              <button
                onClick={() => navigate('/admin-login')}
                className="glass-button-secondary font-bold text-sm px-6 py-3.5"
              >
                🛡️ Admin Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Shopping Illustration / Vector Graphic (Clean Premium Glassmorphic Card Mockup) */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
          <div className="relative w-80 sm:w-96 p-6 rounded-3xl glass-panel border border-theme-border flex flex-col gap-4 shadow-2xl relative z-10 transform hover:scale-102 transition-transform duration-350 select-none">
            <div className="flex justify-between items-center border-b border-theme-border pb-3">
              <span className="font-extrabold text-xs tracking-wider uppercase text-emerald-500 flex items-center gap-1">
                <ShoppingCart className="w-4 h-4 animate-bounce-slow" /> Active Kiosk Cart
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">CART_001</span>
            </div>
            
            <div className="space-y-2.5 py-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">🥛 Premium Fresh Milk</span>
                <span className="font-mono font-bold">Rs. 450</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">🍞 Whole Bakery Bread</span>
                <span className="font-mono font-bold">Rs. 250</span>
              </div>
            </div>

            <div className="border-t border-theme-border pt-4 mt-2 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Total Amount:</span>
                <span className="text-theme-text text-sm font-extrabold">Rs. 700</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Budget Lock:</span>
                <span className="text-emerald-500">Rs. 2,000</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="w-[35%] h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Features Section */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Supermarket System Features</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Explore the integrated hardware and software capabilities built to enhance retail operations.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 text-left space-y-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Budget Tracking</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
              Prevents overspending by checking item costs dynamically against your predefined limit during checkout runs.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left space-y-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">RFID Shopping</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
              Instantly detects RFID tags when items are dropped inside the cart, populating the cart details automatically.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left space-y-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Fast Checkout</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
              Authorize digital payments directly using POS checkout forms, and instantly print invoice records.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left space-y-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">ESP32 Integration</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
              Native Wi-Fi communication with ESP32-S3 boards and MFRC522 readers to stream hardware inputs.
            </p>
          </div>
        </div>
      </div>

      {/* 3. How It Works Section */}
      <div className="glass-panel rounded-3xl p-8 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h3 className="font-extrabold text-xl">How the System Works</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Get ready for a seamless shopping experience in four simple steps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="space-y-2 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base mx-auto shadow-inner border border-emerald-500/15">
              1
            </div>
            <h4 className="font-bold text-xs pt-2">Set Budget</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal max-w-[180px] mx-auto">
              Enter your target limit using the keypad before adding products.
            </p>
          </div>

          <div className="space-y-2 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base mx-auto shadow-inner border border-emerald-500/15">
              2
            </div>
            <h4 className="font-bold text-xs pt-2">Scan Products</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal max-w-[180px] mx-auto">
              RFID tags or barcodes automatically load scans into the live cart.
            </p>
          </div>

          <div className="space-y-2 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base mx-auto shadow-inner border border-emerald-500/15">
              3
            </div>
            <h4 className="font-bold text-xs pt-2">Checkout</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal max-w-[180px] mx-auto">
              Review and submit customer information to log the supermarket transaction.
            </p>
          </div>

          <div className="space-y-2 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base mx-auto shadow-inner border border-emerald-500/15">
              4
            </div>
            <h4 className="font-bold text-xs pt-2">Payment Success</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal max-w-[180px] mx-auto">
              Receive your printable success invoice and review history in your profile.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <footer className="border-t border-theme-border pt-8 pb-4 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-xs">S</div>
            <span className="font-bold text-theme-text">Smart Shopping Cart Platform</span>
          </div>
          
          <div className="flex gap-4">
            <a href="/login" className="hover:text-emerald-500 transition-colors">Customer Portal</a>
            <a href="/admin-login" className="hover:text-emerald-500 transition-colors">Store Manager Admin</a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>© 2026 Retail IoT Inc.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
