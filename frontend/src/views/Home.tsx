import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { API_URL } from '../config';
import { 
  ShoppingCart, Cpu, Wallet, CreditCard, AlertTriangle, 
  CheckCircle2, ArrowRight, RefreshCw, Smartphone, DollarSign, Gift, Loader2
} from 'lucide-react';

interface CartItem {
  uid: string;
  name: string;
  price: number;
  weight: number;
}

interface CartData {
  status: 'shopping' | 'checkout' | 'paid';
  budget: number;
  remainingBudget: number;
  totalPrice: number;
  totalWeight: number;
  physicalWeight: number;
  weightMatch: boolean;
  items: CartItem[];
  lastUpdated: string;
  lastSeen?: string;
  paidAt?: string;
  paymentMethod?: string;
}

const Home: React.FC = () => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paying, setPaying] = useState<boolean>(false);
  const [payError, setPayError] = useState<string | null>(null);

  // 1. Subscribe to CART_001 document in real-time
  useEffect(() => {
    const cartRef = doc(db, 'carts', 'CART_001');
    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        setCart(docSnap.data() as CartData);
      } else {
        // Auto-initialize if it doesn't exist
        const defaultCart: CartData = {
          status: 'shopping',
          budget: 3500,
          remainingBudget: 3500,
          totalPrice: 0,
          totalWeight: 0,
          physicalWeight: 0,
          weightMatch: false,
          items: [],
          lastUpdated: new Date().toISOString()
        };
        setDoc(cartRef, defaultCart);
        setCart(defaultCart);
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore subscription error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Keep current time updated for online check comparison
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 3. Online Check Logic (< 30s ago)
  const isOnline = (() => {
    if (!cart || !cart.lastSeen) return false;
    const lastSeenTime = new Date(cart.lastSeen).getTime();
    return (currentTime - lastSeenTime) < 30000;
  })();

  // 4. Pay action
  const handlePayment = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const response = await axios.post(`${API_URL}/cart/pay`, {
        cartId: 'CART_001',
        paymentMethod
      });
      if (!response.data.success) {
        setPayError(response.data.error || 'Payment failed.');
      }
    } catch (err: any) {
      setPayError(err.response?.data?.error || err.message || 'Payment server error.');
    } finally {
      setPaying(false);
    }
  };

  // 5. Reset Cart logic
  const handleReset = async () => {
    try {
      setLoading(true);
      const cartRef = doc(db, 'carts', 'CART_001');
      const resetCart: CartData = {
        status: 'shopping',
        budget: 3500,
        remainingBudget: 3500,
        totalPrice: 0,
        totalWeight: 0,
        physicalWeight: 0,
        weightMatch: false,
        items: [],
        lastUpdated: new Date().toISOString()
      };
      await setDoc(cartRef, resetCart);
    } catch (err) {
      console.error('Reset cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-theme-text">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-450">Connecting to Kiosk CART_001...</p>
      </div>
    );
  }

  if (!cart) return null;

  const budgetUsagePercent = cart.budget > 0 ? Math.min(100, (cart.totalPrice / cart.budget) * 100) : 0;
  const isBudgetExceeded = cart.totalPrice > cart.budget;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 text-theme-text text-left relative transition-colors duration-300">
      
      {/* ─── SECTION 1: LIVE CART STATUS BAR ─── */}
      <div className="glass-panel rounded-3xl p-5 border border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Kiosk Terminal: CART_001</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Real-time checkout active</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badges */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cart Status:</span>
            {cart.status === 'shopping' && <span className="badge-warning">Shopping</span>}
            {cart.status === 'checkout' && <span className="badge-success">Checkout</span>}
            {cart.status === 'paid' && <span className="badge-success bg-blue-500/10 text-blue-500 border-blue-500/20">Paid</span>}
          </div>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hardware status:</span>
            {isOnline ? (
              <span className="badge-success flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            ) : (
              <span className="badge-danger flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid (Budget + Items Table + Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Budget + Scanned Items) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ─── SECTION 2: BUDGET SECTION ─── */}
          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-4 shadow-lg">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-500" /> Budget Lock Profile
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Lock Limit</span>
                <span className="text-base font-extrabold font-mono">Rs. {cart.budget.toLocaleString()}</span>
              </div>
              
              <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Spent</span>
                <span className={`text-base font-extrabold font-mono ${isBudgetExceeded ? 'text-rose-550' : 'text-theme-text'}`}>
                  Rs. {cart.totalPrice.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Remaining</span>
                <span className={`text-base font-extrabold font-mono ${cart.remainingBudget < 0 ? 'text-rose-550' : 'text-emerald-500'}`}>
                  Rs. {cart.remainingBudget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Budget Consumption</span>
                <span className={isBudgetExceeded ? 'text-rose-550' : 'text-emerald-555'}>
                  {budgetUsagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-theme-border">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isBudgetExceeded ? 'bg-rose-550' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetUsagePercent}%` }}
                ></div>
              </div>
              {isBudgetExceeded && (
                <p className="text-[10px] text-rose-550 font-bold animate-pulse">
                  ⚠️ Budget Exceeded! Please remove some items to restore verification compliance.
                </p>
              )}
            </div>
          </div>

          {/* ─── SECTION 3: SCANNED ITEMS TABLE ─── */}
          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-4 shadow-lg">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Scanned Cart Items ({cart.items.length})
            </h4>

            {cart.items.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold bg-theme-bg border border-theme-border border-dashed rounded-2xl">
                No items scanned yet. Scan an RFID tag on the physical cart to add items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-theme-border text-slate-400 font-bold uppercase">
                      <th className="py-2.5">Product Name</th>
                      <th className="py-2.5 text-center">RFID UID</th>
                      <th className="py-2.5 text-right">Weight (g)</th>
                      <th className="py-2.5 text-right">Price (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {cart.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-500/5 transition-colors">
                        <td className="py-3 font-semibold">{item.name}</td>
                        <td className="py-3 text-center font-mono font-bold text-slate-450">{item.uid}</td>
                        <td className="py-3 text-right font-mono">{item.weight}g</td>
                        <td className="py-3 text-right font-extrabold text-theme-text">Rs. {item.price.toLocaleString()}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t-2 border-theme-border bg-theme-bg/50 font-extrabold text-sm">
                      <td className="py-3.5 pl-2">Total Summary</td>
                      <td className="py-3.5 text-center text-xs text-slate-400 font-bold">Total Scanned</td>
                      <td className="py-3.5 text-right font-mono">{cart.totalWeight}g</td>
                      <td className="py-3.5 text-right text-emerald-500 font-mono">Rs. {cart.totalPrice.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Verification & Payment) */}
        <div className="space-y-6">
          
          {/* ─── SECTION 4: WEIGHT VERIFICATION SECTION ─── */}
          {cart.status === 'checkout' && (
            <div className={`glass-panel rounded-3xl p-6 border-theme-border space-y-4 shadow-lg ${
              cart.weightMatch ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
            }`}>
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-500" /> Scale Verification
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Expected (DB)</span>
                  <span className="text-base font-extrabold font-mono">{cart.totalWeight}g</span>
                </div>
                
                <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Scale Sensor</span>
                  <span className={`text-base font-extrabold font-mono ${cart.weightMatch ? 'text-emerald-500' : 'text-rose-550'}`}>
                    {cart.physicalWeight}g
                  </span>
                </div>
              </div>

              {/* Match/Mismatch Indicator */}
              <div className="flex items-center justify-center gap-2 py-1.5 border-t border-theme-border/30">
                {cart.weightMatch ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Weight Verified successfully!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                    <span>Weight discrepancy flagged</span>
                  </div>
                )}
              </div>

              {!cart.weightMatch && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold leading-relaxed text-center">
                  Weight mismatch! Please scan any unscanned items on the cart, then press STOP again.
                </p>
              )}
            </div>
          )}

          {/* ─── SECTION 5: PAYMENT SECTION ─── */}
          {cart.status === 'checkout' && cart.weightMatch && (
            <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-4 shadow-lg">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500" /> POS Checkout Gateway
              </h4>

              {/* Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-650' 
                        : 'border-theme-border bg-theme-bg hover:bg-slate-500/5'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Card
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'mobile' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-650' 
                        : 'border-theme-border bg-theme-bg hover:bg-slate-500/5'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Mobile Pay
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-650' 
                        : 'border-theme-border bg-theme-bg hover:bg-slate-500/5'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" /> Cash
                  </button>

                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'wallet' 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-650' 
                        : 'border-theme-border bg-theme-bg hover:bg-slate-500/5'
                    }`}
                  >
                    <Gift className="w-4 h-4" /> Wallet
                  </button>
                </div>
              </div>

              <div className="border-t border-theme-border pt-4 mt-2 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Paying Amount:</span>
                  <span className="text-base font-extrabold text-theme-text">Rs. {cart.totalPrice.toLocaleString()}</span>
                </div>

                {payError && (
                  <p className="text-[10px] text-rose-500 font-bold">{payError}</p>
                )}

                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full glass-button font-bold text-xs uppercase tracking-wider py-3"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Pay Now (Rs. {cart.totalPrice.toLocaleString()}) <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Fallback Display showing that stopped weight verification is pending */}
          {cart.status === 'shopping' && cart.items.length > 0 && (
            <div className="glass-panel rounded-3xl p-5 bg-theme-card border-theme-border text-center space-y-3 shadow-md">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <h5 className="font-bold text-xs">Awaiting Hardware Stop</h5>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Click the physical **STOP** button on your shopping cart to compare scale telemetry and unlock payment.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ─── SECTION 6: PAYMENT SUCCESS OVERLAY ─── */}
      {cart.status === 'paid' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 bg-theme-card border-theme-border shadow-2xl space-y-6 transform scale-100 transition-all duration-300">
            
            {/* Header Success Checkmark */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-md border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              </div>
              <h3 className="text-xl font-extrabold text-theme-text">Payment Successful!</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Your retail transaction was processed successfully.</p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 rounded-2xl bg-theme-bg border border-theme-border space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-theme-border/50">
                <span className="font-bold text-slate-400">Payment Ref</span>
                <span className="font-mono font-bold text-slate-500">CART_001_PAID</span>
              </div>

              {/* Scanned Items list */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {cart.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">{item.name}</span>
                    <span className="font-mono font-bold">Rs. {item.price}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-theme-border/50 pt-3 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Total weight:</span>
                  <span className="font-mono font-bold">{cart.totalWeight}g</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Payment method:</span>
                  <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{cart.paymentMethod || 'card'}</span>
                </div>
                <div className="flex justify-between items-center font-extrabold text-sm pt-1 border-t border-theme-border/20">
                  <span className="text-theme-text">Total Paid:</span>
                  <span className="text-theme-text">Rs. {cart.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={handleReset}
              className="w-full glass-button font-bold text-xs uppercase tracking-wider py-3 shadow-md"
            >
              Done & Reset View
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
