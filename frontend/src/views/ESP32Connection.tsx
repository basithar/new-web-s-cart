import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Cpu, Wifi, Signal, Clock, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Radio, Scale, ShoppingBag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ESP32Connection: React.FC = () => {
  const { esp32Status, scanHistory, fetchScanHistory, fetchEsp32Status } = useCart();
  const { triggerLocalNotification } = useSocket();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScanHistory();
    fetchEsp32Status();
  }, []);

  const triggerMockHeartbeat = async () => {
    setLoading(true);
    try {
      // Generate a random signal strength RSSI between -50 and -80
      const rssi = Math.floor(-50 - Math.random() * 30);
      await axios.post(`${API_URL}/esp32/heartbeat`, {
        wifiStatus: 'Connected',
        rssi,
      });
      await fetchEsp32Status();
      triggerLocalNotification('success', 'ESP32 Status', 'Mock heartbeat ping sent to server.');
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
            {esp32Status?.connected && (esp32Status as any).lastWeightReading !== undefined
              ? `${(esp32Status as any).lastWeightReading}g`
              : '0g'
            }
          </h4>
        </div>

        {/* Current Shopping Session */}
        <div className="glass-panel rounded-2xl p-5 space-y-1 text-left bg-theme-card border-theme-border">
          <ShoppingBag className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block pt-2">Current Session</span>
          <h4 className="font-extrabold text-theme-text text-xs font-mono mt-1">
            {esp32Status?.connected && (esp32Status as any).currentShoppingSession 
              ? (esp32Status as any).currentShoppingSession 
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

      {/* 3. Scanning History Logs */}
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
