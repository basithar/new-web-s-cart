import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Check, Delete } from 'lucide-react';
import { useCart } from '../context/CartContext';

const BudgetSetup: React.FC = () => {
  const navigate = useNavigate();
  const { updateBudget } = useCart();
  const [budgetVal, setBudgetVal] = useState<string>('500'); // default budget

  const handleKeyPress = (val: string) => {
    setBudgetVal((prev) => {
      // Prevent leading zeros
      if (prev === '0') return val;
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setBudgetVal((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setBudgetVal('0');
  };

  const handleConfirm = async () => {
    const limit = Number(budgetVal);
    if (!isNaN(limit) && limit > 0) {
      await updateBudget(limit);
      navigate('/shopping');
    }
  };

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 text-center text-theme-text">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-theme-text">
          Enter Your Shopping Budget
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Specify a budget limit to track remaining spending capacity.
        </p>
      </div>

      {/* Calculator Display Panel */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-theme-card border border-theme-border">
        <div className="absolute top-2 left-3 text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
          <Wallet className="w-3 h-3" /> System Limit Lock
        </div>
        
        <div className="text-right text-3xl font-extrabold text-theme-text font-mono mt-2 tracking-tight select-none">
          Rs. {Number(budgetVal).toLocaleString()}
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="grid grid-cols-3 gap-3">
        {keypadKeys.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="h-14 rounded-2xl border border-theme-border bg-theme-card hover:bg-slate-100 dark:hover:bg-slate-850/60 active:scale-95 text-sm font-bold text-theme-text shadow-sm transition-all flex items-center justify-center"
          >
            {key}
          </button>
        ))}

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="h-14 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
        >
          C
        </button>

        {/* 0 Key */}
        <button
          onClick={() => handleKeyPress('0')}
          className="h-14 rounded-2xl border border-theme-border bg-theme-card hover:bg-slate-100 dark:hover:bg-slate-850/60 active:scale-95 text-sm font-bold text-theme-text shadow-sm transition-all flex items-center justify-center"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          onClick={handleBackspace}
          className="h-14 rounded-2xl border border-theme-border bg-theme-card hover:bg-slate-100 dark:hover:bg-slate-850/60 active:scale-95 text-theme-text shadow-sm active:scale-95 transition-all flex items-center justify-center"
        >
          <Delete className="w-4 h-4 text-slate-450" />
        </button>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={Number(budgetVal) <= 0}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
      >
        <Check className="w-4 h-4" /> Confirm Budget
      </button>

    </div>
  );
};

export default BudgetSetup;
