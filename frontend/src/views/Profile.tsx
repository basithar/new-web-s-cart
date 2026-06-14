import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Mail, Wallet, Calendar, ShoppingBag, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Load customer transactions history
    axios.get(`${API_URL}/transactions?email=${user.email}`)
      .then((res) => {
        setTransactions(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return <div className="text-slate-405 text-xs py-8 text-center text-theme-text">User profile not found.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-theme-text transition-colors duration-300">
      
      {/* Left Columns: User Info card & Budget history */}
      <div className="lg:col-span-1 space-y-6">
        {/* Profile details */}
        <div className="glass-panel rounded-3xl p-6 text-center space-y-4 bg-theme-card border border-theme-border">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/20 shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-theme-text text-base">{user.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          </div>
        </div>

        {/* Budget limit Updates timeline list */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 text-left bg-theme-card border border-theme-border">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-500" /> Budget History
          </h4>

          {!user.budgetHistory || user.budgetHistory.length === 0 ? (
            <p className="text-[11px] text-slate-400">No budget updates registered.</p>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {[...(user.budgetHistory || [])].reverse().map((bh: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-theme-bg border border-theme-border">
                  <div className="space-y-0.5">
                    <span className="font-bold text-theme-text">Rs. {bh.limit.toLocaleString()}</span>
                    <span className="block text-[9px] text-slate-400 font-medium">
                      {new Date(bh.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Transactions log list */}
      <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-4 text-left bg-theme-card border border-theme-border">
        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-emerald-500" /> Shopping & Order History
        </h4>

        {loading ? (
          <div className="space-y-3">
            <div className="h-10 skeleton-shimmer"></div>
            <div className="h-10 skeleton-shimmer"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No shopping logs or transactions recorded.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div 
                key={tx._id}
                className="p-4 rounded-2xl bg-theme-bg border border-theme-border text-xs space-y-3"
              >
                <div className="flex justify-between items-start border-b border-theme-border pb-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-bold text-theme-text">Order: {tx.orderNumber || tx.transactionId}</h5>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${
                        tx.paymentStatus === 'Failed' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {tx.paymentStatus || 'Success'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">TXN: {tx.transactionId}</p>
                    <span className="text-[10px] text-slate-450 font-semibold font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-500" /> {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-500">Rs. {tx.totalPaid.toLocaleString()}</span>
                </div>

                <div className="space-y-1.5">
                  {tx.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-slate-500 text-[11px] font-medium">
                      <span>{item.productName} x{item.quantity}</span>
                      <span className="font-bold text-theme-text">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;
