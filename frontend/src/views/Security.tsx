import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, ShieldCheck, Clock, AlertTriangle, 
  CheckCircle, Radio, Activity, RefreshCw 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Security: React.FC = () => {
  const { cart } = useCart();
  const { socket } = useSocket();
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/security/logs`);
      setLogs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Sync logs in real-time when weight sensors trigger discrepancies
  useEffect(() => {
    if (!socket) return;

    socket.on('security_alert', (newLog: any) => {
      console.log('🚨 Live Security Log Received:', newLog);
      setLogs((prev) => [newLog, ...prev]);
    });

    return () => {
      socket.off('security_alert');
    };
  }, [socket]);

  const handleResolve = async (logId: string) => {
    // In demo, we can just toggle the log in the state locally or send update
    setLogs((prev) => 
      prev.map((log) => 
        log._id === logId ? { ...log, resolved: true } : log
      )
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'pending') return !log.resolved;
    if (filter === 'resolved') return log.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Control Room Mock Telemetry / Radar Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cam/Radar Mockup (Wow Factor) */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Pulsing grid lines mock */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> CCTV FEED FEEDBACK : ACTIVE SCAN
              </span>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 px-2.5 py-1 rounded">
              CART_SYS_798F
            </div>
          </div>

          {/* Telemetry Telecommunication lines */}
          <div className="relative z-10 py-4 flex flex-col items-center">
            {cart?.weightMismatch ? (
              <div className="text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
                <h4 className="text-base font-extrabold text-rose-500 uppercase tracking-widest">Weight Discrepancy Active!</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Physical weight is {cart.physicalWeight}g, but expected item registry weight is {cart.expectedWeight}g.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Activity className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
                <h4 className="text-base font-extrabold text-emerald-500 uppercase tracking-widest">Security Secure Clear</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Weight scale sensors aligned. No active checkout irregularities.
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>GRID: X_44 Y_12</span>
            <span>SHIELD_SYS: V3.12</span>
          </div>
        </div>

        {/* Security Metric Panels */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-violet-500" /> Sensor Registry
            </h4>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Violations:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{logs.filter((l) => l.type !== 'resolved').length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Unresolved Threats:</span>
                <span className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">{logs.filter((l) => !l.resolved).length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Threat Clearance:</span>
                <span className="font-bold text-emerald-500">
                  {logs.length > 0 
                    ? `${((logs.filter((l) => l.resolved).length / logs.length) * 100).toFixed(0)}%` 
                    : '100%'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="w-full py-2 bg-slate-100/50 dark:bg-slate-900/40 hover:bg-slate-100 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all mt-4"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Pull Logs Registry
          </button>
        </div>
      </div>

      {/* 2. Security Alerts History Logs Table */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white">Security Event Registry</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Timeline of RFID scanning mismatches and weight violations.</p>
          </div>

          {/* Filter Toggles */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs shrink-0 self-start">
            {(['all', 'pending', 'resolved'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  filter === mode 
                    ? 'bg-white dark:bg-slate-950 text-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Timeline */}
        {loading ? (
          <div className="space-y-3 py-8">
            <div className="h-10 skeleton-shimmer"></div>
            <div className="h-10 skeleton-shimmer"></div>
            <div className="h-10 skeleton-shimmer"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No safety logs match the active filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  log.resolved 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800 dark:text-emerald-300/80' 
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5">
                    {log.resolved ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-snug">{log.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Cart: {log.cartId}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!log.resolved && (
                    <button
                      onClick={() => handleResolve(log._id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold shadow-md active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Clear Discrepancy
                    </button>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    log.resolved 
                      ? 'bg-emerald-500/15 text-emerald-500' 
                      : 'bg-rose-500/15 text-rose-500'
                  }`}>
                    {log.resolved ? 'Cleared' : 'Armed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Security;
