import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Wifi, Signal, Clock, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Radio, Scale, ShoppingBag, Lock, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

import { API_URL } from '../config';

const ESP32Connection: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    esp32Status, 
    scanHistory, 
    fetchScanHistory, 
    fetchEsp32Status, 
    simulateScan, 
    simulateWeightUpdate 
  } = useCart();
  const { triggerLocalNotification } = useSocket();
  
  const [loading, setLoading] = useState(false);
  const [mockRfid, setMockRfid] = useState('');
  const [mockWeight, setMockWeight] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchScanHistory();
    fetchEsp32Status();
    
    // Load products list for dropdown helper in simulation
    axios.get(`${API_URL}/products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const triggerMockHeartbeat = async () => {
    setLoading(true);
    try {
      const rssi = Math.floor(-50 - Math.random() * 30);
      const currentWeight = cart ? cart.physicalWeight : 0;
      await axios.post(`${API_URL}/esp32/heartbeat`, {
        cartId: cart?.cartId || 'CART_001',
        wifiStatus: 'Connected',
        rssi,
        weight: currentWeight
      });
      await fetchEsp32Status();
      triggerLocalNotification('success', 'ESP32 Telemetry Status', 'Hardware heartbeat ping registered successfully.');
    } catch (err) {
      console.error(err);
      triggerLocalNotification('error', 'ESP32 Status', 'Failed to send heartbeat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockRfid.trim()) return;
    setLoading(true);
    try {
      await simulateScan(mockRfid.trim());
      setMockRfid('');
      await fetchScanHistory();
      await fetchEsp32Status();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const wt = Number(mockWeight);
    if (isNaN(wt) || wt < 0) return;
    setLoading(true);
    try {
      await simulateWeightUpdate(wt);
      setMockWeight('');
      await fetchEsp32Status();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get RSSI signal quality label
  const getSignalQuality = (rssi: number) => {
    if (rssi > -60) return { label: 'Excellent', color: 'text-emerald-500' };
    if (rssi > -75) return { label: 'Good', color: 'text-green-500' };
    if (rssi > -85) return { label: 'Fair', color: 'text-amber-500' };
    return { label: 'Poor / Weak', color: 'text-rose-500' };
  };

  const signal = esp32Status ? getSignalQuality(esp32Status.rssi) : { label: 'N/A', color: 'text-slate-400' };

  return (
    <div className="space-y-6 text-theme-text text-left transition-colors duration-300">
      
      {/* 1. Status Overview Header */}
      <div className={`p-6 rounded-3xl border transition-all ${
        esp32Status?.connected 
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-theme-card border-theme-border text-slate-500'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4 flex-col sm:flex-row">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              esp32Status?.connected ? 'bg-emerald-600 text-white' : 'bg-theme-bg border border-theme-border text-slate-400'
            }`}>
              <Cpu className="w-7 h-7" />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold flex items-center justify-center sm:justify-start gap-2 text-theme-text">
                ESP32-S3 Hardware Board 
                {esp32Status?.connected ? (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ) : (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-slate-400"></span>
                )}
              </h3>
              <p className="text-xs opacity-80 mt-1">
                {esp32Status?.connected 
                  ? 'Real-time telemetry and scanning stream active.' 
                  : 'Hardware connection offline. Heartbeats timed out.'}
              </p>
            </div>
          </div>

          <button
            onClick={triggerMockHeartbeat}
            disabled={loading}
            className="glass-button text-xs font-bold shrink-0 shadow-md"
          >
            Connect ESP32 (Ping Heartbeat)
          </button>
        </div>
      </div>

      {/* Warning banner when offline */}
      {!esp32Status?.connected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
          <div>
            <p className="font-bold">Hardware Connection Warning</p>
            <p className="opacity-90 font-medium mt-0.5">
              Ensure your ESP32-S3 is booted, connected to Wi-Fi, and configured with correct server API IP.
            </p>
          </div>
        </div>
      )}

      {/* 2. Detailed Telemetry Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Wifi Network status */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Wifi className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Wi-Fi Connection</span>
          <h4 className="font-extrabold text-theme-text text-xs mt-1">
            {esp32Status?.connected ? 'Connected' : 'Offline'}
          </h4>
        </div>

        {/* Last RFID UID scanned */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Radio className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Last RFID tag</span>
          <h4 className="font-extrabold text-theme-text text-xs font-mono mt-1">
            {esp32Status?.lastRfidUid || 'None'}
          </h4>
        </div>

        {/* Last Weight Reading */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Scale className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Last Weight Reading</span>
          <h4 className="font-extrabold text-theme-text text-xs mt-1">
            {esp32Status?.connected && esp32Status.lastWeightReading !== undefined
              ? `${esp32Status.lastWeightReading}g`
              : '0g'
            }
          </h4>
        </div>

        {/* Current Shopping Session */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <ShoppingBag className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block pt-2">Current Session</span>
          <h4 className="font-extrabold text-theme-text text-xs font-mono mt-1">
            {esp32Status?.connected && esp32Status.currentShoppingSession 
              ? esp32Status.currentShoppingSession 
              : 'None'
            }
          </h4>
        </div>

        {/* WiFi Signal strength RSSI */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Signal className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block pt-2">Signal Strength</span>
          <h4 className={`font-extrabold text-xs mt-1 ${signal.color}`}>
            {esp32Status?.connected ? `${esp32Status.rssi} dBm` : 'N/A'}
          </h4>
        </div>

      </div>

      {/* 3. Active Kiosk Cart Sync Layer (Expected vs Actual, Total, Mismatch Status) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Cart Synchronization metrics */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-6">
          <div className="flex justify-between items-center border-b border-theme-border pb-3">
            <div>
              <h4 className="font-extrabold text-theme-text">Active Kiosk Cart Synchronization</h4>
              <p className="text-xs text-slate-400">Verifying live shopping cart states with physical scale telemetry.</p>
            </div>
            <span className="text-[10px] font-mono bg-theme-bg border border-theme-border px-3 py-1 rounded-full text-slate-400">
              ID: {cart?.cartId || 'CART_001'}
            </span>
          </div>

          {!cart ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active shopping cart session. Start a session from the Kiosk view to sync.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Cart Total amount value */}
              <div className="p-4 rounded-2xl bg-theme-bg border border-theme-border space-y-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cart Total Amount</span>
                <h3 className="text-lg font-extrabold text-theme-text">Rs. {cart.totalAmount.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-450 font-semibold">{cart.items.length} unique items</p>
              </div>

              {/* Weight Comparison */}
              <div className="p-4 rounded-2xl bg-theme-bg border border-theme-border space-y-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Expected vs Actual</span>
                <h3 className="text-lg font-extrabold text-theme-text">
                  {cart.expectedWeight}g <span className="text-slate-400 text-xs font-semibold">vs</span> {cart.physicalWeight}g
                </h3>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      cart.weightMismatch ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, cart.expectedWeight > 0 ? (cart.physicalWeight / cart.expectedWeight) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              {/* Weight verification status */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                cart.weightMismatch 
                  ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                  : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">Verification Status</span>
                <h3 className="text-lg font-extrabold flex items-center gap-1.5">
                  {cart.weightMismatch ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-550 shrink-0" />
                      Mismatch
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      Verified
                    </>
                  )}
                </h3>
                <p className="text-[10px] opacity-85 leading-tight font-medium">
                  {cart.weightMismatch 
                    ? 'Checkout blocked. Please resolve discrepancy.' 
                    : 'System verification passed. Checkout allowed.'}
                </p>
              </div>

            </div>
          )}

          {/* Checkout Guard Visual */}
          {cart && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              cart.weightMismatch 
                ? 'bg-rose-500/5 border-rose-500/20' 
                : 'bg-emerald-500/5 border-emerald-500/20'
            }`}>
              <div className="flex items-center gap-2.5 text-xs">
                <ShieldCheck className={`w-5 h-5 shrink-0 ${cart.weightMismatch ? 'text-rose-500' : 'text-emerald-500'}`} />
                <div className="text-left font-medium">
                  <p className="font-bold">Checkout Authorization Guard</p>
                  <p className="opacity-80 text-[10px]">
                    {cart.weightMismatch 
                      ? 'Checkout triggers a payload block. Telemetry scales must match catalog weights.' 
                      : 'Scale aligned. The shopper can pay now.'}
                  </p>
                </div>
              </div>

              <button
                disabled={cart.weightMismatch || cart.items.length === 0}
                onClick={() => navigate('/checkout')}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                  cart.weightMismatch || cart.items.length === 0
                    ? 'bg-slate-400/35 text-slate-400 cursor-not-allowed border border-transparent' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10'
                }`}
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: ESP32 Hardware Simulators */}
        <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-6">
          <div>
            <h4 className="font-extrabold text-theme-text">ESP32 Hardware Simulation</h4>
            <p className="text-xs text-slate-400">Trigger simulated hardware inputs for the MFRC522 and HX711 scale.</p>
          </div>

          <div className="space-y-4">
            
            {/* Simulation A: RFID scan */}
            <form onSubmit={handleSimulateRfid} className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Simulate RFID Tag Scanned</label>
              
              {/* Dropdown helper with product list */}
              <select
                onChange={(e) => setMockRfid(e.target.value)}
                value={mockRfid}
                className="w-full px-3 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Seeded Catalog Product --</option>
                {products.map(p => (
                  <option key={p.uid} value={p.uid}>
                    {p.name} ({p.uid} - {p.weight}g)
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter custom UID..."
                  value={mockRfid}
                  onChange={(e) => setMockRfid(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Scan
                </button>
              </div>
            </form>

            {/* Simulation B: Scale Telemetry Weight */}
            <form onSubmit={handleSimulateWeight} className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Simulate Scale Weight (grams)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={mockWeight}
                  onChange={(e) => setMockWeight(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Update
                </button>
              </div>
              
              {cart && (
                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      simulateWeightUpdate(cart.expectedWeight);
                      triggerLocalNotification('success', 'Weight Aligned', 'Physical telemetry weight matched expected cart weight.');
                    }}
                    className="underline text-[10px] text-emerald-500 font-bold"
                  >
                    Align with Expected ({cart.expectedWeight}g)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      simulateWeightUpdate(cart.expectedWeight + 200);
                      triggerLocalNotification('warning', 'Mismatch Induced', 'Induced a +200g weight discrepancy.');
                    }}
                    className="underline text-[10px] text-rose-500 font-bold"
                  >
                    Induce Mismatch (+200g)
                  </button>
                </div>
              )}
            </form>

          </div>
        </div>

      </div>

      {/* 4. Scanning History Logs */}
      <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-extrabold text-theme-text">RFID Scanning History</h4>
            <p className="text-xs text-slate-400">Chronology of RFID scans received from ESP32 or Simulator.</p>
          </div>
          
          <button
            onClick={fetchScanHistory}
            className="p-2 bg-theme-bg rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-theme-border"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No scanning records logged.
          </div>
        ) : (
          <div className="space-y-3">
            {scanHistory.map((log) => (
              <div
                key={log._id}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  log.success 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {log.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  
                  <div>
                    <p className="font-bold">
                      {log.success ? `Scanned: ${log.productName}` : 'Product Not Found (Unregistered Tag)'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold font-mono">
                      UID: {log.uid} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  log.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {log.success ? 'Success' : 'Invalid'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ESP32Connection;
