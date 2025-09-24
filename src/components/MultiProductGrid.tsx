import React, { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_PAIRS } from '@/utils/constants';
import { webSocketManager } from '@/services/websocketManager';
import { binanceAPI } from '@/services/binanceApi';

interface ProductData {
  symbol: string;
  displayName: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  lastUpdated: number;
}

interface MultiProductGridProps {
  selectedProducts?: string[];
  onProductSelect?: (symbol: string) => void;
  maxProducts?: number;
}

const MultiProductGrid: React.FC<MultiProductGridProps> = ({
  selectedProducts,
  onProductSelect,
  maxProducts = 20
}) => {
  const [products, setProducts] = useState<Map<string, ProductData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Default products to show (top cryptos by market cap)
  const defaultProducts = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
    'ADAUSDT', 'DOGEUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT',
    'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'DOTUSDT', 'NEARUSDT',
    'AAVEUSDT', 'SHIBUSDT', 'TRXUSDT', 'FTMUSDT', 'SANDUSDT'
  ];

  const activeProducts = selectedProducts || defaultProducts.slice(0, maxProducts);

  // Initialize product data
  const initializeProducts = useCallback(async () => {
    setIsLoading(true);
    const newProducts = new Map<string, ProductData>();

    try {
      // Load initial 24hr stats for all products in parallel
      const statsPromises = activeProducts.map(async (symbol) => {
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
            lastUpdated: Date.now()
          };
        } catch (error) {
          console.error(`Failed to load stats for ${symbol}:`, error);
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
    } catch (error) {
      console.error('Failed to initialize products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProducts]);

  // Real-time price update handler (enhanced for ticker data)
  const handlePriceUpdate = useCallback((data: any) => {
    if (!data.symbol) return;

    const symbol = data.symbol;
    const newPrice = data.close;
    const priceChange = data.priceChange || 0;
    const priceChangePercent = data.priceChangePercent || 0;
    const volume = data.volume || 0;

    setProducts(prevProducts => {
      const updated = new Map(prevProducts);
      const existing = updated.get(symbol);

      if (existing) {
        updated.set(symbol, {
          ...existing,
          price: newPrice,
          priceChange,
          priceChangePercent,
          volume,
          lastUpdated: Date.now()
        });
      }

      return updated;
    });
  }, []);

  // Set up WebSocket subscriptions for all products using bulk subscription
  useEffect(() => {
    let isMounted = true;

    const setupStreaming = async () => {
      if (!isMounted) return;

      await initializeProducts();

      if (!isMounted) return;

      console.log(`🎯 MULTI-PRODUCT: Setting up stable streaming for ${activeProducts.length} products`);

      // Use bulk subscription for efficient multi-product monitoring
      webSocketManager.subscribeBulk(activeProducts, handlePriceUpdate);
    };

    setupStreaming();

    return () => {
      isMounted = false;
      // Clean up bulk subscriptions
      console.log(`🗑️ MULTI-PRODUCT: Cleaning up ${activeProducts.length} subscriptions`);
      webSocketManager.unsubscribeBulk(activeProducts);
    };
  }, [activeProducts.join(',')]); // Stable dependency

  // Load favorites from localStorage
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

  // Toggle favorite
  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const updated = new Set(prev);
      if (updated.has(symbol)) {
        updated.delete(symbol);
      } else {
        updated.add(symbol);
      }

      // Save to localStorage
      try {
        localStorage.setItem('crypto-favorites', JSON.stringify(Array.from(updated)));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }

      return updated;
    });
  }, []);

  // Format price based on value
  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 100) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  };

  // Format volume
  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: maxProducts }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
            </div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Live Market Prices
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {products.size} markets • Real-time updates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from(products.values()).map((product) => {
          const isPositive = product.priceChangePercent >= 0;
          const isFavorite = favorites.has(product.symbol);

          return (
            <div
              key={product.symbol}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                onProductSelect ? 'hover:border-primary-500' : ''
              }`}
              onClick={() => onProductSelect?.(product.symbol)}
            >
              {/* Header with symbol and favorite */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {product.symbol.replace('USDT', '')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    /USDT
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.symbol);
                  }}
                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isFavorite ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>

              {/* Current Price */}
              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${formatPrice(product.price)}
                </span>
              </div>

              {/* Price Change */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-1 ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="text-sm font-medium">
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Vol: {formatVolume(product.volume)}
                </div>
              </div>

              {/* Last Updated */}
              <div className="mt-2 text-xs text-gray-400">
                Updated: {new Date(product.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add more products button */}
      {activeProducts.length < SUPPORTED_PAIRS.length && (
        <div className="flex justify-center">
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiProductGrid;