import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ChartDataContextType, CandlestickData } from '@/types';
import { webSocketManager } from '@/services/websocketManager';
import { fallbackWebSocketManager } from '@/services/fallbackWebSocket';

const ChartDataContext = createContext<ChartDataContextType | undefined>(undefined);

interface ChartDataProviderProps {
  children: ReactNode;
}

export function ChartDataProvider({ children }: ChartDataProviderProps) {
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<{symbol: string, interval: string} | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [updateTimer, setUpdateTimer] = useState<NodeJS.Timeout | null>(null);

  // Get interval in milliseconds for proper timing
  const getIntervalMs = useCallback((interval: string): number => {
    const intervalMap: Record<string, number> = {
      '1s': 1000,
      '5s': 5000,
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    };
    return intervalMap[interval] || 60000;
  }, []);

  // Update chart data with REAL-TIME streaming like TradingView
  const updateData = useCallback((newCandle: CandlestickData) => {
    // Store the latest price for interpolation
    setLastPrice(newCandle.close);

    setCandlestickData(prevData => {
      // If we have no previous data, start with the new candle
      if (prevData.length === 0) {
        console.log('🚀 Starting LIVE chart with first trade:', newCandle.close);
        return [newCandle];
      }

      const updatedData = [...prevData];
      const lastCandle = updatedData[updatedData.length - 1];

      // BINANCE-STYLE REAL-TIME UPDATES for ALL crypto products and timeframes
      const now = Date.now();
      const timeDiff = Math.abs(newCandle.timestamp - lastCandle.timestamp);
      const isNewCandle = newCandle.timestamp > lastCandle.timestamp + 500; // 500ms buffer

      if (isNewCandle) {
        // NEW CANDLE: Add to chart (Binance behavior)
        updatedData.push({
          timestamp: newCandle.timestamp,
          open: newCandle.open || newCandle.close,
          high: newCandle.high || newCandle.close,
          low: newCandle.low || newCandle.close,
          close: newCandle.close,
          volume: newCandle.volume || 0
        });
        console.log(`📈 NEW BINANCE candle: $${newCandle.close} at ${new Date(newCandle.timestamp).toLocaleTimeString()}`);

        // Keep last 200 candles for all crypto products
        if (updatedData.length > 200) {
          updatedData.splice(0, updatedData.length - 200);
        }
      } else {
        // UPDATE CURRENT CANDLE: Real-time price movement (like Binance)
        const currentCandle = updatedData[updatedData.length - 1];
        updatedData[updatedData.length - 1] = {
          timestamp: currentCandle.timestamp,
          open: currentCandle.open,
          high: Math.max(currentCandle.high, newCandle.close, newCandle.high || 0),
          low: Math.min(currentCandle.low, newCandle.close, newCandle.low || Infinity),
          close: newCandle.close, // Latest trade price
          volume: Math.max(currentCandle.volume, newCandle.volume || 0)
        };
        console.log(`⚡ LIVE ${updatedData.length > 0 ? 'UPDATE' : 'TRADE'}: $${newCandle.close}`);
      }

      return updatedData;
    });

    // Clear any existing errors only if there are errors
    setError(prevError => prevError ? null : prevError);
  }, []);  // Remove error dependency to prevent loops

  // Create Binance-style candle for ANY crypto product and timeframe
  const createBinanceCandle = useCallback((symbol: string, interval: string): CandlestickData => {
    const now = Date.now();
    const intervalMs = getIntervalMs(interval);

    // Calculate Binance-style candle start time for ANY timeframe
    let startTime: number;

    switch (interval) {
      case '1s':
        startTime = Math.floor(now / 1000) * 1000;
        break;
      case '5s':
        startTime = Math.floor(now / 5000) * 5000;
        break;
      case '1m':
        startTime = Math.floor(now / 60000) * 60000;
        break;
      case '5m':
        startTime = Math.floor(now / 300000) * 300000;
        break;
      case '15m':
        startTime = Math.floor(now / 900000) * 900000;
        break;
      case '1h':
        startTime = Math.floor(now / 3600000) * 3600000;
        break;
      case '4h':
        startTime = Math.floor(now / 14400000) * 14400000;
        break;
      case '1d':
        startTime = Math.floor(now / 86400000) * 86400000;
        break;
      default:
        startTime = Math.floor(now / intervalMs) * intervalMs;
    }

    return {
      timestamp: startTime,
      open: lastPrice || 0,
      high: lastPrice || 0,
      low: lastPrice || 0,
      close: lastPrice || 0,
      volume: 0
    };
  }, [lastPrice, getIntervalMs]);

  // Start Binance-style streaming for ALL crypto products and timeframes
  const startBinanceStreaming = useCallback((symbol: string, interval: string) => {
    // Clear existing timer
    if (updateTimer) {
      clearInterval(updateTimer);
      setUpdateTimer(null);
    }

    // Binance-style: Different update strategies per timeframe
    let safetyIntervalMs: number;

    if (['1s', '5s'].includes(interval)) {
      // Ultra-fast timeframes: Very frequent safety updates
      safetyIntervalMs = 1000; // 1 second safety
    } else if (['1m', '5m'].includes(interval)) {
      // Medium timeframes: Regular safety updates
      safetyIntervalMs = 5000; // 5 second safety
    } else {
      // Longer timeframes: Less frequent safety updates
      safetyIntervalMs = Math.min(getIntervalMs(interval) / 4, 30000); // Max 30 seconds
    }

    console.log(`🚀 BINANCE STREAMING: ${symbol} ${interval} (safety: ${safetyIntervalMs}ms)`);

    const timer = setInterval(() => {
      if (lastPrice > 0) {
        const currentCandle = createBinanceCandle(symbol, interval);
        console.log(`🔄 Binance safety: ${symbol} ${currentCandle.close}`);
        updateData(currentCandle);
      }
    }, safetyIntervalMs);

    setUpdateTimer(timer);
  }, [updateTimer, getIntervalMs, lastPrice, createBinanceCandle, updateData]);

  // Subscribe to WebSocket updates with fallback mechanism
  const subscribeToUpdates = useCallback((symbol: string, interval: string) => {
    // Prevent duplicate subscriptions
    if (currentSubscription &&
        currentSubscription.symbol === symbol &&
        currentSubscription.interval === interval) {
      console.log(`🔄 Already subscribed to ${symbol} ${interval}`);
      return;
    }

    console.log(`🎯 Setting up real-time updates for ${symbol} ${interval}`);

    // Clear any existing timer
    if (updateTimer) {
      clearInterval(updateTimer);
      setUpdateTimer(null);
    }

    // Unsubscribe from previous stream if exists
    if (currentSubscription) {
      console.log(`🔄 Unsubscribing from previous: ${currentSubscription.symbol} ${currentSubscription.interval}`);
      if (isUsingFallback) {
        fallbackWebSocketManager.disconnect(`${currentSubscription.symbol.toLowerCase()}@kline_${currentSubscription.interval}`);
      } else {
        webSocketManager.unsubscribe(currentSubscription.symbol, currentSubscription.interval);
      }
    }

    let binanceStreamingStarted = false;

    console.log(`🎯 SETTING UP SUBSCRIPTION: ${symbol} ${interval}`);

    const dataHandler = (newCandle: CandlestickData) => {
      console.log(`✅ DATA SUCCESS: ${symbol} ${interval} = $${newCandle.close}`);
      updateData(newCandle);
      setError(null); // Clear any previous errors on successful data

      // Start Binance-style streaming for ALL products and timeframes
      if (!binanceStreamingStarted) {
        console.log(`🚀 Starting streaming for ${symbol} ${interval}`);
        startBinanceStreaming(symbol, interval);
        binanceStreamingStarted = true;
      }
    };

    // Try main WebSocket manager first
    if (!isUsingFallback && fallbackAttempts < 3) {
      console.log('🚀 Using main WebSocket manager');

      // Set up error detection timeout
      const errorTimeout = setTimeout(() => {
        if (!webSocketManager.isConnected()) {
          console.warn('⚠️ Main WebSocket failed, switching to fallback...');
          setIsUsingFallback(true);
          setFallbackAttempts(prev => prev + 1);

          // Use fallback
          fallbackWebSocketManager.subscribe(symbol, interval, dataHandler);
        }
      }, 15000); // Wait 15 seconds for connection

      webSocketManager.subscribe(symbol, interval, dataHandler);

      // Clear timeout if connection succeeds
      setTimeout(() => {
        if (webSocketManager.isConnected()) {
          clearTimeout(errorTimeout);
        }
      }, 2000);

    } else {
      console.log('🔄 Using fallback WebSocket manager');
      setIsUsingFallback(true);
      fallbackWebSocketManager.subscribe(symbol, interval, dataHandler);
    }

    setCurrentSubscription({ symbol, interval });
  }, [updateData, isUsingFallback, fallbackAttempts, updateTimer, startBinanceStreaming]);

  // Set initial chart data (replace completely when switching symbols)
  const setData = useCallback((data: CandlestickData[]) => {
    console.log('Setting chart data:', data.length, 'candles');
    setCandlestickData(data);
    setError(null);
  }, []);

  // Clear all chart data
  const clearData = useCallback(() => {
    setCandlestickData([]);
    setError(null);
  }, []);

  // Set loading state
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Set error state
  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  // Cleanup subscriptions and timers on unmount
  useEffect(() => {
    return () => {
      if (currentSubscription) {
        webSocketManager.unsubscribe(currentSubscription.symbol, currentSubscription.interval);
      }
      if (updateTimer) {
        clearInterval(updateTimer);
      }
    };
  }, [currentSubscription, updateTimer]);

  const value: ChartDataContextType = {
    candlestickData,
    isLoading,
    error,
    updateData,
    setData,
    clearData,
    // Additional methods for internal use
    subscribeToUpdates,
    setLoadingState,
    setErrorState
  } as ChartDataContextType & {
    subscribeToUpdates: (symbol: string, interval: string) => void;
    setLoadingState: (loading: boolean) => void;
    setErrorState: (error: string | null) => void;
  };

  return (
    <ChartDataContext.Provider value={value}>
      {children}
    </ChartDataContext.Provider>
  );
}

export function useChartData(): ChartDataContextType & {
  subscribeToUpdates: (symbol: string, interval: string) => void;
  setLoadingState: (loading: boolean) => void;
  setErrorState: (error: string | null) => void;
} {
  const context = useContext(ChartDataContext);
  if (context === undefined) {
    throw new Error('useChartData must be used within a ChartDataProvider');
  }
  return context as any;
}