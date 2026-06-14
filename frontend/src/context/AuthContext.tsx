import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { auth, isFirebaseConfigured } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

export interface UserProfile {
  _id: string;
  firebaseId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  budgetLimit: number;
  savedPaymentMethods: Array<{
    cardType: string;
    last4: string;
    expiry: string;
  }>;
  budgetHistory?: Array<{
    date: string;
    limit: number;
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebase: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsMock: (role: 'customer' | 'admin') => Promise<void>;
  register: (email: string, name: string, password: string, role?: 'customer' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  updateUserBudget: (limit: number) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '../config';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile data with our Express backend
  const syncProfileWithBackend = async (firebaseUser: { uid: string; email: string | null; displayName: string | null }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      });
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to sync profile with MongoDB backend, using mock profile:', err);
      // Backend failed, set local mock profile
      const is_admin = firebaseUser.email?.includes('admin');
      setUser({
        _id: 'mock_sync_id',
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email || 'customer@smartcart.com',
        name: firebaseUser.displayName || 'Smart Customer',
        role: is_admin ? 'admin' : 'customer',
        budgetLimit: 50,
        savedPaymentMethods: [],
      });
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      console.log('🔥 Firebase Auth detected. Initializing Firebase Auth state listener...');
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          await syncProfileWithBackend(firebaseUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      console.log('🤖 Firebase is not configured. Initializing Mock Auth...');
      // Load mock user from localStorage if saved
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Mock Auth check
        if (email.includes('admin')) {
          if (email === 'admin@smartcart.com' && password === 'Admin123') {
            await loginAsMock('admin');
          } else {
            throw new Error('Invalid Admin credentials.');
          }
        } else {
          if (email === 'customer@smartcart.com' && password === 'Customer123') {
            await loginAsMock('customer');
          } else {
            throw new Error('Invalid Customer credentials.');
          }
        }
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const loginAsMock = async (role: 'customer' | 'admin') => {
    setLoading(true);
    try {
      const mockData = role === 'admin' 
        ? { firebaseId: 'mock_uid_admin', email: 'admin@smartcart.com', name: 'Smart Admin', role: 'admin' }
        : { firebaseId: 'mock_uid_customer', email: 'customer@smartcart.com', name: 'Smart Customer', role: 'customer' };

      const response = await axios.post(`${API_URL}/auth/login`, mockData);
      const syncedUser = response.data.user;
      setUser(syncedUser);
      localStorage.setItem('mock_user', JSON.stringify(syncedUser));
    } catch (err) {
      console.warn('Backend connection failed during mock login, loading offline user');
      const fallback = role === 'admin'
        ? {
            _id: 'user_id_1',
            firebaseId: 'mock_uid_admin',
            email: 'admin@smartcart.com',
            name: 'Smart Admin',
            role: 'admin' as const,
            budgetLimit: 0,
            savedPaymentMethods: [],
            budgetHistory: [],
          }
        : {
            _id: 'user_id_2',
            firebaseId: 'mock_uid_customer',
            email: 'customer@smartcart.com',
            name: 'Smart Customer',
            role: 'customer' as const,
            budgetLimit: 2000,
            savedPaymentMethods: [],
            budgetHistory: [{ date: new Date().toISOString(), limit: 2000 }],
          };
      setUser(fallback);
      localStorage.setItem('mock_user', JSON.stringify(fallback));
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string, role: 'customer' | 'admin' = 'customer') => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Sync profile to DB
        await axios.post(`${API_URL}/auth/register`, {
          firebaseId: credential.user.uid,
          email,
          name,
          role,
        });
      } else {
        // Create Mock User
        const fakeUid = `mock_uid_${Math.floor(1000 + Math.random() * 9000)}`;
        const response = await axios.post(`${API_URL}/auth/register`, {
          firebaseId: fakeUid,
          email,
          name,
          role,
        });
        const createdUser = response.data.user;
        setUser(createdUser);
        localStorage.setItem('mock_user', JSON.stringify(createdUser));
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('mock_user');
      }
      setUser(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserBudget = async (budgetLimit: number) => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_URL}/auth/budget`, {
        firebaseId: user.firebaseId,
        budgetLimit,
      });
      const updatedUser = response.data.user;
      setUser(updatedUser);
      if (!isFirebaseConfigured) {
        localStorage.setItem('mock_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to save budget to DB:', err);
      // Offline fallback
      const updatedUser = { ...user, budgetLimit };
      setUser(updatedUser);
      localStorage.setItem('mock_user', JSON.stringify(updatedUser));
    }
  };

  const forgotPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`Mock reset password email requested for: ${email}`);
      // Simulate success for local testing
      return new Promise<void>((resolve) => setTimeout(resolve, 800));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebase: isFirebaseConfigured,
        login,
        loginAsMock,
        register,
        logout,
        updateUserBudget,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
