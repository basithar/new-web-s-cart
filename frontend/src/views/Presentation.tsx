import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Cpu, Wallet, CreditCard, AlertTriangle, 
  CheckCircle2, ArrowRight, RefreshCw, Smartphone, DollarSign, 
  Loader2, Key, HelpCircle, Scan, Trash2, Info, Wifi, WifiOff 
} from 'lucide-react';

interface CartItem {
  name: string;
  price: number;
  weight: number;
}

type Step = 'landing' | 'login' | 'dashboard' | 'paying' | 'receipt';

const Presentation: React.FC = () => {
  const [step, setStep] = useState<Step>('landing');
  const [esp32Connected, setEsp32Connected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('guest_shopper');
  const [password, setPassword] = useState<string>('••••••••');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [transactionId, setTransactionId] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');

  // Simulated items data
  const simulatedItems: CartItem[] = [
    { name: 'Maliban Chocolate Biscuit', price: 240, weight: 200 },
    { name: 'Brown Sugar', price: 140, weight: 500 },
    { name: 'LUX Soap', price: 170, weight: 100 }
  ];

  const totalPrice = 550;
  const totalWeight = 800;

  // Handle ESP32 connection simulation
  const handleConnectESP32 = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setEsp32Connected(true);
    }, 1200);
  };

  // Handle Shopper Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setTimeout(() => {
      setLoggingIn(false);
      setStep('dashboard');
    }, 1000);
  };

  // Handle Payment simulation
  const handlePayment = () => {
    setStep('paying');
    // Generate transaction metadata
    setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setTimestamp(new Date().toLocaleString());
    
    setTimeout(() => {
      setStep('receipt');
    }, 2000);
  };

  // Reset demo
  const handleReset = () => {
    setEsp32Connected(false);
    setStep('landing');
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden py-10 px-4 sm:px-6">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto my-auto z-10">
        
        {/* ─── PART 1: LANDING PAGE ─── */}
        {step === 'landing' && (
          <div className="space-y-10 animate-fade-in text-center">
            
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <ShoppingCart className="w-3.5 h-3.5" /> Presentation Mode
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                WELCOME TO SMART SHOPPING
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Follow this quick operational reference card to configure, control, and interact with the physical shopping cart terminal.
              </p>
            </div>

            {/* Instruction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">A</div>
                <h3 className="text-sm font-bold text-slate-200">Set a Budget</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Enter your shopping budget using the keypad and press 'A' to lock and confirm.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">B</div>
                <h3 className="text-sm font-bold text-slate-200">Backspace Entry</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Made an input error typing the budget? Press 'B' to delete the last character.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">C</div>
                <h3 className="text-sm font-bold text-slate-200">Clear Input</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Press 'C' to clear your current text field buffer entirely and restart budget typing.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">D</div>
                <h3 className="text-sm font-bold text-slate-200">Increase Budget</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Need more balance? Press 'D' at any time to add money directly to your budget.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">#</div>
                <h3 className="text-sm font-bold text-slate-200">Reset Session</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Press the '#' key on the cart keypad to completely reset logs and start a fresh session.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Scan className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-200">Scan & Add Items</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Scan an item's RFID tag on the reader. The screen shows product details and the Green LED blinks.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-200">Invalid Items</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Unknown scans trigger a flashing Red LED and prompt an error. Try another product.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-200">Remove Scans</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Press the Green Push Button and scan a previously added item again to remove it from the cart.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-455 flex items-center justify-center"><Info className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-200">Hardware Checkout</h3>
                <p className="text-[11px] text-slate-400 leading-normal">Press the Red Push Button to lock the cart, compare load cell weight, and proceed to pay.</p>
              </div>

            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                onClick={() => setStep('login')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/20 text-sm tracking-wider uppercase"
              >
                Proceed to Shopper Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ─── PART 2: SHOPPER LOGIN ─── */}
        {step === 'login' && (
          <div className="max-w-md w-full mx-auto animate-fade-in">
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-lg shadow-2xl space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Shopper Portal Authentication</h2>
                <p className="text-xs text-slate-400">Securely sign in to connect and review your smart cart telemetry</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shopper ID / Email</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all text-slate-200" 
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passcode</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all text-slate-200" 
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {loggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Login <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Go Back button */}
              <div className="text-center pt-2">
                <button 
                  onClick={() => setStep('landing')}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors font-medium underline"
                >
                  Back to Reference Instructions
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── PART 3: CART SIMULATION DASHBOARD ─── */}
        {step === 'dashboard' && (
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Dashboard Status Bar */}
            <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-850 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Terminal Kiosk: CART_001</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Live demonstration active</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ESP32 Status:</span>
                {esp32Connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-450 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <WifiOff className="w-3.5 h-3.5" />
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Product Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-850 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                      Scanned Cart Contents
                    </h4>
                    {!esp32Connected && (
                      <span className="text-[10px] text-slate-500 italic">Connect telemetry to load data</span>
                    )}
                  </div>

                  {!esp32Connected ? (
                    <div className="p-16 text-center bg-slate-950/40 border border-slate-850/65 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4">
                      <Cpu className="w-10 h-10 text-slate-650 animate-pulse" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-300">ESP32 Connection Pending</h5>
                        <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                          Click the link button on the right panel to establish scale load cell and RFID scanner database links.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto animate-fade-in">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wide">
                            <th className="pb-3 pl-2">Product Name</th>
                            <th className="pb-3 text-right">Weight (g)</th>
                            <th className="pb-3 text-right pr-2">Price (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/50">
                          {simulatedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/10 transition-colors">
                              <td className="py-3.5 pl-2 font-semibold text-slate-200">{item.name}</td>
                              <td className="py-3.5 text-right font-mono text-slate-300">{item.weight}g</td>
                              <td className="py-3.5 text-right font-extrabold text-white pr-2">Rs. {item.price}</td>
                            </tr>
                          ))}
                          {/* Aggregates Summary */}
                          <tr className="border-t border-slate-800 bg-slate-950/20 font-extrabold text-sm">
                            <td className="py-4 pl-3">Total Summary</td>
                            <td className="py-4 text-right font-mono text-emerald-400">{totalWeight}g</td>
                            <td className="py-4 text-right text-emerald-450 pr-3 font-mono">Rs. {totalPrice}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column - Simulator Settings & Action Gateway */}
              <div className="space-y-6">
                
                {/* ESP32 Connect controls */}
                <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-850 shadow-xl space-y-4 text-center">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider text-left">
                    Hardware Emulator
                  </h4>
                  <p className="text-[10px] text-slate-500 text-left leading-normal">
                    Simulate load cell weight synchronization and RFID data scan ingestion directly from a virtual microcontroller.
                  </p>

                  {!esp32Connected ? (
                    <button
                      onClick={handleConnectESP32}
                      disabled={connecting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Fetching Handshake...
                        </>
                      ) : (
                        <>
                          Connect ESP32 <Wifi className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-450 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ESP32 Linked Successfully
                    </div>
                  )}
                </div>

                {/* Verification Check & Checkout Gateway */}
                {esp32Connected && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Weight Verification Success Alert */}
                    <div className="p-4.5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/5 animate-pulse">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="tracking-wide">Weight is Matched! ✅</span>
                    </div>

                    {/* Checkout Trigger */}
                    <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-850 shadow-xl space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                        POS Payment Lock
                      </h4>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Checkout amount:</span>
                        <strong className="text-base text-white font-mono">Rs. {totalPrice}</strong>
                      </div>
                      <button
                        onClick={handlePayment}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        Proceed to Payment <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Logout anchor */}
            <div className="pt-2">
              <button 
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors font-semibold"
              >
                ← Disconnect Cart & Log Out
              </button>
            </div>

          </div>
        )}

        {/* ─── checkout loader state ─── */}
        {step === 'paying' && (
          <div className="max-w-sm w-full mx-auto p-8 rounded-3xl bg-slate-900/40 border border-slate-850 backdrop-blur-lg shadow-2xl text-center space-y-6 animate-fade-in">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Processing Transaction</h3>
              <p className="text-xs text-slate-400">Please authorize the secure contactless card or mobile wallet interface...</p>
            </div>
          </div>
        )}

        {/* ─── PART 4: RECEIPT GATEWAY ─── */}
        {step === 'receipt' && (
          <div className="max-w-md w-full mx-auto animate-fade-in">
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-lg shadow-2xl space-y-6">
              
              {/* Receipt Success Banner */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-md">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Payment Successful!</h2>
                <p className="text-xs text-slate-400 font-medium">Your retail transaction was processed successfully.</p>
              </div>

              {/* Digital Receipt Card */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-4 text-xs">
                
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60 text-[11px]">
                  <span className="font-bold text-slate-450 uppercase">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-300">{transactionId}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-450 font-bold uppercase">Timestamp</span>
                  <span className="text-slate-300 font-medium">{timestamp}</span>
                </div>

                <div className="space-y-2.5 py-3 border-y border-slate-800/60">
                  {simulatedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">{item.name}</span>
                      <span className="font-mono font-bold text-slate-200">Rs. {item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 uppercase font-bold">Total Weight</span>
                    <span className="font-mono font-bold text-slate-200">{totalWeight}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 uppercase font-bold">Payment Method</span>
                    <span className="font-bold text-emerald-400 uppercase">Card (Contactless)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-extrabold pt-2.5 border-t border-slate-850/50">
                    <span className="text-white">Amount Charged</span>
                    <span className="text-emerald-400 font-mono">Rs. {totalPrice}</span>
                  </div>
                </div>

              </div>

              {/* Reset Kiosk Action */}
              <button
                onClick={handleReset}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider"
              >
                Done & Reset View
              </button>

            </div>
          </div>
        )}

      </div>

      {/* Footer copyright metadata details */}
      <div className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase mt-8 z-10">
        Smart Cart presentation • Sri Lankan Rupees (Rs.)
      </div>

      {/* Keyframe Animations Injector */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
};

export default Presentation;
