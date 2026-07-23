import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Home, Printer, Download, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeReceipt, clearActiveReceipt } = useCart();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  // Extract dynamically passed state from Checkout.tsx
  const stateData = location.state || {};
  const passedCartItems = stateData.cartItems || [];
  const passedTotalSpent = stateData.totalSpent || 0;
  const passedExpectedWeight = stateData.expectedWeight || 0;

  // Generate Confetti Particles on Mount
  useEffect(() => {
    const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2.5,
      size: 5 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  const handleReturnHome = () => {
    clearActiveReceipt();
    navigate('/');
  };

  // Format receipt items dynamically from passed cartItems
  const dynamicItems = passedCartItems.length > 0
    ? passedCartItems.map((i: any) => {
        const prod = i.product || i;
        return {
          productName: prod.name || 'Scanned Item',
          price: Number(prod.price || 0),
          quantity: Number(i.quantity || 1)
        };
      })
    : (activeReceipt?.items || []);

  const receipt = {
    transactionId: stateData.transactionId || activeReceipt?.transactionId || `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    orderNumber: stateData.orderNumber || activeReceipt?.orderNumber || `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
    totalPaid: passedTotalSpent || activeReceipt?.totalPaid || dynamicItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
    totalWeight: passedExpectedWeight || activeReceipt?.totalWeight || 0,
    createdAt: new Date().toISOString(),
    customerName: stateData.customerName || activeReceipt?.customerName || 'Smart Customer',
    paymentMethod: stateData.paymentMethod || activeReceipt?.paymentMethod || 'Credit Card',
    items: dynamicItems.length > 0 ? dynamicItems : [{ productName: 'Scanned Supermarket Items', price: passedTotalSpent || 0, quantity: 1 }],
  };

  const handleDownloadReceipt = () => {
    const separator = "========================================";
    const border = "----------------------------------------";
    const lines = [
      separator,
      "         SMART SHOPPING CART            ",
      "          Kiosk POS Receipt             ",
      separator,
      `Order Number   : ${receipt.orderNumber || 'N/A'}`,
      `Transaction ID : ${receipt.transactionId}`,
      `Date           : ${new Date(receipt.createdAt).toLocaleString()}`,
      `Customer Name  : ${receipt.customerName}`,
      `Payment Method : ${receipt.paymentMethod || 'Simulated Card'}`,
      `Total Weight   : ${receipt.totalWeight || 0}g`,
      `Payment Status : Success`,
      border,
      "PRODUCTS PURCHASED:",
    ];

    receipt.items?.forEach((item: any) => {
      const name = item.productName.substring(0, 20).padEnd(20);
      const qty = `x${item.quantity}`.padEnd(5);
      const price = `Rs. ${(item.price * item.quantity).toLocaleString()}`;
      lines.push(` - ${name} ${qty} ${price}`);
    });

    lines.push(border);
    lines.push(`Total Paid Amount: Rs. ${receipt.totalPaid.toLocaleString()}`);
    lines.push(separator);
    lines.push("       Thank You for Shopping!          ");
    lines.push("       Demo Kiosk Platform v1.0         ");
    lines.push(separator);

    const blob = new Blob([lines.join("\n")], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receipt.orderNumber || receipt.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8 text-center text-theme-text transition-colors duration-300 relative">
      
      {/* Self-contained CSS Confetti Keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
      `}</style>

      {/* Confetti Container */}
      <div className="fixed inset-0 pointer-events-none z-[1500] overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 rounded-full animate-confetti-fall"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: 0.75,
            }}
          />
        ))}
      </div>

      {/* Animated Success Checkmark Header */}
      <div className="space-y-3">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5 animate-bounce-slow">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-theme-text">
          ✅ Payment Successful
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wide">
          Thank you for shopping at our Smart Supermarket kiosk.
        </p>
      </div>

      {/* Digital Receipt Card */}
      <div className="glass-panel rounded-3xl p-6 text-left border border-theme-border relative overflow-hidden space-y-4 shadow-xl text-xs font-mono bg-theme-card">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
        
        <div className="border-b border-dashed border-theme-border pb-4 flex justify-between items-start relative z-10 font-sans">
          <div>
            <h4 className="font-extrabold text-theme-text text-sm">SMART CART RECEIPT</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Order: {receipt.orderNumber || 'N/A'}</p>
          </div>
          <span className="text-[10px] text-slate-400 text-right font-mono">
            {new Date(receipt.createdAt).toLocaleDateString()}<br />
            {new Date(receipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Receipt items list */}
        <div className="space-y-3 relative z-10 border-b border-dashed border-theme-border pb-4">
          {receipt.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-slate-500 dark:text-slate-350">
              <span className="truncate max-w-[200px]">{item.productName} x{item.quantity}</span>
              <span className="font-semibold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Audit Meta Parameters */}
        <div className="space-y-2 relative z-10 font-sans text-xs border-b border-dashed border-theme-border pb-4">
          <div className="flex justify-between text-slate-400">
            <span>Customer Name:</span>
            <span className="text-theme-text font-extrabold">{receipt.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Transaction ID:</span>
            <span className="text-theme-text font-mono font-bold">{receipt.transactionId}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Payment Method:</span>
            <span className="text-theme-text font-bold">{receipt.paymentMethod || 'Simulated Card'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Total Measured Weight:</span>
            <span className="text-theme-text font-bold">{receipt.totalWeight || 0}g</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Payment Status:</span>
            <span className="badge-success text-[8px] font-extrabold py-0.5 px-2">Success</span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center pt-2 font-sans">
          <span className="font-extrabold text-theme-text text-sm">Amount Paid:</span>
          <span className="font-extrabold text-emerald-500 text-base">Rs. {receipt.totalPaid.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => window.print()}
          className="flex-1 glass-button-secondary text-xs font-bold py-3.5"
        >
          <Printer className="w-4 h-4 text-emerald-500" /> Print Receipt
        </button>

        <button
          onClick={handleDownloadReceipt}
          className="flex-1 glass-button-secondary text-xs font-bold py-3.5"
        >
          <Download className="w-4 h-4 text-emerald-500" /> Download Receipt
        </button>
      </div>

      <button
        onClick={handleReturnHome}
        className="w-full glass-button text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10 py-3.5 flex items-center justify-center gap-1.5"
      >
        <Home className="w-4 h-4" /> Back to Home Portal
      </button>

    </div>
  );
};

export default Success;
