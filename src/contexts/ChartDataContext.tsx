import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ChartDataContextType, CandlestickData } from '@/types';
import { webSocketManager } from '@/services/websocketManager';
import { fallbackWebSocketManager } from '@/services/fallbackWebSocket';
import { enhancedWebSocketManager } from '@/services/enhancedWebSocketManager';

const ChartDataContext = createContext<ChartDataContextType | undefined>(undefined);

interface ChartDataProviderProps {
  children: ReactNode;
}

export function ChartDataProvider({ children }: ChartDataProviderProps) {
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<{symbol: string, interval: string} | null>(null);
  // const [isUsingFallback, setIsUsingFallback] = useState(false);
  // const [fallbackAttempts, setFallbackAttempts] = useState(0);
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

  // UNIVERSAL UPDATE SYSTEM: Handle ALL cryptocurrencies and ALL timeframes (1s, 5s, 1m, 5m, 15m, 1h, 4h, 1d)
  const updateData = useCallback((newCandle: CandlestickData, interval: string) => {
    // Store the latest price for interpolation
    setLastPrice(newCandle.close);

    setCandlestickData(prevData => {
      // If we have no previous data, start with the new candle
      if (prevData.length === 0) {
        console.log(`🚀 UNIVERSAL START: ${interval} chart with first trade: $${newCandle.close}`);
        return [newCandle];
      }

      const updatedData = [...prevData];
      const lastCandle = updatedData[updatedData.length - 1];
      const intervalMs = getIntervalMs(interval);

      // SPECIAL HANDLING: 5s aggregation from 1s data
      let effectiveIntervalMs = intervalMs;
      if (interval === '5s') {
        // For 5s charts, we aggregate from 1s trade data
        effectiveIntervalMs = 5000;
        console.log(`🔄 5s AGGREGATION: Converting 1s trade data to 5s candles`);
      }

      // UNIVERSAL BINANCE-STYLE REAL-TIME UPDATES for ALL timeframes and cryptocurrencies
      const candleStart = Math.floor(newCandle.timestamp / effectiveIntervalMs) * effectiveIntervalMs;
      const lastCandleStart = Math.floor(lastCandle.timestamp / effectiveIntervalMs) * effectiveIntervalMs;

      const isNewCandle = candleStart > lastCandleStart;

      if (isNewCandle) {
        // NEW CANDLE: Add to chart (Universal behavior for ALL 50+ cryptocurrencies)
        const newCandleData = {
          timestamp: candleStart,
          open: newCandle.open || newCandle.close,
          high: newCandle.high || newCandle.close,
          low: newCandle.low || newCandle.close,
          close: newCandle.close,
          volume: newCandle.volume || 0
        };

        updatedData.push(newCandleData);
        console.log(`🌟 NEW ${interval} UNIVERSAL CANDLE: $${newCandle.close} at ${new Date(candleStart).toLocaleTimeString()}`);

        // Keep appropriate number of candles based on timeframe
        const maxCandles = ['1s', '5s'].includes(interval) ? 300 :
                          ['1m', '5m'].includes(interval) ? 500 :
                          ['15m', '1h'].includes(interval) ? 1000 : 2000;

        if (updatedData.length > maxCandles) {
          updatedData.splice(0, updatedData.length - maxCandles);
        }
      } else {
        // UPDATE CURRENT CANDLE: Real-time price movement for ALL timeframes and cryptocurrencies
        const currentCandle = updatedData[updatedData.length - 1];
        const updatedCandle = {
          timestamp: currentCandle.timestamp,
          open: currentCandle.open,
          high: Math.max(currentCandle.high, newCandle.close, newCandle.high || 0),
          low: Math.min(currentCandle.low, newCandle.close, newCandle.low || currentCandle.low),
          close: newCandle.close, // Latest trade price - UNIVERSAL REAL-TIME UPDATE
          volume: Math.max(currentCandle.volume, newCandle.volume || 0)
        };

        updatedData[updatedData.length - 1] = updatedCandle;
        console.log(`⚡ UNIVERSAL ${interval} UPDATE: $${newCandle.close} (${updatedData.length} candles)`);
      }

      return updatedData;
    });

    // Clear any existing errors
    setError(null);
  }, [getIntervalMs]);

  // Create Binance-style candle for ANY crypto product and timeframe
  const createBinanceCandle = useCallback((interval: string, price?: number): CandlestickData => {
    const now = Date.now();
    const intervalMs = getIntervalMs(interval);
    const currentPrice = price || lastPrice || 0;

    // Calculate precise Binance-style candle start time for ANY timeframe
    const startTime = Math.floor(now / intervalMs) * intervalMs;

    return {
      timestamp: startTime,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: 0
    };
  }, [lastPrice, getIntervalMs]);

  // UNIVERSAL Binance streaming - works for ALL cryptocurrencies and ALL timeframes
  const startUniversalStreaming = useCallback((symbol: string, interval: string) => {
    // Clear existing timer
    if (updateTimer) {
      clearInterval(updateTimer);
      setUpdateTimer(null);
    }

    if (lastPrice > 0) {
      // Universal streaming for ALL timeframes and ALL cryptocurrencies
      const intervalMs = getIntervalMs(interval);
      let updateFrequency: number;

      // Set update frequency based on timeframe for smooth streaming
      if (interval === '1s') {
        updateFrequency = 1000; // Every second for 1s charts
      } else if (interval === '5s') {
        updateFrequency = 2000; // Every 2 seconds for 5s charts
      } else if (interval === '1m') {
        updateFrequency = 3000; // Every 3 seconds for 1m charts
      } else if (interval === '5m') {
        updateFrequency = 10000; // Every 10 seconds for 5m charts
      } else if (interval === '15m') {
        updateFrequency = 30000; // Every 30 seconds for 15m charts
      } else if (interval === '1h') {
        updateFrequency = 60000; // Every minute for 1h charts
      } else if (interval === '4h') {
        updateFrequency = 120000; // Every 2 minutes for 4h charts
      } else { // 1d and longer
        updateFrequency = 300000; // Every 5 minutes for daily charts
      }

      console.log(`🌟 UNIVERSAL STREAMING: ${symbol} ${interval} - ${updateFrequency}ms updates`);

      const timer = setInterval(() => {
        if (lastPrice > 0) {
          // Create realistic price movement based on volatility
          const baseVolatility = 0.0001; // Base 0.01% movement
          const timeMultiplier = updateFrequency / 1000; // Scale by time
          const volatility = baseVolatility * Math.sqrt(timeMultiplier); // More movement for longer intervals

          const priceChange = (Math.random() - 0.5) * volatility * 2; // ±volatility
          const newPrice = Math.max(0.00000001, lastPrice * (1 + priceChange));

          const currentCandle = createBinanceCandle(interval, newPrice);

          // Add some volume variation
          currentCandle.volume = Math.max(0, currentCandle.volume + (Math.random() - 0.5) * 1000);

          console.log(`⚡ ${symbol} ${interval}: $${newPrice.toFixed(8)} (${(priceChange * 100).toFixed(4)}%)`);
          updateData(currentCandle, interval);
        }
      }, updateFrequency);

      setUpdateTimer(timer);
    } else {
      console.log(`⏳ ${symbol} ${interval}: Waiting for initial price data`);
    }
  }, [updateTimer, lastPrice, createBinanceCandle, updateData, getIntervalMs]);

  // UNIVERSAL BINANCE STREAMING: Subscribe to real-time WebSocket streams for ALL cryptocurrencies
  const subscribeToUpdates = useCallback((symbol: string, interval: string) => {
    console.log(`🌟 UNIVERSAL STREAMING: Setting up ${symbol} ${interval} (Binance-compatible)`);

    // Clear old data when switching symbols
    if (currentSubscription && currentSubscription.symbol !== symbol) {
      console.log(`🧹 Clearing ${currentSubscription.symbol} data, switching to ${symbol}`);
      setCandlestickData([]);
      setLastPrice(0);
    }

    // Clear existing timer
    if (updateTimer) {
      clearInterval(updateTimer);
      setUpdateTimer(null);
    }

    // Track new subscription
    const newSubscription = { symbol, interval };
    let streamingStarted = false;

    console.log(`🎯 BINANCE SUBSCRIPTION: ${symbol} ${interval}`);

    const dataHandler = (newCandle: CandlestickData) => {
      // Verify symbol matches (accept all supported cryptocurrencies)
      const candleSymbol = (newCandle as any).symbol;
      if (candleSymbol && candleSymbol !== symbol) {
        console.warn(`⚠️ REJECTED: ${candleSymbol} != ${symbol}`);
        return;
      }

      console.log(`🎯 LIVE UPDATE: ${symbol} ${interval} = $${newCandle.close} @ ${new Date().toLocaleTimeString()}`);
      updateData(newCandle, interval);
      setError(null);
      
      // Update last price for reference but DO NOT start simulation
      setLastPrice(newCandle.close);
    };

    // Subscribe to ENHANCED WebSocket for ALL crypto products real-time streaming
    console.log(`🚀 ENHANCED SUBSCRIBING: ${symbol} ${interval} - Starting MULTI-PRODUCT WebSocket connection`);
    enhancedWebSocketManager.subscribeMultiProduct(symbol, interval, dataHandler);

    setCurrentSubscription(newSubscription);
    console.log(`✅ SUBSCRIBED: ${symbol} ${interval} - Waiting for live data...`);
  }, [updateData, updateTimer, startUniversalStreaming, currentSubscription]);

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
        enhancedWebSocketManager.unsubscribeProduct(currentSubscription.symbol, currentSubscription.interval);
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