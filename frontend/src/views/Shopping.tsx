import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, Trash2, Plus, Minus, Scale, Wallet, 
  ArrowRight, Radio, Search
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Shopping: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, loading, updateItemQuantity, simulateScan, simulateWeightUpdate 
  } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [manualRfid, setManualRfid] = useState('');
  const [mismatchWeight, setMismatchWeight] = useState('');
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

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRfid.trim()) return;
    await simulateScan(manualRfid.trim());
    setManualRfid('');
  };

  const handleSimulateMismatch = async () => {
    const wt = Number(mismatchWeight);
    if (!isNaN(wt) && wt >= 0) {
      await simulateWeightUpdate(wt);
      setMismatchWeight('');
    }
  };

  const handleClearMismatch = async () => {
    if (cart) {
      await simulateWeightUpdate(cart.expectedWeight);
    }
  };

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

  const items = cart?.items || [];
  const total = cart?.totalAmount || 0;
  const budget = cart?.budget || 0;
  const remaining = budget - total;
  const budgetPercent = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;

  const filteredCatalog = products.filter((p) =>
    p.productName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 text-theme-text transition-colors duration-300">
      
      {/* 1. Dashboard Cards (Budget KPI Widgets) */}
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

      {/* 2. Budget Section (Progress & Warnings) */}
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
          
          {/* Warn alerts */}
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

      {/* 3. Shopping Section (Cart Items & Controllers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Cart and scanning */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shopping items list */}
          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
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
                              src={prod.image} 
                              alt={prod.productName} 
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-theme-border shrink-0"
                            />
                            <div>
                              <span className="font-bold text-theme-text">{prod.productName}</span>
                              <span className="block text-[9px] text-slate-400 font-semibold uppercase">{prod.rfidUid} ({prod.weight}g)</span>
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-theme-text">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(prod._id, item.quantity - 1)}
                                className="w-5 h-5 rounded-lg border border-theme-border flex items-center justify-center text-slate-450 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(prod._id, item.quantity + 1)}
                                className="w-5 h-5 rounded-lg border border-theme-border flex items-center justify-center text-slate-455 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
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
                              onClick={() => updateItemQuantity(prod._id, 0)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
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

            {/* Check out Trigger */}
            {items.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => navigate('/checkout')}
                  className="glass-button font-bold text-xs bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10 flex items-center gap-1"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Scanning methods & Catalog */}
        <div className="space-y-6">
          
          {/* Method B: RFID Scanner Simulator */}
          <div className="glass-panel rounded-3xl p-5 space-y-4 bg-theme-card border-theme-border">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-500" /> RFID Scan Simulator
            </h4>
            
            <form onSubmit={handleManualScan} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Tag UID (e.g. RFID001)..."
                value={manualRfid}
                onChange={(e) => setManualRfid(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Method A: Supermarket Catalog Select */}
          <div className="glass-panel rounded-3xl p-5 space-y-4 bg-theme-card border-theme-border">
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Store Catalog Select
              </h4>
              <p className="text-[10px] text-slate-400">Click to manually add item scans</p>
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
                  <div className="flex items-center gap-2 min-w-0 mr-1.5">
                    <img
                      src={p.image}
                      alt={p.productName}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-theme-border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-theme-text truncate">{p.productName}</p>
                      <p className="text-[9px] text-slate-400 font-semibold font-mono">Rs. {p.price} • {p.weight}g</p>
                    </div>
                  </div>
                  
                  {/* Simulate scan trigger on click */}
                  <button
                    onClick={() => simulateScan(p.rfidUid)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white font-bold text-[10px] transition-all shrink-0 active:scale-95"
                  >
                    Add
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="text-[10px] text-slate-455 py-2 text-center">No items matched search.</p>
              )}
            </div>
          </div>

          {/* Telemetry Weight sensor tester */}
          <div className="glass-panel rounded-3xl p-5 space-y-3 bg-theme-card border-theme-border">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-500" /> Physical Weight Telemetry
            </h4>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-theme-border space-y-3 text-xs">
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Expected Weight:</span>
                <span className="text-theme-text font-bold">{cart?.expectedWeight || 0}g</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Scale Telemetry:</span>
                <span className={`font-bold ${cart?.weightMismatch ? 'text-rose-500 font-extrabold animate-pulse' : 'text-theme-text'}`}>
                  {cart?.physicalWeight || 0}g
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Simulate Weight (g)..."
                  value={mismatchWeight}
                  onChange={(e) => setMismatchWeight(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-[10px] text-theme-text"
                />
                <button
                  onClick={handleSimulateMismatch}
                  className="px-2.5 rounded-lg bg-theme-card border border-theme-border hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold"
                >
                  Send
                </button>
              </div>

              {cart?.weightMismatch && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500 font-bold space-y-1">
                  <p>⚠️ Warning: Weight mismatch alert active!</p>
                  <button
                    onClick={handleClearMismatch}
                    className="underline text-left block text-[9px] opacity-80 hover:opacity-100"
                  >
                    Auto-align scale telemetry
                  </button>
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
