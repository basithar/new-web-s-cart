import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  triggerLocalNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl.replace(/\/api\/?$/, '');
  }

  // Local dev server fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Staging / Production host origin fallback
  return window.location.origin;
};

const SOCKET_URL = getSocketUrl();

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const triggerLocalNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 10)); // Cap at 10 notifications
  };

  useEffect(() => {
    console.log('🔌 Initializing Socket.IO Client connection...');
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Listen for global notifications
    newSocket.on('notification', (data: { type: any; title: string; message: string }) => {
      triggerLocalNotification(data.type, data.title, data.message);
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to real-time notification backend.');
    });

    newSocket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from real-time backend.');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        dismissNotification,
        triggerLocalNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
