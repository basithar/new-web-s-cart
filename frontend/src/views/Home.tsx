import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Delete, RefreshCw, PlusCircle, RotateCcw, 
  Scan, AlertTriangle, MinusCircle, CreditCard, ArrowRight,
  Info, Cpu, ShoppingCart, HelpCircle
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Instructions data
  const instructions = [
    {
      title: "Set a Budget",
      desc: "Enter your shopping budget using the keypad and press 'A' to confirm.",
      icon: Wallet,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/20"
    },
    {
      title: "Backspace",
      desc: "If you make a mistake while typing, press 'B' to delete the last number.",
      icon: Delete,
      color: "from-rose-500/10 to-orange-500/10 text-rose-500 border-rose-500/20"
    },
    {
      title: "Clear Input",
      desc: "Press 'C' to clear your current entry and type again.",
      icon: RefreshCw,
      color: "from-amber-500/10 to-yellow-500/10 text-amber-500 border-amber-500/20"
    },
    {
      title: "Increase Budget",
      desc: "Press 'D' at any time to add more money to your budget.",
      icon: PlusCircle,
      color: "from-sky-500/10 to-indigo-500/10 text-sky-500 border-sky-500/20"
    },
    {
      title: "Reset Cart",
      desc: "Press '#' to completely reset the cart and start a new session.",
      icon: RotateCcw,
      color: "from-violet-500/10 to-purple-500/10 text-violet-500 border-violet-500/20"
    },
    {
      title: "Scan & Add Items",
      desc: "Scan an item's RFID tag. If valid, details will show, and Green LED blinks.",
      icon: Scan,
      color: "from-green-500/10 to-emerald-500/10 text-green-500 border-green-500/20"
    },
    {
      title: "Invalid Items",
      desc: "If the item is invalid, Red LED will blink and prompt to try another item.",
      icon: AlertTriangle,
      color: "from-red-500/10 to-rose-500/10 text-red-500 border-red-500/20"
    },
    {
      title: "Remove Items",
      desc: "Press the Green Button on the cart and scan an item to remove it.",
      icon: MinusCircle,
      color: "from-cyan-500/10 to-blue-500/10 text-cyan-500 border-cyan-500/20"
    },
    {
      title: "Checkout",
      desc: "Press the Red Button to end shopping and proceed to kiosk checkout.",
      icon: CreditCard,
      color: "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-500 border-fuchsia-500/20"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6 text-theme-text text-left relative transition-colors duration-300">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* Main Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-6">
        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} /> Mr.B Smart Cart Presentation
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent leading-tight uppercase">
          WELCOME TO SMART SHOPPING
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
          Experience the future of retail with the Mr.B Smart Shopping Cart. Seamless RFID item scanning, automated weight-sensor verification, and offline digital checkouts.
        </p>
      </div>

      {/* About Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 bg-theme-card border-theme-border relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/5 border border-emerald-500/15">
            <Info className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-extrabold text-theme-text uppercase tracking-wider">About the Smart Shopping Cart</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              The Smart Shopping Cart system utilizes an ESP32-S3 microcontroller coupled with an MFRC522 RFID reader and a high-precision HX711 load cell weight scale. When products are placed in the physical cart, their RFID tags are parsed, and the database computes the expected total weight. The weight scale constantly monitors telemetry to prevent theft or discrepancy, only releasing the transaction to the checkout POS terminal when all items are verified.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Instructions */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-theme-border pb-3">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-extrabold text-theme-text tracking-wide uppercase">Operational Instructions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructions.map((inst, idx) => {
            const Icon = inst.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel rounded-3xl p-6 bg-theme-card hover:bg-slate-500/5 border border-theme-border hover:border-emerald-500/30 transition-all duration-300 shadow-md flex flex-col justify-between space-y-4 group hover:scale-[1.02]"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${inst.color} flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-theme-text group-hover:text-emerald-500 transition-colors uppercase tracking-wider">{inst.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {inst.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center pt-4 pb-8">
        <button
          onClick={() => navigate('/login')}
          className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center gap-2.5 mx-auto hover:shadow-emerald-600/35 cursor-pointer"
        >
          <ShoppingCart className="w-4.5 h-4.5 text-white" /> Proceed to Shopper Login <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};

export default Home;
