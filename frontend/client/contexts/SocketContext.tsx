// src/contexts/SocketContext.tsx (or .jsx if not using TypeScript)
import { socketUrl, debugMode } from '../../Constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';


const SocketContext = createContext({
  socket: null as any,
  connected: false,
});

export const SocketProvider = ({ children, url = socketUrl, options = {} }: any) => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !url) return;
    if (socket) return;

    const s = io(url, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      ...options,
    });

    setSocket(s);

    const onConnect = () => {
      if (debugMode) console.log('[socket] connected', s.id);
      setConnected(true);
    }
    
    const onDisconnect = (reason: any) => {
      if (debugMode) console.log('[socket] disconnected', reason);
      setConnected(false);
    };
    
    const onConnectError = (err: any) => {
      if (debugMode) console.warn('[socket] connect_error', err?.message || err);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      
      try {
        if (s.connected) s.disconnect();
      } catch (e) { /* ignore */ }
      
      setSocket(null);
      setConnected(false);
    };
  }, [url]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);