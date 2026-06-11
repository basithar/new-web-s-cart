import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

export interface CartData {
  cartId: string;
  items: Array<{
    product: {
      _id: string;
      rfidUid: string;
      productName: string;
      price: number;
      weight: number;
      expiryDate: string;
      category: string;
      image: string;
    };
    quantity: number;
  }>;
  budget: number;
  totalAmount: number;
  expectedWeight: number;
  physicalWeight: number;
  weightMismatch: boolean;
  status: 'active' | 'checkout' | 'completed';
}

export interface ESP32Status {
  connected: boolean;
  wifiStatus: 'Connected' | 'Disconnected';
  rssi: number;
  lastRfidUid: string;
  lastScanTime: string;
}

export interface RFIDScanLog {
  _id: string;
  uid: string;
  timestamp: string;
  success: boolean;
  productName?: string;
}

interface CartContextType {
  cartId: string;
  cart: CartData | null;
  loading: boolean;
  scanHistory: RFIDScanLog[];
  esp32Status: ESP32Status | null;
  activeReceipt: any | null;
  setCartSession: (id: string) => void;
  updateBudget: (limit: number) => Promise<void>;
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>;
  processCheckout: (
    customerName: string, 
    phone: string, 
    email: string,
    extraData?: {
      transactionId?: string;
      orderNumber?: string;
      paymentMethod?: string;
      paymentStatus?: string;
    }
  ) => Promise<any>;
  simulateScan: (uid: string) => Promise<void>;
  simulateWeightUpdate: (weight: number) => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  fetchEsp32Status: () => Promise<void>;
  clearActiveReceipt: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserBudget } = useAuth();
  const { socket, triggerLocalNotification } = useSocket();
  const [cartId, setCartId] = useState<string>(() => localStorage.getItem('cart_id') || 'CART_001');
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanHistory, setScanHistory] = useState<RFIDScanLog[]>([]);
  const [esp32Status, setEsp32Status] = useState<ESP32Status | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const fetchCartDetails = async (id: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cart/${id}`);
      setCart(response.data.cart);
    } catch (err) {
      console.error('Failed to load cart from DB:', err);
      // Fallback local cart state
      setCart({
        cartId: id,
        items: [],
        budget: user?.budgetLimit || 0,
        totalAmount: 0,
        expectedWeight: 0,
        physicalWeight: 0,
        weightMismatch: false,
        status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/rfid/history`);
      setScanHistory(response.data);
    } catch (err) {
      console.error('Failed to load RFID scanning history:', err);
    }
  };

  const fetchEsp32Status = async () => {
    try {
      const response = await axios.get(`${API_URL}/esp32/status`);
      setEsp32Status(response.data);
    } catch (err) {
      console.error('Failed to query ESP32 status:', err);
    }
  };

  useEffect(() => {
    fetchCartDetails(cartId);
    fetchScanHistory();
    fetchEsp32Status();
    localStorage.setItem('cart_id', cartId);
  }, [cartId]);

  // Periodic poll for ESP32 connection heartbeat status (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEsp32Status();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time update listeners via Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Join room for this cart ID
    socket.emit('join_cart', cartId);

    socket.on('cart_updated', (updatedCart: CartData) => {
      console.log('⚡ Cart updated via Socket.IO:', updatedCart);
      setCart(updatedCart);
      fetchScanHistory(); // Reload history on scan updates
      fetchEsp32Status(); // Sync ESP32 status on scan updates
    });

    return () => {
      socket.emit('leave_cart', cartId);
      socket.off('cart_updated');
    };
  }, [socket, cartId]);

  const setCartSession = (id: string) => {
    setCartId(id);
  };

  const updateBudget = async (budget: number) => {
    try {
      await axios.post(`${API_URL}/cart/budget`, { cartId, budget });
      if (user) await updateUserBudget(budget);
    } catch (err) {
      console.error(err);
      if (cart) setCart({ ...cart, budget });
    }
  };

  const updateItemQuantity = async (productId: string, quantity: number) => {
    try {
      await axios.post(`${API_URL}/cart/quantity`, { cartId, productId, quantity });
    } catch (err) {
      console.error(err);
    }
  };

  const processCheckout = async (
    customerName: string, 
    phone: string, 
    email: string,
    extraData?: {
      transactionId?: string;
      orderNumber?: string;
      paymentMethod?: string;
      paymentStatus?: string;
    }
  ) => {
    if (!cart || cart.items.length === 0) return;
    try {
      const response = await axios.post(`${API_URL}/payment/process`, {
        cartId,
        customerName,
        phone,
        email,
        ...extraData
      });

      if (response.data.success) {
        setActiveReceipt(response.data.transaction);
        triggerLocalNotification('success', 'Payment Completed', 'Order processed successfully.');
        return response.data.transaction;
      }
    } catch (err: any) {
      triggerLocalNotification('error', 'Checkout Error', err.response?.data?.error || err.message);
      throw err;
    }
  };

  const simulateScan = async (uid: string) => {
    try {
      await axios.post(`${API_URL}/rfid/scan`, { cartId, uid });
    } catch (err: any) {
      triggerLocalNotification('error', 'RFID Scan Failed', err.response?.data?.error || err.message);
    }
  };

  const simulateWeightUpdate = async (physicalWeight: number) => {
    try {
      await axios.post(`${API_URL}/cart/weight-update`, { cartId, physicalWeight });
    } catch (err) {
      console.error(err);
    }
  };

  const clearActiveReceipt = () => {
    setActiveReceipt(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartId,
        cart,
        loading,
        scanHistory,
        esp32Status,
        activeReceipt,
        setCartSession,
        updateBudget,
        updateItemQuantity,
        processCheckout,
        simulateScan,
        simulateWeightUpdate,
        fetchScanHistory,
        fetchEsp32Status,
        clearActiveReceipt,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
