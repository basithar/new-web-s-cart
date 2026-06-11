import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radio, Plus, Minus, Scale, RefreshCw, Barcode, ShieldAlert } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

interface IoTSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IoTSimulator: React.FC<IoTSimulatorProps> = ({ isOpen, onClose }) => {
  const { cart, simulateScan, simulateWeightUpdate, updateItemQuantity } = useCart();
  const { triggerLocalNotification } = useSocket();
  
  const [products, setProducts] = useState<any[]>([]);
  const [customWeight, setCustomWeight] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  useEffect(() => {
    // Load store catalog for scanning simulation
    axios.get(`${API_URL}/products`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Sync customWeight input with physicalWeight in cart
  useEffect(() => {
    if (cart) {
      setCustomWeight(cart.physicalWeight);
    }
  }, [cart?.physicalWeight]);

  if (!isOpen) return null;

  const handleWeightSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomWeight(val);
  };

  const handleSendWeight = async () => {
    await simulateWeightUpdate(customWeight);
    triggerLocalNotification('info', 'IoT Sensor Update', `Cart scale weight modified to ${customWeight}g.`);
  };

  const handleSyncWeight = async () => {
    if (cart) {
      await simulateWeightUpdate(cart.expectedWeight);
      setCustomWeight(cart.expectedWeight);
      triggerLocalNotification('success', 'IoT Sensor Sync', `Scale weight synchronized to expected weight (${cart.expectedWeight}g).`);
    }
  };

  const handleManualBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    await simulateScan(barcodeInput.trim());
    setBarcodeInput('');
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 glass-panel border-l z-40 shadow-2xl flex flex-col justify-between transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-500 font-bold">
            <Radio className="w-5 h-5 animate-pulse text-emerald-500" />
            <h3>IoT Hardware Simulator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Simulate RFID tags, barcode scanners, and cart weight scale measurements.
        </p>
      </div>

      {/* Simulator Actions */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 1. RFID Scanner Simulator */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> RFID Tag Scanners
          </h4>
          <div className="grid gap-2">
            {products.map((p) => {
              // Find if already in cart to show count
              const cartItem = cart?.items.find((item: any) => item.product._id === p._id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={p._id}
                  className="p-3 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs"
                >
                  <div className="overflow-hidden mr-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.productName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{p.rfidUid} ({p.weight}g)</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {qty > 0 && (
                      <button
                        onClick={() => updateItemQuantity(p._id, qty - 1)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-colors"
                        title="Remove 1 via RFID Scan"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => simulateScan(p.rfidUid)}
                      className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white flex items-center justify-center transition-colors font-bold"
                      title="Add 1 via RFID Scan"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    
                    {qty > 0 && (
                      <span className="w-5 text-center font-bold text-violet-500 dark:text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5 ml-0.5">
                        {qty}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Barcode Laser Input */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5" /> Laser Barcode Reader
          </h4>
          <form onSubmit={handleManualBarcode} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter product barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-violet-500 text-slate-800 dark:text-slate-100 font-mono"
            />
            <button
              type="submit"
              className="px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              Scan
            </button>
          </form>
          <div className="p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/20 dark:border-slate-800/30 text-[10px] text-slate-400 flex flex-col gap-1">
            <span>💡 Try scanning predefined barcodes:</span>
            <span className="font-mono">🥛 Milk: 8901058002315</span>
            <span className="font-mono">🍞 Bread: 8901058002322</span>
            <span className="font-mono">🍌 Bananas: 8901058002339</span>
          </div>
        </div>

        {/* 3. Weight Scale Sensor Simulator */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> Cart Weight Scales
          </h4>
          
          <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Expected (Scanned):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{cart?.expectedWeight || 0} g</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Scale Reading:</span>
              <span className={`font-bold ${cart?.weightMismatch ? 'text-rose-500 font-extrabold animate-pulse' : 'text-emerald-500'}`}>
                {customWeight} g
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={Math.max(5000, (cart?.expectedWeight || 0) + 1500)}
                value={customWeight}
                onChange={handleWeightSlider}
                className="w-full accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0g</span>
                <span>Adjust Weight</span>
                <span>Max 5kg</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendWeight}
                className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" /> Send Scale
              </button>
              
              <button
                onClick={handleSyncWeight}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Sync physical weight with expected scan weights"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Scale
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Security alert indicator in footer */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
        <span className="text-xs text-slate-400">Security Guard Desk</span>
        {cart?.weightMismatch ? (
          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse-red">
            <ShieldAlert className="w-3.5 h-3.5" /> Alert Active
          </div>
        ) : (
          <div className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            Secure Match
          </div>
        )}
      </div>
    </div>
  );
};

export default IoTSimulator;
