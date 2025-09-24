import React, { useEffect, useState } from 'react';
import { enhancedWebSocketManager } from '@/services/enhancedWebSocketManager';
import { CandlestickData } from '@/types';

/**
 * TEST COMPONENT: Verify ALL crypto products get real-time 1-second streaming
 */
const MultiProductTest: React.FC = () => {
  const [productPrices, setProductPrices] = useState<{[key: string]: number}>({});
  const [lastUpdates, setLastUpdates] = useState<{[key: string]: string}>({});
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    console.log('🚀 TESTING: Enhanced WebSocket Manager for Multi-Product Streaming');

    // Test products that user specifically mentioned
    const testProducts = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'BNBUSDT'];

    // Subscribe to connection status
    const unsubscribe = enhancedWebSocketManager.onConnectionChange((status) => {
      setConnectionStatus(status);
      console.log(`🔗 Connection Status: ${status}`);
    });

    // Subscribe to each product for 1-second real-time streaming
    testProducts.forEach(symbol => {
      const handler = (data: CandlestickData) => {
        const currentTime = new Date().toLocaleTimeString();
        
        setProductPrices(prev => ({
          ...prev,
          [symbol]: data.close
        }));

        setLastUpdates(prev => ({
          ...prev,
          [symbol]: currentTime
        }));

        console.log(`⚡ ${symbol}: $${data.close} @ ${currentTime}`);
      };

      console.log(`📡 SUBSCRIBING: ${symbol} for 1s real-time streaming`);
      enhancedWebSocketManager.subscribeMultiProduct(symbol, '1s', handler);
    });

    return () => {
      // Cleanup subscriptions
      testProducts.forEach(symbol => {
        enhancedWebSocketManager.unsubscribeProduct(symbol, '1s');
      });
      unsubscribe();
    };
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">🚀 Multi-Product Real-Time Test</h2>
      
      <div className="mb-4">
        <span className="text-sm">Connection Status: </span>
        <span className={`font-bold ${
          connectionStatus === 'connected' ? 'text-green-500' : 
          connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {connectionStatus.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(productPrices).map(([symbol, price]) => (
          <div key={symbol} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">{symbol}</h3>
            <div className="text-2xl font-mono text-green-500 mb-1">
              ${price.toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">
              Last: {lastUpdates[symbol] || 'Waiting...'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-400">
          ✅ If all products show moving prices with recent timestamps, 
          enhanced WebSocket manager is working correctly!
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Active Products: {enhancedWebSocketManager.getActiveProductsCount()} | 
          Active Streams: {enhancedWebSocketManager.getActiveStreamsCount()}
        </p>
      </div>
    </div>
  );
};

export default MultiProductTest;