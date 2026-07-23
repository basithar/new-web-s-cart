import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Mail, Phone, ShoppingBag, CreditCard, 
  Wallet, ShieldCheck, ArrowLeft, DollarSign,
  Smartphone, AlertCircle, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, processCheckout } = useCart();
  const { triggerLocalNotification } = useSocket();

  // Extract cart data passed via route state from Shopping.tsx
  const stateCartData = location.state || {};
  const passedCartItems = stateCartData.cartItems || [];
  const passedTotal = stateCartData.totalSpent || 0;
  const passedWeight = stateCartData.expectedWeight || 0;
  const passedBudget = stateCartData.budget || 0;

  // Real-Time Security Telemetry State
  const [livePhysicalWeight, setLivePhysicalWeight] = useState<number | null>(null);
  const [securityAlert, setSecurityAlert] = useState<boolean>(false);

  // Firebase RTDB Listener for Live Security Telemetry on Checkout
  useEffect(() => {
    if (!rtdb) return;
    const kioskStatusRef = ref(rtdb, 'kiosk_status/CART_001');
    const unsubscribe = onValue(kioskStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val.physicalWeight !== undefined && val.physicalWeight !== null) {
          setLivePhysicalWeight(Number(val.physicalWeight));
        } else if (val.lastWeightReading !== undefined && val.lastWeightReading !== null) {
          setLivePhysicalWeight(Number(val.lastWeightReading));
        }

        if (val.securityAlert !== undefined) {
          setSecurityAlert(Boolean(val.securityAlert));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Payment Method Selection ('Credit Card' | 'Debit Card' | 'Mobile Wallet' | 'Cash on Delivery')
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'Mobile Wallet' | 'Cash on Delivery'>('Credit Card');

  // Card Payment Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Mobile Wallet State
  const [walletProvider, setWalletProvider] = useState('Google Pay');
  const [walletId, setWalletId] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Simulated Payment Overlay State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [paymentStep, setPaymentStep] = useState('Connecting to Payment Server...');

  // Set initial customer data from context if available
  useEffect(() => {
    // Attempt to seed name if logged in
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCustomerName(u.name || '');
        setEmail(u.email || '');
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(value);
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    
    // Customer Validation
    if (!customerName.trim()) tempErrors.customerName = 'Customer Name is required.';
    if (!phone.trim()) tempErrors.phone = 'Phone Number is required.';
    else if (!/^\d{10}$/.test(phone.trim())) tempErrors.phone = 'Phone Number must be exactly 10 digits.';
    
    if (!email.trim()) tempErrors.email = 'Email Address is required.';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) tempErrors.email = 'Invalid email address format.';

    // Payment Specific Validation
    if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
      if (!cardName.trim()) tempErrors.cardName = 'Cardholder Name is required.';
      if (!cardNumber.trim()) tempErrors.cardNumber = 'Card Number is required.';
      else if (cardNumber.replace(/\s+/g, '').length !== 16) tempErrors.cardNumber = 'Card Number must be 16 digits.';
      
      if (!cardExpiry.trim()) tempErrors.cardExpiry = 'Expiry Date is required.';
      else if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) tempErrors.cardExpiry = 'Expiry must be in MM/YY format.';
      
      if (!cardCvv.trim()) tempErrors.cardCvv = 'CVV code is required.';
      else if (cardCvv.length !== 3) tempErrors.cardCvv = 'CVV must be 3 digits.';
    } else if (paymentMethod === 'Mobile Wallet') {
      if (!walletId.trim()) tempErrors.walletId = 'Wallet identifier/Phone number is required.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark everything as touched
    setTouched({
      customerName: true,
      phone: true,
      email: true,
      cardName: true,
      cardNumber: true,
      cardExpiry: true,
      cardCvv: true,
      walletId: true
    });

    if (!validate()) {
      triggerLocalNotification('error', 'Validation Failed', 'Please fix the errors in the checkout form.');
      return;
    }

    if (cart?.weightMismatch) {
      triggerLocalNotification('error', 'Payment Blocked', 'Weight mismatch detected. Please rescan or remove unscanned items.');
      return;
    }

    // Launch Simulated Payment Overlay
    setIsProcessing(true);
    setPaymentProgress(0);
    setPaymentStep('Connecting to Payment Server...');
  };

  // Simulated Payment Server Step-by-Step Loop
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setPaymentProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          completeCheckout();
          return 100;
        }

        // Update progress step description
        if (next < 35) {
          setPaymentStep('Connecting to Payment Server...');
        } else if (next < 75) {
          setPaymentStep('Verifying Card Security Credentials...');
        } else {
          setPaymentStep('Payment Approved! Finalizing Order & Notifying Hardware...');
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const completeCheckout = async () => {
    try {
      // Send Payment Completed signal to backend & ESP32 hardware
      try {
        await axios.post(`${API_URL}/cart/pay`, {
          cartId: 'CART_001',
          paymentMethod
        });
        console.log('✅ Sent payment completed signal to /api/cart/pay');
      } catch (payErr) {
        console.warn('⚠️ Could not post to /api/cart/pay:', payErr);
      }

      // Mock generated IDs to look highly professional
      const customTxnId = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const customOrderNo = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;

      await processCheckout(customerName, phone, email, {
        transactionId: customTxnId,
        orderNumber: customOrderNo,
        paymentMethod: paymentMethod,
        paymentStatus: 'Success'
      });

      triggerLocalNotification('success', 'Payment Successful', 'Payment signal sent to ESP32 hardware!');
      // Navigate to Success receipts view passing cartItems, totalSpent, expectedWeight
      navigate('/success', {
        state: {
          cartItems: items,
          totalSpent: total,
          expectedWeight: passedWeight || (cart?.expectedWeight || items.reduce((sum: number, i: any) => sum + (Number((i.product || i).weight || 0) * Number(i.quantity || 1)), 0)),
          customerName,
          phone,
          email,
          paymentMethod,
          transactionId: customTxnId,
          orderNumber: customOrderNo
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      triggerLocalNotification('error', 'Checkout Failed', err.message);
    }
  };

  // Combine items from passed route state or cart context
  const items = passedCartItems.length > 0 ? passedCartItems : (cart?.items || []);
  const total = passedTotal > 0 ? passedTotal : (cart?.totalAmount || items.reduce((sum: number, i: any) => sum + (Number((i.product || i).price || 0) * Number(i.quantity || 1)), 0));
  const budget = passedBudget > 0 ? passedBudget : (cart?.budget || 0);
  const remaining = budget - total;

  // Real-time security calculation
  const currentPhysicalWeight = livePhysicalWeight !== null ? livePhysicalWeight : (cart?.physicalWeight || 0);
  const expectedWeight = passedWeight || cart?.expectedWeight || items.reduce((sum: number, i: any) => sum + (Number((i.product || i).weight || 0) * Number(i.quantity || 1)), 0);
  const isWeightValid = !securityAlert && Math.abs(currentPhysicalWeight - expectedWeight) <= 50;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 pt-12 text-theme-text">
        <div className="w-12 h-12 bg-theme-card border border-theme-border flex items-center justify-center rounded-full mx-auto">
          <ShoppingBag className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="font-bold text-theme-text">Checkout is not available</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">Your shopping cart is empty. Please add items before checking out.</p>
        <button
          onClick={() => navigate('/shopping')}
          className="glass-button text-xs font-semibold px-6 py-2 mx-auto"
        >
          Return to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-theme-text transition-colors duration-300 relative">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/shopping')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-bold"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Cart
      </button>

      {/* Real-Time Security Alert Banner */}
      {(!isWeightValid || securityAlert) && (
        <div className="p-5 rounded-2xl bg-rose-500/15 border-2 border-rose-500 text-rose-500 font-extrabold text-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-extrabold uppercase tracking-wide text-xs">SECURITY ALERT: UNSCANNED ITEM DETECTED</h4>
              <p className="text-xs font-semibold mt-0.5">SECURITY ALERT: Unscanned item detected! Please remove the item to proceed with payment.</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] uppercase font-bold tracking-widest inline-block">
              Live Weight: {currentPhysicalWeight}g
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Expected: {expectedWeight}g</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Checkout Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Customer Form */}
          <div className="glass-panel rounded-3xl p-6 space-y-6 bg-theme-card border-theme-border text-left">
            <div>
              <h4 className="font-extrabold text-theme-text flex items-center gap-2">
                <User className="text-emerald-500" /> 1. Customer Information
              </h4>
              <p className="text-xs text-slate-400 mt-1">Complete shopper profile credentials for receipt billing logs.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (touched.customerName) validate();
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, customerName: true }))}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 ${
                      errors.customerName ? 'border-rose-500/50' : 'border-theme-border'
                    }`}
                  />
                </div>
                {errors.customerName && (
                  <span className="text-[10px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.customerName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number..."
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (touched.phone) validate();
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 ${
                        errors.phone ? 'border-rose-500/50' : 'border-theme-border'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-[10px] text-rose-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="shopper@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) validate();
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 ${
                        errors.email ? 'border-rose-500/50' : 'border-theme-border'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[10px] text-rose-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method Select */}
          <div className="glass-panel rounded-3xl p-6 space-y-6 bg-theme-card border-theme-border text-left">
            <div>
              <h4 className="font-extrabold text-theme-text flex items-center gap-2">
                <CreditCard className="text-emerald-500" /> 2. Payment Method
              </h4>
              <p className="text-xs text-slate-400 mt-1">Select your preferred transaction gateway simulator.</p>
            </div>

            {/* Methods Grid Selectors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
                { id: 'Debit Card', label: 'Debit Card', icon: CreditCard },
                { id: 'Mobile Wallet', label: 'Mobile Wallet', icon: Smartphone },
                { id: 'Cash on Delivery', label: 'Cash / COD', icon: DollarSign },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      setErrors({});
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                      active 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/5 scale-102' 
                        : 'bg-theme-bg border-theme-border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Card Payment Form fields */}
            {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
              <div className="pt-4 border-t border-theme-border grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                
                {/* Dynamic Credit Card Visual */}
                <div className="md:col-span-2">
                  <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 p-6 text-white border border-slate-800 shadow-xl overflow-hidden font-mono flex flex-col justify-between select-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase opacity-60 tracking-wider">Supermarket Kiosk</p>
                        <div className="w-10 h-7 bg-amber-500/20 rounded-md border border-amber-500/30"></div>
                      </div>
                      <span className="text-sm font-extrabold italic text-slate-300">
                        {paymentMethod === 'Credit Card' ? 'CREDIT' : 'DEBIT'}
                      </span>
                    </div>
                    
                    <div className="text-sm tracking-[0.2em] font-medium my-2">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-[8px] uppercase opacity-55">Holder Name</p>
                        <p className="text-[10px] font-bold tracking-wider uppercase truncate">
                          {cardName || 'JOHN DOE'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[8px] uppercase opacity-55">Expires</p>
                        <p className="text-[10px] font-bold">
                          {cardExpiry || 'MM/YY'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-3 space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        if (touched.cardName) validate();
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, cardName: true }))}
                      className={`w-full px-4 py-2.5 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 ${
                        errors.cardName ? 'border-rose-500/50' : 'border-theme-border'
                      }`}
                    />
                    {errors.cardName && <span className="text-[9px] text-rose-500">{errors.cardName}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Card Number</label>
                    <input
                      type="text"
                      placeholder="4111 1111 1111 1111"
                      value={cardNumber}
                      onChange={(e) => {
                        handleCardNumberChange(e);
                        if (touched.cardNumber) validate();
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, cardNumber: true }))}
                      className={`w-full px-4 py-2.5 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 font-mono ${
                        errors.cardNumber ? 'border-rose-500/50' : 'border-theme-border'
                      }`}
                    />
                    {errors.cardNumber && <span className="text-[9px] text-rose-500">{errors.cardNumber}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          handleExpiryChange(e);
                          if (touched.cardExpiry) validate();
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, cardExpiry: true }))}
                        className={`w-full px-4 py-2.5 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 font-mono text-center ${
                          errors.cardExpiry ? 'border-rose-500/50' : 'border-theme-border'
                        }`}
                      />
                      {errors.cardExpiry && <span className="text-[9px] text-rose-500">{errors.cardExpiry}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CVV / CVN</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => {
                          handleCvvChange(e);
                          if (touched.cardCvv) validate();
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, cardCvv: true }))}
                        className={`w-full px-4 py-2.5 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 font-mono text-center ${
                          errors.cardCvv ? 'border-rose-500/50' : 'border-theme-border'
                        }`}
                      />
                      {errors.cardCvv && <span className="text-[9px] text-rose-500">{errors.cardCvv}</span>}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Mobile Wallet Layout Selection */}
            {paymentMethod === 'Mobile Wallet' && (
              <div className="pt-4 border-t border-theme-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet Provider</label>
                    <select
                      value={walletProvider}
                      onChange={(e) => setWalletProvider(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Google Pay">Google Pay</option>
                      <option value="PayPal">PayPal</option>
                      <option value="UPI Pay">UPI / GPay / PhonePe</option>
                      <option value="Paytm">Paytm Wallet</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet ID / Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI_ID@okaxis or 9876543210"
                      value={walletId}
                      onChange={(e) => {
                        setWalletId(e.target.value);
                        if (touched.walletId) validate();
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, walletId: true }))}
                      className={`w-full px-4 py-2.5 rounded-xl bg-theme-bg border text-xs text-theme-text focus:outline-none focus:border-emerald-500 ${
                        errors.walletId ? 'border-rose-500/50' : 'border-theme-border'
                      }`}
                    />
                    {errors.walletId && <span className="text-[9px] text-rose-500">{errors.walletId}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Cash on Delivery Selection */}
            {paymentMethod === 'Cash on Delivery' && (
              <div className="pt-4 border-t border-theme-border p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <h5 className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Kiosk Cash Payment Selected
                </h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">
                  No immediate digital authorization is required. Please print your digital invoice and complete the cash payment of <strong className="text-theme-text">Rs. {total.toLocaleString()}</strong> at the kiosk cashier counter checkout terminal.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Order Summary & Pay button */}
        <div className="space-y-4">
          
          <div className="glass-panel rounded-3xl p-6 space-y-6 bg-theme-card border-theme-border text-left">
            <h4 className="font-extrabold text-theme-text border-b border-theme-border pb-3 flex items-center gap-2">
              <ShoppingBag className="text-emerald-500" /> Order Summary
            </h4>

            {/* Cart items list */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {items.map((item: any, idx: number) => {
                const prod = item.product || item;
                return (
                  <div key={prod._id || prod.uid || idx} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-theme-text truncate max-w-[140px]">{prod.name || 'Scanned Item'}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Qty: {item.quantity || 1}</p>
                    </div>
                    <span className="font-extrabold text-slate-550 dark:text-slate-350">
                      Rs. {(prod.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-theme-border pt-4 space-y-2.5 text-xs font-semibold text-slate-400">
              <div className="flex justify-between">
                <span>Cart Total Amount:</span>
                <span className="font-extrabold text-theme-text">Rs. {total.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Remaining Budget:</span>
                <span className={`font-extrabold ${remaining < 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                  Rs. {remaining.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between border-t border-theme-border pt-2">
                <span>Expected Weight:</span>
                <span className="text-theme-text font-bold">
                  {passedWeight || cart?.expectedWeight || items.reduce((sum: number, i: any) => sum + (Number((i.product || i).weight || 0) * Number(i.quantity || 1)), 0)}g
                </span>
              </div>

              <div className="flex justify-between">
                <span>Scale Telemetry:</span>
                <span className={`font-extrabold ${!isWeightValid || securityAlert ? 'text-rose-500 font-extrabold animate-pulse' : 'text-theme-text'}`}>
                  {currentPhysicalWeight}g
                </span>
              </div>

              <div className="flex justify-between">
                <span>Weight Verification:</span>
                <span className={`font-extrabold uppercase ${!isWeightValid || securityAlert ? 'text-rose-500 font-extrabold animate-pulse' : 'text-emerald-500'}`}>
                  {!isWeightValid || securityAlert ? 'SECURITY ALERT' : 'VERIFIED'}
                </span>
              </div>

              <div className="flex justify-between border-t border-theme-border pt-3 text-sm">
                <span className="font-extrabold text-theme-text">Total Bill:</span>
                <span className="font-extrabold text-emerald-500 text-sm">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[10px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              Supermarket POS Secure verification checked.
            </div>

            {/* Pay Button */}
            <button
              onClick={handleSubmit}
              disabled={!isWeightValid || securityAlert || isProcessing}
              className={`w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                !isWeightValid || securityAlert 
                  ? 'bg-rose-500/40 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/10'
              }`}
            >
              <CreditCard className="w-4 h-4" /> {!isWeightValid || securityAlert ? 'Payment Blocked (Remove Unscanned Item)' : `Pay Now (Rs. ${total.toLocaleString()})`}
            </button>
          </div>

        </div>

      </div>

      {/* Simulated Payment Processing Overlay Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="glass-panel bg-theme-card border border-theme-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
            
            {/* Glowing background circles */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
              <h3 className="text-xl font-extrabold text-theme-text">Processing Payment...</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Please Wait. Do not close this browser tab.</p>
            </div>

            {/* Status Steps Indicator */}
            <div className="p-4 rounded-2xl bg-theme-bg border border-theme-border text-xs text-slate-400 font-semibold space-y-1">
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-extrabold block">Current Status</span>
              <p className="text-theme-text font-bold transition-all duration-300 animate-pulse">{paymentStep}</p>
            </div>

            {/* Simulated progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-450">
                <span>Verification Progress</span>
                <span>{paymentProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-150 ease-out" 
                  style={{ width: `${paymentProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
