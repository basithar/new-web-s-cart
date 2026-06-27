import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, Trash2, Plus, Minus, Scale, Wallet, CreditCard,
  ArrowRight, Radio, Search, Lock, Play, Square, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useCart, type CartData } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

import { API_URL } from '../config';

const getProductImage = (category: string): string => {
  const mapping: { [key: string]: string } = {
    'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    'Milk Powder': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
    'Biscuits': 'https://images.unsplash.com/photo-1558961309-dbdf71799f18?w=300&auto=format&fit=crop&q=80',
    'Snacks': 'https://images.unsplash.com/photo-1599490659283-4462babb6c31?w=300&auto=format&fit=crop&q=80',
    'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    'Soap': 'https://images.unsplash.com/photo-1607006342411-9a3363d63b36?w=300&auto=format&fit=crop&q=80',
    'Toothpaste': 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=300&auto=format&fit=crop&q=80',
    'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
    'Margarine': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
    'Sauce': 'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?w=300&auto=format&fit=crop&q=80',
    'Instant Food': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80',
    'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    'Dairy': 'https://images.unsplash.com/photo-1528750955906-79c2409f3e7e?w=300&auto=format&fit=crop&q=80',
    'Chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=80',
    'Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&auto=format&fit=crop&q=80',
    'Detergent': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
  };
  return mapping[category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
};

const Shopping: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isStepCheckoutParam = queryParams.get('step') === 'checkout';

  const { 
    cart, loading, updateItemQuantity,
    startShopping, stopShopping, resumeShopping, esp32Status
  } = useCart();

  // Heartbeat online check timestamp timer
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { socket } = useSocket();
  const [checkoutStatus, setCheckoutStatus] = useState<string>('');

  useEffect(() => {
    if (cart) {
      if (cart.status === 'ready_for_payment') {
        setCheckoutStatus('ready_for_payment');
      } else if (cart.status === 'weight_mismatch' || cart.weightMismatch) {
        setCheckoutStatus('weight_mismatch');
      } else {
        setCheckoutStatus('');
      }
    }
  }, [cart]);

  useEffect(() => {
    if (!socket) return;

    const handleCheckoutStatus = (data: { success: boolean; status: string }) => {
      console.log('⚡ Received checkout_status via Socket.IO:', data);
      setCheckoutStatus(data.status);
    };

    socket.on('checkout_status', handleCheckoutStatus);

    return () => {
      socket.off('checkout_status', handleCheckoutStatus);
    };
  }, [socket]);

  const [products, setProducts] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);



  if (loading && !cart) {
    return (
      <div className="space-y-6 text-theme-text">
        <div className="h-20 skeleton-shimmer"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 skeleton-shimmer"></div>
          <div className="h-80 skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  // Heartbeat online check timestamp calculations
  const lastActiveTimestamp = esp32Status?.lastActive || cart?.lastSeen || (cart as any)?.lastActive;
  const isOnline = (() => {
    if (!lastActiveTimestamp) return false;
    const lastActiveTime = new Date(lastActiveTimestamp).getTime();
    return (now - lastActiveTime) < 20000;
  })();

  // Welcome/Start Session layout when cart is null, pending, or completed
  if (!cart || (cart.status !== 'shopping' && cart.status !== 'active' && cart.status !== 'stopped' && cart.status !== 'ready_for_payment' && cart.status !== 'weight_mismatch')) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-12 text-theme-text transition-colors duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
          <ShoppingBag className="w-8 h-8 text-emerald-500 animate-bounce-slow" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-theme-text uppercase">Start Shopping Session</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
            Initialize your live shopping session. Once started, drop items into the cart to scan them via RFID and verify weights in real-time.
          </p>
        </div>
        <button
          onClick={startShopping}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" /> Start Live Shopping Session
        </button>
      </div>
    );
  }

  const currentCart = cart as CartData;

  const items = currentCart.items || [];
  const total = currentCart.totalAmount || 0;
  const budget = currentCart.budget || 0;
  const remaining = budget - total;
  const budgetPercent = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const isStopped = currentCart.status === 'stopped' || currentCart.status === 'ready_for_payment' || currentCart.status === 'weight_mismatch';

  const filteredCatalog = products.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 text-theme-text transition-colors duration-300">
      
      {/* Weight is Matched Banner */}
      {currentCart.weightMatch && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center gap-3 shadow-md animate-fade-in">
          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 animate-bounce" />
          <span>Weight is Matched! ✅</span>
        </div>
      )}
      
      {/* Dynamic Weight Mismatch Warning Banner */}
      {checkoutStatus === 'weight_mismatch' && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-sm flex items-center gap-3 shadow-md animate-pulse">
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
          <span>Weight Mismatch: There are unscanned items in your cart. Please scan them again!</span>
        </div>
      )}
      
      {/* 1. Shopping Session Banner (Telemetry Notifications) */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isStopped 
          ? (currentCart.weightMismatch 
              ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400' 
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400')
          : 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5 flex-col sm:flex-row">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
              isStopped 
                ? (currentCart.weightMismatch ? 'bg-rose-650 text-white' : 'bg-emerald-600 text-white')
                : 'bg-blue-600 text-white animate-pulse'
            }`}>
              {isStopped ? (
                currentCart.weightMismatch ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-theme-text uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                Session Status: {isStopped ? (currentCart.weightMismatch ? 'Weight Mismatch' : 'VERIFIED') : 'Shopping Active'}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  ESP32 Status: {isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}
                </span>
              </h3>
              <p className="text-[11px] opacity-80 mt-1 font-medium leading-normal">
                {isStopped ? (
                  currentCart.weightMismatch 
                    ? 'Weight mismatch detected. Please rescan or remove unscanned items to continue.'
                    : 'Cart weight verified successfully. You are cleared to proceed to checkout!'
                ) : (
                  'RFID scanner and scale are online. Drop items in cart to automatically register them.'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
              {isStopped ? (
                <button
                  onClick={() => resumeShopping()}
                  className="px-4 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs font-bold text-theme-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resume Shopping
                </button>
              ) : (
                <button
                  onClick={() => stopShopping(currentCart.physicalWeight)}
                  disabled={items.length === 0}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 active:scale-95 ${
                    items.length === 0 
                      ? 'bg-slate-500 opacity-50 cursor-not-allowed' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Lock & Stop Shopping
                </button>
              )}
            </div>
          </div>
        </div>

      {/* 2. Dashboard Cards (Budget KPI Widgets) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Budget */}
        <div className="glass-panel rounded-2xl p-5 text-left flex items-center justify-between border-l-4 border-l-emerald-500 bg-theme-card border-theme-border">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session Budget</span>
            <h3 className="text-xl font-extrabold text-theme-text">Rs. {budget.toLocaleString()}</h3>
          </div>
          <Wallet className="w-8 h-8 text-emerald-500/20" />
        </div>

        {/* Total Spent */}
        <div className="glass-panel rounded-2xl p-5 text-left flex items-center justify-between border-l-4 border-l-violet-500 bg-theme-card border-theme-border">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Spent</span>
            <h3 className="text-xl font-extrabold text-theme-text">Rs. {total.toLocaleString()}</h3>
          </div>
          <ShoppingBag className="w-8 h-8 text-violet-500/20" />
        </div>

        {/* Remaining Budget */}
        <div className={`glass-panel rounded-2xl p-5 text-left flex items-center justify-between border-l-4 bg-theme-card border-theme-border ${
          remaining < 0 ? 'border-l-rose-500' : 'border-l-green-500'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining Budget</span>
            <h3 className={`text-xl font-extrabold ${remaining < 0 ? 'text-rose-500 animate-pulse' : 'text-theme-text'}`}>
              Rs. {remaining.toLocaleString()}
            </h3>
          </div>
          <Scale className="w-8 h-8 text-slate-500/10" />
        </div>
      </div>

      {/* 3. Budget Section (Progress & Warnings) */}
      {budget > 0 && (
        <div className="glass-panel rounded-2xl p-4 space-y-2 bg-theme-card border-theme-border">
          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Budget Progress</span>
            <span>{budgetPercent.toFixed(0)}% Used</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercent >= 100 ? 'bg-rose-500' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercent}%` }}
            ></div>
          </div>
          
          {budgetPercent >= 100 ? (
            <p className="text-[10px] font-bold text-rose-500 animate-pulse">
              ⚠️ Alert: Spending has exceeded your budget limit! Consider removing items before checking out.
            </p>
          ) : budgetPercent >= 80 ? (
            <p className="text-[10px] font-bold text-amber-500">
              ⚠️ Warning: You have used 80% or more of your budget limit.
            </p>
          ) : null}
        </div>
      )}
      {/* 4. Shopping Section (Cart Items & Controllers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Cart items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border relative overflow-hidden">
              <>

                {isStopped && (
                  <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-955/20 backdrop-blur-[0.5px] z-10 flex items-center justify-center pointer-events-none select-none">
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-800/95 border border-slate-700 text-white font-extrabold text-[9px] uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                      <Lock className="w-3 h-3 text-amber-500" /> Session Locked • stopped
                    </div>
                  </div>
                )}

                <h4 className="font-extrabold text-theme-text mb-6 flex items-center gap-2">
                  <ShoppingBag className="text-emerald-500" /> Shopping Cart Items
                </h4>

                {items.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-theme-border flex items-center justify-center mb-3">
                      <ShoppingBag className="w-5 h-5 text-slate-400" />
                    </div>
                    <h5 className="font-bold text-theme-text text-xs">Your cart is empty</h5>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-normal">
                      Add items manually using the catalog, or scan a tag UID from the ESP32 Status tab or simulator box.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-theme-border text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Product</th>
                          <th className="pb-3 text-center">Quantity</th>
                          <th className="pb-3 text-right">Price</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border/30">
                        {items.map((item) => {
                          const prod = item.product as any;
                          return (
                            <tr key={prod._id} className="hover:bg-slate-100/20 dark:hover:bg-slate-900/10">
                              <td className="py-3 flex items-center gap-3.5">
                                <img 
                                  src={prod.imageUrl || getProductImage(prod.category)} 
                                  alt={prod.name} 
                                  className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-theme-border shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-theme-text">{prod.name}</span>
                                  <span className="block text-[9px] text-slate-400 font-semibold uppercase">{prod.uid} ({prod.weight}g)</span>
                                </div>
                              </td>
                              <td className="py-3 text-center font-bold text-theme-text">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    disabled={isStopped}
                                    onClick={() => updateItemQuantity(prod._id, item.quantity - 1)}
                                    className={`w-5 h-5 rounded-lg border border-theme-border flex items-center justify-center text-slate-450 hover:text-emerald-500 hover:border-emerald-500 transition-colors ${
                                      isStopped ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-4 text-center">{item.quantity}</span>
                                  <button
                                    disabled={isStopped}
                                    onClick={() => updateItemQuantity(prod._id, item.quantity + 1)}
                                    className={`w-5 h-5 rounded-lg border border-theme-border flex items-center justify-center text-slate-455 hover:text-emerald-500 hover:border-emerald-500 transition-colors ${
                                      isStopped ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 text-right font-extrabold text-theme-text">
                                Rs. {(prod.price * item.quantity).toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  disabled={isStopped}
                                  onClick={() => updateItemQuantity(prod._id, 0)}
                                  className={`text-slate-400 hover:text-rose-500 transition-colors p-1 ${
                                    isStopped ? 'opacity-40 cursor-not-allowed' : ''
                                  }`}
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mobile Payment Gateway / Checkout Trigger */}
                {items.length > 0 && isStopped && (
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-theme-border">
                    {checkoutStatus === 'ready_for_payment' ? (
                      <div className="text-left space-y-0.5">
                        <p className="text-xs text-slate-400">Total Price: <strong className="text-theme-text text-sm">Rs. {total.toLocaleString()}</strong></p>
                        <p className="text-xs text-slate-400">Total Weight: <strong className="text-theme-text text-sm">{currentCart.physicalWeight}g</strong></p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-semibold italic">
                        Weight verification required to unlock payment gateway.
                      </div>
                    )}
                    
                    <button
                      disabled={checkoutStatus === 'weight_mismatch' || currentCart.weightMismatch}
                      onClick={() => navigate('/checkout')}
                      className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        checkoutStatus === 'weight_mismatch' || currentCart.weightMismatch
                          ? 'bg-rose-500/20 text-rose-450 border border-rose-500/25 cursor-not-allowed opacity-60' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-650 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-95'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Mobile Payment Gateway <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
          </div>


        </div>

        {/* Right Columns: Scanning methods & Catalog */}
        <div className="space-y-6">
          
          {/* Method A: Supermarket Catalog Browser */}
          <div className="glass-panel rounded-3xl p-5 space-y-4 bg-theme-card border-theme-border relative overflow-hidden">
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Store Catalog Browser
              </h4>
              <p className="text-[10px] text-slate-400">Reference details for scanning physical tags on the cart</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog items..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-[11px] text-theme-text focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-theme-border/20">
              {filteredCatalog.map((p) => (
                <div
                  key={p._id}
                  className="pt-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 mr-1.5 w-full">
                    <img
                      src={p.imageUrl || getProductImage(p.category)}
                      alt={p.name}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-theme-border shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-theme-text truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono">Rs. {p.price} • {p.weight}g</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-mono text-slate-500 uppercase tracking-wide">
                        {p.uid}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="text-[10px] text-slate-455 py-2 text-center">No items matched search.</p>
              )}
            </div>
          </div>

          {/* HX711 Telemetry Weight Monitor */}
          <div className="glass-panel rounded-3xl p-5 space-y-3 bg-theme-card border-theme-border">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-500" /> Load Cell Telemetry (HX711)
            </h4>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-theme-border space-y-3 text-xs">
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Expected Weight:</span>
                <span className="text-theme-text font-bold">{currentCart.expectedWeight || 0}g</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Scale Telemetry:</span>
                <span className={`font-bold ${currentCart.weightMismatch ? 'text-rose-500 font-extrabold animate-pulse' : 'text-theme-text'}`}>
                  {currentCart.physicalWeight || 0}g
                </span>
              </div>
              
              {currentCart.weightMismatch && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500 font-bold space-y-1">
                  <p>⚠️ Warning: Weight mismatch alert active!</p>
                  <p className="text-[9px] font-normal leading-normal opacity-85">The weight on the physical load cell scale does not align with your scanned items. Please verify and correct the physical contents.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Shopping;
