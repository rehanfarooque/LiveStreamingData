import React, { useState, useEffect, useRef } from 'react';
import { TradeData } from '@/types';
import { webSocketManager } from '@/services/websocketManager';

interface LiveTradesProps {
  symbol: string;
  maxTrades?: number;
  className?: string;
}

const LiveTrades: React.FC<LiveTradesProps> = ({
  symbol,
  maxTrades = 20,
  className = ''
}) => {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tradesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setTrades([]);
    
    console.log(`🔄 LIVE TRADES: Subscribing to ${symbol} trades`);

    const handleTradeUpdate = (data: TradeData) => {
      // CRITICAL: Only process trades for the current symbol to prevent cross-contamination
      const tradeSymbol = data.id ? String(data.id).toUpperCase() : '';
      console.log(`⚡ TRADE RECEIVED: ${tradeSymbol} for component ${symbol}`);
      
      // Verify this trade belongs to our symbol
      if (tradeSymbol && !tradeSymbol.includes(symbol.toUpperCase())) {
        console.log(`🚫 TRADE REJECTED: ${tradeSymbol} != ${symbol}`);
        return;
      }
      
      setTrades(prevTrades => {
        const newTrades = [data, ...prevTrades];
        // Keep only the most recent trades
        return newTrades.slice(0, maxTrades);
      });
      setIsLoading(false);

      // Auto-scroll to top when new trades arrive
      if (tradesRef.current) {
        tradesRef.current.scrollTop = 0;
      }
    };

    // Subscribe to live trades for the specific symbol
    try {
      console.log(`🚀 SUBSCRIBING to ${symbol} trades...`);
      webSocketManager.subscribeToTrades(symbol, handleTradeUpdate);
    } catch (error) {
      console.warn(`Live trades subscription failed for ${symbol}:`, error);
      setIsLoading(false);
    }

    return () => {
      // Cleanup - in a real app you might want to unsubscribe
      // but for now we keep the connection alive for other components
      console.log(`🧹 CLEANUP: Live trades for ${symbol}`);
    };
  }, [symbol, maxTrades]);

  const formatPrice = (price: string): string => {
    return parseFloat(price).toFixed(4);
  };

  const formatQuantity = (quantity: string): string => {
    return parseFloat(quantity).toFixed(4);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const calculateTotal = (price: string, quantity: string): string => {
    return (parseFloat(price) * parseFloat(quantity)).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Trades - {symbol}
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Trades - {symbol}
          </h3>
          <div className="flex items-center space-x-2">
            {trades.length > 0 && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-0">
        {/* Headers */}
        <div className="grid grid-cols-4 gap-1 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          <div className="text-left">Time</div>
          <div className="text-right">Price (USDT)</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total</div>
        </div>

        {/* Trades List */}
        <div
          ref={tradesRef}
          className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        >
          {trades.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Waiting for live trades...</p>
            </div>
          ) : (
            trades.map((trade, index) => (
              <div
                key={`${trade.id}-${trade.timestamp}`}
                className={`grid grid-cols-4 gap-1 px-4 py-2 text-sm border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${
                  index < 3 ? 'bg-blue-50 dark:bg-blue-900/20 animate-pulse' : ''
                } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                  {formatTime(trade.timestamp)}
                </div>
                <div className={`text-right font-mono font-medium ${
                  trade.isBuyerMaker
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatPrice(trade.price)}
                </div>
                <div className="text-right font-mono text-gray-900 dark:text-white">
                  {formatQuantity(trade.quantity)}
                </div>
                <div className="text-right font-mono text-gray-600 dark:text-gray-400">
                  {calculateTotal(trade.price, trade.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trade Statistics */}
        {trades.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Latest Price:</span>
                <span className={`font-mono font-medium ${
                  trades[0].isBuyerMaker
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatPrice(trades[0].price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Trades:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {trades.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrades;