import React, { useState, useEffect } from 'react';
import { OrderBookData, OrderBookLevel } from '@/types';
import { webSocketManager } from '@/services/websocketManager';

interface OrderBookProps {
  symbol: string;
  maxLevels?: number;
  className?: string;
}

const OrderBook: React.FC<OrderBookProps> = ({
  symbol,
  maxLevels = 10,
  className = ''
}) => {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setOrderBookData(null);

    const handleOrderBookUpdate = (data: OrderBookData) => {
      setOrderBookData(data);
      setIsLoading(false);
    };

    // Subscribe to order book updates
    try {
      webSocketManager.subscribeToOrderBook(symbol, handleOrderBookUpdate);
    } catch (error) {
      console.warn('Order book subscription failed:', error);
      setIsLoading(false);
    }

    return () => {
      // Cleanup - in a real app you might want to unsubscribe
      // but for now we keep the connection alive for other components
    };
  }, [symbol]);

  const formatPrice = (price: string): string => {
    return parseFloat(price).toFixed(4);
  };

  const formatQuantity = (quantity: string): string => {
    return parseFloat(quantity).toFixed(4);
  };

  const calculateTotal = (levels: OrderBookLevel[], index: number): number => {
    return levels.slice(0, index + 1).reduce((sum, level) =>
      sum + parseFloat(level.quantity), 0
    );
  };

  const getMaxTotal = (levels: OrderBookLevel[]): number => {
    return levels.reduce((sum, level) => sum + parseFloat(level.quantity), 0);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order Book - {symbol}
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading order book...</p>
        </div>
      </div>
    );
  }

  if (!orderBookData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order Book - {symbol}
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No order book data available</p>
        </div>
      </div>
    );
  }

  const displayAsks = orderBookData.asks.slice(0, maxLevels);
  const displayBids = orderBookData.bids.slice(0, maxLevels);
  const maxAskTotal = getMaxTotal(displayAsks);
  const maxBidTotal = getMaxTotal(displayBids);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order Book - {symbol}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last Update: {new Date(orderBookData.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="p-0">
        {/* Headers */}
        <div className="grid grid-cols-3 gap-1 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          <div className="text-left">Price (USDT)</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total</div>
        </div>

        {/* Asks (Sell Orders) - Red */}
        <div className="asks">
          {displayAsks.reverse().map((ask, index) => {
            const total = calculateTotal(displayAsks, displayAsks.length - 1 - index);
            const percentage = (total / maxAskTotal) * 100;

            return (
              <div
                key={`ask-${ask.price}-${index}`}
                className="relative grid grid-cols-3 gap-1 px-4 py-1 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {/* Background bar for visualization */}
                <div
                  className="absolute right-0 top-0 h-full bg-red-100 dark:bg-red-900/30 opacity-50"
                  style={{ width: `${percentage}%` }}
                ></div>
                <div className="relative z-10 text-red-600 dark:text-red-400 font-mono">
                  {formatPrice(ask.price)}
                </div>
                <div className="relative z-10 text-right text-gray-900 dark:text-white font-mono">
                  {formatQuantity(ask.quantity)}
                </div>
                <div className="relative z-10 text-right text-gray-600 dark:text-gray-400 font-mono">
                  {total.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Spread */}
        {displayBids.length > 0 && displayAsks.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Spread:</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {(parseFloat(displayAsks[displayAsks.length - 1]?.price || '0') -
                  parseFloat(displayBids[0]?.price || '0')).toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {/* Bids (Buy Orders) - Green */}
        <div className="bids">
          {displayBids.map((bid, index) => {
            const total = calculateTotal(displayBids, index);
            const percentage = (total / maxBidTotal) * 100;

            return (
              <div
                key={`bid-${bid.price}-${index}`}
                className="relative grid grid-cols-3 gap-1 px-4 py-1 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                {/* Background bar for visualization */}
                <div
                  className="absolute right-0 top-0 h-full bg-green-100 dark:bg-green-900/30 opacity-50"
                  style={{ width: `${percentage}%` }}
                ></div>
                <div className="relative z-10 text-green-600 dark:text-green-400 font-mono">
                  {formatPrice(bid.price)}
                </div>
                <div className="relative z-10 text-right text-gray-900 dark:text-white font-mono">
                  {formatQuantity(bid.quantity)}
                </div>
                <div className="relative z-10 text-right text-gray-600 dark:text-gray-400 font-mono">
                  {total.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;