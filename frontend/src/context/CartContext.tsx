import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { db, rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';

export interface CartData {
  cartId: string;
  items: Array<{
    product: {
      _id: string;
      uid: string;
      name: string;
      price: number;
      weight: number;
      stock: number;
      category: string;
      imageUrl: string;
    };
    quantity: number;
  }>;
  budget: number;
  totalAmount: number;
  expectedWeight: number;
  physicalWeight: number;
  weightMismatch: boolean;
  status: 'pending' | 'active' | 'stopped' | 'checkout' | 'completed' | 'ready_for_payment' | 'weight_mismatch' | 'shopping';
  lastActive?: string;
  lastSeen?: string;
  weightMatch?: boolean;
}

export interface ESP32Status {
  connected: boolean;
  wifiStatus: 'Connected' | 'Disconnected';
  rssi: number;
  lastRfidUid: string;
  lastScanTime: string;
  lastWeightReading?: number;
  currentShoppingSession?: string;
  lastActive?: string;
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

  startShopping: () => Promise<void>;
  stopShopping: (physicalWeight: number) => Promise<void>;
  resumeShopping: () => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  fetchEsp32Status: () => Promise<void>;
  clearActiveReceipt: () => void;
}

import { API_URL } from '../config';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserBudget } = useAuth();
  const { socket, triggerLocalNotification } = useSocket();
  const [cartId, setCartId] = useState<string>(() => localStorage.getItem('cart_id') || 'CART_001');
  
  const normalizeCart = (cartData: any): CartData | null => {
    if (!cartData) return null;
    
    if (cartData.items && cartData.items.length > 0 && cartData.items[0].product) {
      return cartData as CartData;
    }
    
    const items = cartData.items || [];
    const groupedMap = new Map();
    for (const item of items) {
      const uid = item.uid || item.productId || 'unknown';
      if (groupedMap.has(uid)) {
        groupedMap.get(uid).quantity += 1;
      } else {
        groupedMap.set(uid, {
          product: {
            _id: uid,
            uid: uid,
            name: item.name || 'Unknown Item',
            price: item.price || 0,
            weight: item.weight || 0,
            stock: 100,
            category: 'General',
            imageUrl: ''
          },
          quantity: 1
        });
      }
    }
    
    return {
      cartId: cartData.cartId || 'CART_001',
      items: Array.from(groupedMap.values()),
      budget: cartData.budget || 0,
      totalAmount: cartData.totalPrice !== undefined ? cartData.totalPrice : (cartData.totalAmount || 0),
      expectedWeight: cartData.totalWeight !== undefined ? cartData.totalWeight : (cartData.expectedWeight || 0),
      physicalWeight: cartData.physicalWeight || 0,
      weightMismatch: cartData.weightMatch !== undefined ? !cartData.weightMatch : (cartData.weightMismatch || false),
      status: cartData.status || 'active'
    };
  };

  const [cart, setCartState] = useState<CartData | null>(null);
  const setCart = (c: any) => {
    setCartState(normalizeCart(c));
  };

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

  // Real-time listener for cart updates in Firestore
  useEffect(() => {
    if (!db) return;
    const cartRef = doc(db, 'carts', cartId);
    
    let prevItemsLength = -1;

    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('🔥 Cart updated via Firestore onSnapshot:', data);
        setCart(data);
        
        const currentItemsLength = data.items ? data.items.length : 0;
        if (prevItemsLength !== -1) {
          if (currentItemsLength > prevItemsLength) {
            const lastItem = data.items[data.items.length - 1];
            const name = lastItem ? (lastItem.name || 'Item') : 'Item';
            triggerLocalNotification('success', 'Item Added Successfully', `${name} added to cart.`);
          } else if (currentItemsLength < prevItemsLength) {
            triggerLocalNotification('info', 'Item Removed', `Item removed from cart.`);
          }
        }
        prevItemsLength = currentItemsLength;
      }
    });

    return () => unsubscribe();
  }, [cartId]);

  // Periodic poll for ESP32 connection heartbeat status (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEsp32Status();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time updates via Firebase Realtime Database status changes
  useEffect(() => {
    if (!rtdb) return;
    const statusRef = ref(rtdb, 'esp32Status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        console.log('🔥 ESP32 Status updated via RTDB:', val);
        setEsp32Status((prev: any) => ({
          ...prev,
          ...val
        }));
        fetchScanHistory(); // refresh logs if status changes
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time update listeners via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('🔌 Socket connected/reconnected, joining cart room:', cartId);
      socket.emit('join_cart', cartId);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);

    socket.on('cart_updated', (updatedCart: CartData) => {
      console.log('⚡ Cart updated via Socket.IO:', updatedCart);
      setCart(updatedCart);
      fetchScanHistory(); // Reload history on scan updates
      fetchEsp32Status(); // Sync ESP32 status on scan updates
    });

    socket.on('esp32_status', (statusData: any) => {
      console.log('⚡ ESP32 status updated via Socket.IO:', statusData);
      setEsp32Status((prev: any) => ({
        ...prev,
        ...statusData
      }));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.emit('leave_cart', cartId);
      socket.off('cart_updated');
      socket.off('esp32_status');
    };
  }, [socket, cartId]);

  const setCartSession = (id: string) => {
    setCartId(id);
  };

  const updateBudget = async (budget: number) => {
    try {
      await axios.post(`${API_URL}/cart/budget`, { cartId, budget });
      if (user) await updateUserBudget(budget);
      await fetchCartDetails(cartId);
    } catch (err) {
      console.error(err);
      if (cart) setCart({ ...cart, budget });
    }
  };

  const updateItemQuantity = async (productId: string, quantity: number) => {
    try {
      await axios.post(`${API_URL}/cart/quantity`, { cartId, productId, quantity });
      await fetchCartDetails(cartId);
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



  const startShopping = async () => {
    try {
      const response = await axios.post(`${API_URL}/cart/start`, { cartId });
      if (response.data.success) {
        setCart(response.data.cart);
        triggerLocalNotification('success', 'Session Started', 'Ready to scan items!');
      }
    } catch (err: any) {
      triggerLocalNotification('error', 'Failed to start shopping', err.response?.data?.error || err.message);
    }
  };

  const stopShopping = async (physicalWeight: number) => {
    try {
      const response = await axios.post(`${API_URL}/cart/stop`, { cartId, physicalWeight });
      if (response.data.success) {
        setCart(response.data.cart);
        triggerLocalNotification('info', 'Session Stopped', 'Weight verification checks complete.');
      }
    } catch (err: any) {
      triggerLocalNotification('error', 'Failed to stop shopping', err.response?.data?.error || err.message);
    }
  };

  const resumeShopping = async () => {
    try {
      const response = await axios.post(`${API_URL}/cart/resume`, { cartId });
      if (response.data.success) {
        setCart(response.data.cart);
        triggerLocalNotification('success', 'Session Resumed', 'RFID scanning enabled.');
      }
    } catch (err: any) {
      triggerLocalNotification('error', 'Failed to resume shopping', err.response?.data?.error || err.message);
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

        startShopping,
        stopShopping,
        resumeShopping,
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
