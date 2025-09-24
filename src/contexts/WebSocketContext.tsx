import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketContextType } from '@/types';
import { webSocketManager } from '@/services/websocketManager';

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    // Set up connection status listener
    const unsubscribe = webSocketManager.onConnectionChange((status) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    });

    // Initial connection - ensure WebSocket connects immediately
    console.log('Initializing WebSocket connection...');
    webSocketManager.connect().then(() => {
      console.log('WebSocket connected successfully');
    }).catch(error => {
      console.error('Failed to establish WebSocket connection:', error);
      // Retry connection after a short delay
      setTimeout(() => {
        webSocketManager.connect().catch(err => {
          console.error('Retry connection failed:', err);
        });
      }, 2000);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Don't disconnect here - let the manager handle cleanup
    };
  }, []);

  const subscribe = (symbol: string, interval: string, handler?: (data: any) => void) => {
    console.log(`Subscribing to ${symbol}@${interval}`);
    if (handler) {
      webSocketManager.subscribe(symbol, interval, handler);
    } else {
      // Default empty handler if none provided
      webSocketManager.subscribe(symbol, interval, () => {});
    }
  };

  const unsubscribe = (symbol: string, interval: string) => {
    console.log(`Unsubscribing from ${symbol}@${interval}`);
    webSocketManager.unsubscribe(symbol, interval);
  };

  const value: WebSocketContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    connectionStatus
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}