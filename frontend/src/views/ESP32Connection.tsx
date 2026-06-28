import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Wifi, Signal, Clock, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Radio, Scale, ShoppingBag, Lock, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';

import { API_URL } from '../config';

const ESP32Connection: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    esp32Status, 
    scanHistory, 
    fetchScanHistory, 
    fetchEsp32Status
  } = useCart();
  
  // Heartbeat online check timer
  const [now, setNow] = useState(Date.now());
  const [liveKioskStatus, setLiveKioskStatus] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Direct Firebase Realtime Database listener on kiosk_status/CART_001
  useEffect(() => {
    if (!rtdb) return;
    const statusRef = ref(rtdb, 'kiosk_status/CART_001');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        console.log('🔥 Live Kiosk Status received:', val);
        setLiveKioskStatus(val);
      } else {
        setLiveKioskStatus(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const lastActiveTimestamp = liveKioskStatus?.lastActive || esp32Status?.lastActive || cart?.lastSeen || (cart as any)?.lastActive;
  
  const isOnline = (() => {
    if (liveKioskStatus?.connected !== undefined) {
      if (!lastActiveTimestamp) return liveKioskStatus.connected;
      const lastActiveTime = new Date(lastActiveTimestamp).getTime();
      return liveKioskStatus.connected && (now - lastActiveTime) < 20000;
    }
    if (!lastActiveTimestamp) return false;
    const lastActiveTime = new Date(lastActiveTimestamp).getTime();
    return (now - lastActiveTime) < 20000;
  })();

  const lastWeight = liveKioskStatus?.lastWeightReading !== undefined 
    ? liveKioskStatus.lastWeightReading 
    : (esp32Status?.lastWeightReading !== undefined ? esp32Status.lastWeightReading : (cart?.physicalWeight || 0));

  const actualWeight = isOnline ? lastWeight : 0;
  const expectedWeight = cart?.expectedWeight || 0;
  const isWeightMatched = Math.abs(expectedWeight - actualWeight) <= 25;

  useEffect(() => {
    fetchScanHistory();
    fetchEsp32Status();
  }, []);

  // Get RSSI signal quality label
  const getSignalQuality = (rssi: number) => {
    if (rssi > -60) return { label: 'Excellent', color: 'text-emerald-500' };
    if (rssi > -75) return { label: 'Good', color: 'text-green-500' };
    if (rssi > -85) return { label: 'Fair', color: 'text-amber-500' };
    return { label: 'Poor / Weak', color: 'text-rose-500' };
  };

  const signal = isOnline && (liveKioskStatus?.rssi !== undefined || esp32Status?.rssi !== undefined) 
    ? getSignalQuality(liveKioskStatus?.rssi !== undefined ? liveKioskStatus.rssi : esp32Status!.rssi) 
    : { label: 'N/A', color: 'text-slate-400' };

  return (
    <div className="space-y-6 text-theme-text text-left transition-colors duration-300">
      
      {/* 1. Status Overview Header */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isOnline 
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4 flex-col sm:flex-row">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              isOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <Cpu className="w-7 h-7" />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold flex items-center justify-center sm:justify-start gap-2 text-theme-text">
                ESP32-S3 Hardware Board {isOnline ? '🟢' : '🔴'}
              </h3>
              <p className="text-xs opacity-80 mt-1">
                {isOnline 
                  ? 'Hardware connection online. Stream active.' 
                  : 'Hardware connection offline. Heartbeats timed out.'}
              </p>
            </div>
          </div>


        </div>
      </div>

      {/* Warning banner when offline */}
      {!isOnline && (
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
            {isOnline ? 'Connected' : 'Disconnected'}
          </h4>
        </div>

        {/* Last RFID UID scanned */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Radio className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Last RFID tag</span>
          <h4 className="font-extrabold text-theme-text text-xs font-mono mt-1">
            {esp32Status?.lastRfidUid || 'Waiting for scan...'}
          </h4>
        </div>

        {/* Last Weight Reading */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <Scale className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Last Weight Reading</span>
          <h4 className="font-extrabold text-theme-text text-xs mt-1">
            {isOnline ? `${lastWeight}g` : '0g'}
          </h4>
        </div>

        {/* Current Shopping Session */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <ShoppingBag className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block pt-2">Current Session</span>
          <h4 className="font-extrabold text-theme-text text-xs font-mono mt-1">
            {isOnline && esp32Status?.currentShoppingSession 
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
            {isOnline && esp32Status?.rssi !== undefined ? `${esp32Status.rssi} dBm` : 'N/A'}
          </h4>
        </div>

      </div>

      {/* 3. Active Kiosk Cart Sync Layer (Expected vs Actual, Total, Mismatch Status) */}
      <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border space-y-6">
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
                {cart.expectedWeight}g <span className="text-slate-400 text-xs font-semibold">vs</span> {actualWeight}g
              </h3>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    !isWeightMatched ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, cart.expectedWeight > 0 ? (actualWeight / cart.expectedWeight) * 105 : 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Weight verification status */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              !isWeightMatched 
                ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-555/5 border-emerald-500/20 text-emerald-655 dark:text-emerald-450'
            }`}>
              <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">Verification Status</span>
              <h3 className="text-lg font-extrabold flex items-center gap-1.5">
                {!isWeightMatched ? (
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
                {!isWeightMatched 
                  ? 'Checkout blocked. Please resolve discrepancy.' 
                  : 'System verification passed. Checkout allowed.'}
              </p>
            </div>

          </div>
        )}

        {/* Checkout Guard Visual */}
        {cart && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            !isWeightMatched 
              ? 'bg-rose-500/5 border-rose-500/20' 
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2.5 text-xs">
              <ShieldCheck className={`w-5 h-5 shrink-0 ${!isWeightMatched ? 'text-rose-500' : 'text-emerald-500'}`} />
              <div className="text-left font-medium">
                <p className="font-bold">Checkout Authorization Guard</p>
                <p className="opacity-80 text-[10px]">
                  {!isWeightMatched 
                    ? 'Checkout triggers a payload block. Telemetry scales must match catalog weights.' 
                    : 'Scale aligned. The shopper can pay now.'}
                </p>
              </div>
            </div>

            <button
              disabled={!isWeightMatched || cart.items.length === 0}
              onClick={() => navigate('/checkout')}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                !isWeightMatched || cart.items.length === 0
                  ? 'bg-slate-400/35 text-slate-400 cursor-not-allowed border border-transparent' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10'
              }`}
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
