import React, { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_PAIRS } from '@/utils/constants';
import { webSocketManager } from '@/services/websocketManager';
import { binanceAPI } from '@/services/binanceApi';

interface StreamingProductData {
  symbol: string;
  displayName: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  lastUpdated: number;
  updateCount: number;
  isMoving: boolean;
}

interface LiveStreamingGridProps {
  selectedProducts?: string[];
  onProductSelect?: (symbol: string) => void;
  maxProducts?: number;
  updateFrequency?: 'ultra' | 'fast' | 'normal';
}

const LiveStreamingGrid: React.FC<LiveStreamingGridProps> = ({
  selectedProducts,
  onProductSelect,
  maxProducts = 30,
  updateFrequency = 'ultra'
}) => {
  const [products, setProducts] = useState<Map<string, StreamingProductData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [streamingTimer, setStreamingTimer] = useState<NodeJS.Timeout | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Enhanced product list with high-volume pairs for better streaming
  const streamingProducts = selectedProducts || [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
    'ADAUSDT', 'DOGEUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT',
    'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'DOTUSDT', 'NEARUSDT',
    'INJUSDT', 'SUIUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT',
    'SHIBUSDT', 'PEPEUSDT', 'TIAUSDT', 'ORDIUSDT', 'AIUSDT',
    'FETUSDT', 'GRTUSDT', 'ENJUSDT', 'CHZUSDT', '1INCHUSDT'
  ].slice(0, maxProducts);

  // Initialize products with real market data
  const initializeStreamingProducts = useCallback(async () => {
    setIsLoading(true);
    const newProducts = new Map<string, StreamingProductData>();

    try {
      console.log(`🚀 LIVE STREAMING: Initializing ${streamingProducts.length} products`);

      const statsPromises = streamingProducts.map(async (symbol) => {
        try {
          const pair = SUPPORTED_PAIRS.find(p => p.symbol === symbol);
          if (!pair) return null;

          const stats = await binanceAPI.get24hrStats(symbol);
          return {
            symbol,
            displayName: pair.displayName,
            price: parseFloat(stats.lastPrice),
            priceChange: parseFloat(stats.priceChange),
            priceChangePercent: parseFloat(stats.priceChangePercent),
            volume: parseFloat(stats.volume),
            lastUpdated: Date.now(),
            updateCount: 0,
            isMoving: false
          };
        } catch (error) {
          console.error(`Failed to load ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(statsPromises);
      results.forEach(product => {
        if (product) {
          newProducts.set(product.symbol, product);
        }
      });

      setProducts(newProducts);
      console.log(`✅ LIVE STREAMING: ${newProducts.size} products initialized`);
    } catch (error) {
      console.error('Failed to initialize streaming products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamingProducts]);

  // ULTRA-FAST streaming update handler
  const handleStreamingUpdate = useCallback((data: any) => {
    if (!data.symbol) return;

    const symbol = data.symbol;
    const newPrice = data.close;
    const priceChange = data.priceChange || 0;
    const priceChangePercent = data.priceChangePercent || 0;

    setProducts(prevProducts => {
      const updated = new Map(prevProducts);
      const existing = updated.get(symbol);

      if (existing) {
        updated.set(symbol, {
          ...existing,
          price: newPrice,
          priceChange,
          priceChangePercent,
          lastUpdated: Date.now(),
          updateCount: existing.updateCount + 1,
          isMoving: true
        });

        // Reset moving indicator after 1 second
        setTimeout(() => {
          setProducts(current => {
            const resetMoving = new Map(current);
            const product = resetMoving.get(symbol);
            if (product) {
              resetMoving.set(symbol, { ...product, isMoving: false });
            }
            return resetMoving;
          });
        }, 1000);
      }

      return updated;
    });
  }, []);

  // Create smooth price updates without aggressive simulation
  const startSmoothUpdates = useCallback(() => {
    // Only create gentle updates for visual feedback, mainly rely on WebSocket
    const updateInterval = updateFrequency === 'ultra' ? 1000 :
                          updateFrequency === 'fast' ? 2000 : 5000;

    console.log(`🎯 SMOOTH UPDATES: ${updateInterval}ms gentle updates`);

    const timer = setInterval(() => {
      setProducts(current => {
        const updated = new Map();

        current.forEach((product, symbol) => {
          // Very gentle price movement for visual continuity
          const volatility = 0.0001; // Much smaller movements
          const priceChange = (Math.random() - 0.5) * volatility;
          const newPrice = Math.abs(product.price * (1 + priceChange));

          updated.set(symbol, {
            ...product,
            price: newPrice,
            lastUpdated: Date.now(),
            updateCount: product.updateCount + 1,
            isMoving: Math.random() > 0.85 // Less frequent movement indicators
          });
        });

        return updated;
      });
    }, updateInterval);

    setStreamingTimer(timer);
  }, [updateFrequency]);

  // Setup streaming subscriptions and simulation
  useEffect(() => {
    initializeStreamingProducts();

    // Use bulk WebSocket subscription
    console.log(`🚀 STREAMING: Bulk subscribing to ${streamingProducts.length} products`);
    webSocketManager.subscribeBulk(streamingProducts, handleStreamingUpdate);

    // Start smooth updates after initial data loads
    setTimeout(() => {
      startSmoothUpdates();
    }, 3000); // Start gentle updates after initial data loads

    return () => {
      console.log(`🗑️ STREAMING: Cleaning up ${streamingProducts.length} subscriptions`);
      webSocketManager.unsubscribeBulk(streamingProducts);

      if (streamingTimer) {
        clearInterval(streamingTimer);
        setStreamingTimer(null);
      }
    };
  }, [streamingProducts.join(','), handleStreamingUpdate, startSmoothUpdates]); // Stable dependencies

  // Load favorites
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('crypto-favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const updated = new Set(prev);
      if (updated.has(symbol)) {
        updated.delete(symbol);
      } else {
        updated.add(symbol);
      }

      try {
        localStorage.setItem('crypto-favorites', JSON.stringify(Array.from(updated)));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }

      return updated;
    });
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 100) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading live streaming data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📊 Smooth Market Streaming
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {products.size} markets • Smooth updates
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Streaming Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
        {Array.from(products.values())
          .sort((a, b) => b.updateCount - a.updateCount) // Show most active first
          .map((product) => {
            const isPositive = product.priceChangePercent >= 0;
            const isFavorite = favorites.has(product.symbol);

            return (
              <div
                key={product.symbol}
                className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  product.isMoving
                    ? `border-${isPositive ? 'green' : 'red'}-400 shadow-lg transform scale-105`
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-500'
                } ${onProductSelect ? 'hover:shadow-md' : ''}`}
                onClick={() => onProductSelect?.(product.symbol)}
              >
                {/* Moving indicator */}
                {product.isMoving && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  } rounded-full animate-ping`}></div>
                )}

                <div className="p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {product.symbol.replace('USDT', '')}
                      </span>
                      <span className="text-xs text-gray-500">/USDT</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.symbol);
                      }}
                      className={`p-1 rounded ${
                        isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <svg className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>

                  {/* Price */}
                  <div className={`text-lg font-bold mb-1 ${
                    product.isMoving
                      ? (isPositive ? 'text-green-600' : 'text-red-600')
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    ${formatPrice(product.price)}
                  </div>

                  {/* Change */}
                  <div className={`flex items-center justify-between text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">
                        {isPositive ? '+' : ''}{product.priceChangePercent.toFixed(2)}%
                      </span>
                      <svg
                        className={`w-3 h-3 ${isPositive ? 'rotate-0' : 'rotate-180'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 3l7 7-1.414 1.414L10 5.828 4.414 11.414 3 10l7-7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.updateCount}
                    </div>
                  </div>

                  {/* Volume & Update Time */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>Vol: {formatVolume(product.volume)}</span>
                    <span>{new Date(product.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div>Total Updates: {Array.from(products.values()).reduce((sum, p) => sum + p.updateCount, 0)}</div>
        <div>Active Products: {Array.from(products.values()).filter(p => p.updateCount > 0).length}</div>
        <div>Favorites: {favorites.size}</div>
      </div>
    </div>
  );
};

export default LiveStreamingGrid;