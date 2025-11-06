import { socketUrl, debugMode } from '../../Constants';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = socketUrl

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinCompany: (companyId: string) => void;
  leaveCompany: (companyId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinCompany: () => {},
  leaveCompany: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

  if (debugMode) console.log('[Socket] Connecting to:', SOCKET_URL);

    const s = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    const onConnect = () => {
      if (debugMode) console.log('[Socket] Connected:', s.id);
      setConnected(true);
      toast.success('Connected to real-time updates');
    };

    const onDisconnect = (reason: string) => {
      if (debugMode) console.log('[Socket] Disconnected:', reason);
      setConnected(false);
      
      if (reason !== 'io client disconnect') {
        toast.error('Lost connection to server');
      }
    };

    const onConnectError = (err: Error) => {
      if (debugMode) console.warn('[Socket] Connection error:', err.message);
      setConnected(false);
    };

    const onCompanyConnected = (data: any) => {
      if (debugMode) console.log('[Socket] Company connected:', data);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.on('company:connected', onCompanyConnected);

  setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.off('company:connected', onCompanyConnected);

      if (s.connected) s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  const joinCompany = useCallback((companyId: string) => {
    if (socket && connected) {
      socket.emit('company:join', { companyId });
      if (debugMode) console.log('[Socket] Joined company room:', companyId);
    }
  }, [socket, connected]);

  const leaveCompany = useCallback((companyId: string) => {
    if (socket && connected) {
      socket.emit('company:leave', { companyId });
      if (debugMode) console.log('[Socket] Left company room:', companyId);
    }
  }, [socket, connected]);

  return (
    <SocketContext.Provider value={{ socket, connected, joinCompany, leaveCompany }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}