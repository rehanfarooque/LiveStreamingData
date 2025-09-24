import React, { useState, useEffect, useCallback, useRef } from 'react';
import ControlPanel from './ControlPanel';
import PriceChart from './PriceChart';
import MarketInfo from './MarketInfo';
import ErrorBoundary from './ErrorBoundary';
import OrderBook from './OrderBook';
import LiveTrades from './LiveTrades';
import { 
  useChartData, 
  useWebSocket, 
  useUserPreferences 
} from '@/contexts';
import { useURLParams, useURLBasedInitialization } from '@/hooks';
import { TradingPair, MarketStats } from '@/types';
import { binanceAPI } from '@/services/binanceApi';
// Removed demo data - using only real Binance data
import { throttle } from '@/utils/helpers';

const Dashboard: React.FC = () => {
  // Context hooks
  const {
    candlestickData,
    isLoading: isChartLoading,
    error: chartError,
    setData,
    subscribeToUpdates,
    setLoadingState,
    setErrorState
  } = useChartData();

  const { isConnected, connectionStatus } = useWebSocket();
  const { defaultPair, defaultInterval, chartType, setChartType } = useUserPreferences();

  // URL parameter hooks
  const { updateURLParams } = useURLParams();
  const { initialPair, initialInterval } = useURLBasedInitialization();

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // Local state
  const [selectedPair, setSelectedPair] = useState<TradingPair>(initialPair || defaultPair);
  const [selectedInterval, setSelectedInterval] = useState<string>(initialInterval || defaultInterval);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Cleanup mounted ref
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Market stats update with reduced throttling for better responsiveness
  const updateMarketStats = useCallback(
    throttle(async (symbol: string) => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        console.log(`📊 Fetching market stats for ${symbol}`);
        const stats = await binanceAPI.get24hrStats(symbol);
        setMarketStats(stats);
        console.log(`✅ Market stats loaded for ${symbol}:`, stats.lastPrice);
      } catch (error) {
        console.error('Failed to fetch market stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load market statistics';
        setStatsError(errorMessage);
      } finally {
        setIsLoadingStats(false);
      }
    }, 10000), // Reduced throttle to 10 seconds for better responsiveness
    []
  );

  // Load initial chart data with optimized approach for all timeframes
  const loadChartData = useCallback(async (pair: TradingPair, interval: string) => {
    try {
      setLoadingState(true);
      setErrorState(null);

      console.log(`🎯 Loading chart data for ${pair.symbol} ${interval}`);

      // Start real-time WebSocket subscription immediately for better UX
      console.log(`🚀 Starting REAL Binance WebSocket for ${pair.symbol} ${interval}`);
      subscribeToUpdates(pair.symbol, interval);

      // Fetch historical data in parallel
      console.log(`📊 Fetching historical data for ${pair.symbol} ${interval}`);
      try {
        const limit = ['1s', '5s'].includes(interval) ? 60 : 100; // Fewer candles for fast timeframes
        const klines = await binanceAPI.getKlines(pair.symbol, interval, limit);
        console.log(`✅ Loaded ${klines.length} historical candles for ${interval}`);
        setData(klines);
      } catch (historyError) {
        console.warn('Historical data fetch failed, using WebSocket only:', historyError);
        setData([]); // Start with empty data, WebSocket will populate
      }

      setErrorState(null); // Clear any errors

      // Load market stats (optional)
      try {
        updateMarketStats(pair.symbol);
      } catch (statsError) {
        console.warn('Market stats fetch failed:', statsError);
      }

    } catch (error) {
      console.error('Failed to setup chart:', error);
      setErrorState('Failed to connect to Binance. Please check your internet connection.');

      // Still try WebSocket even if REST API fails
      try {
        subscribeToUpdates(pair.symbol, interval);
      } catch (wsError) {
        console.error('WebSocket also failed:', wsError);
      }
    } finally {
      setLoadingState(false);
    }
  }, [setData, subscribeToUpdates, setLoadingState, setErrorState, updateMarketStats]);

  // Handle crypto product switching (BTC, ETH, BNB, ADA, SOL, DOT, LINK, MATIC, AVAX, LTC)
  const handlePairChange = useCallback((pair: TradingPair) => {
    if (pair.symbol === selectedPair.symbol) return; // Prevent unnecessary changes

    console.log(`🔄 BINANCE: Switching to ${pair.displayName} (${pair.symbol})`);

    // CRITICAL: Clear old chart data immediately when switching products
    console.log(`🧹 Clearing old ${selectedPair.symbol} chart data`);
    setData([]); // Clear chart data to prevent BTC showing on ETH charts
    
    setSelectedPair(pair);
    loadChartData(pair, selectedInterval);

    // Immediately fetch market stats for the new crypto
    updateMarketStats(pair.symbol);

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({ symbol: pair.symbol, interval: selectedInterval });

    console.log(`✅ Successfully switched to ${pair.symbol} ${selectedInterval}`);
  }, [selectedPair.symbol, selectedInterval, loadChartData, updateMarketStats, setData]);

  // Handle timeframe switching (1s, 5s, 1m, 5m, 15m, 1h, 4h, 1d)
  const handleIntervalChange = useCallback((interval: string) => {
    if (interval === selectedInterval) return; // Prevent unnecessary changes

    console.log(`🔄 BINANCE: Switching to ${interval} timeframe for ${selectedPair.symbol}`);

    setSelectedInterval(interval);
    loadChartData(selectedPair, interval);

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({ symbol: selectedPair.symbol, interval: interval });

    console.log(`✅ Successfully switched to ${selectedPair.symbol} ${interval}`);
  }, [selectedInterval, selectedPair, loadChartData]);

  // Handle chart type change
  const handleChartTypeChange = useCallback((type: 'candlestick' | 'line' | 'ohlc') => {
    setChartType(type);
  }, [setChartType]);

  // Single effect to handle initial data load and state synchronization
  useEffect(() => {
    if (!isMountedRef.current || isInitializedRef.current) return;

    let currentPair = selectedPair;
    let currentInterval = selectedInterval;
    let shouldLoadData = false;

    // Update state if initial values from URL are available
    if (initialPair && initialPair.symbol !== selectedPair.symbol) {
      currentPair = initialPair;
      setSelectedPair(initialPair);
      shouldLoadData = true;
    }
    if (initialInterval && initialInterval !== selectedInterval) {
      currentInterval = initialInterval;
      setSelectedInterval(initialInterval);
      shouldLoadData = true;
    }

    // Load data if pair or interval changed or if it's initial load
    if (shouldLoadData || currentPair.symbol) {
      console.log('Dashboard effect: Loading data for', currentPair.symbol, currentInterval);
      loadChartData(currentPair, currentInterval);
      isInitializedRef.current = true;

      // DON'T update URL parameters - keep clean URLs
      // updateURLParams({
      //   symbol: currentPair.symbol,
      //   interval: currentInterval
      // });
    }
  }, []);  // Only run once on mount

  // Effect to handle data loading when pair/interval changes after initialization
  useEffect(() => {
    if (!isInitializedRef.current || !isMountedRef.current) return;

    console.log('Data loading effect: Loading data for', selectedPair.symbol, selectedInterval);
    loadChartData(selectedPair, selectedInterval);

    // Update market stats immediately when switching products
    updateMarketStats(selectedPair.symbol);

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({
    //   symbol: selectedPair.symbol,
    //   interval: selectedInterval
    // });
  }, [selectedPair.symbol, selectedInterval]);

  // Separate effect for WebSocket subscription management
  useEffect(() => {
    if (!isMountedRef.current || !selectedPair.symbol || !selectedInterval) return;

    console.log('Ensuring WebSocket subscription for', selectedPair.symbol, selectedInterval);
    subscribeToUpdates(selectedPair.symbol, selectedInterval);
  }, [selectedPair.symbol, selectedInterval]);  // Remove subscribeToUpdates from deps to prevent loops

  // Enhanced connection handling with WebSocket reset
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (connectionStatus === 'error' && selectedPair.symbol) {
      console.log('🔄 WebSocket error detected, attempting reset...');
      // Give the WebSocket manager time to reset
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          subscribeToUpdates(selectedPair.symbol, selectedInterval);
        }
      }, 10000); // Wait 10 seconds before retry

      return () => clearTimeout(timeoutId);
    }
  }, [connectionStatus, selectedPair.symbol, selectedInterval]);  // Removed problematic dependencies

  // Periodic market stats refresh
  useEffect(() => {
    if (!isMountedRef.current) return;

    const intervalId = setInterval(() => {
      if (isMountedRef.current && selectedPair.symbol && !isLoadingStats) {
        updateMarketStats(selectedPair.symbol);
      }
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [selectedPair.symbol, isLoadingStats, updateMarketStats]);

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Connection Status Bar */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {connectionStatus === 'connected' ? 'Live Data Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Disconnected'}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            {chartError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                Chart: {chartError}
              </div>
            )}
            {statsError && (
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                Stats: {statsError}
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <ControlPanel
          selectedPair={selectedPair}
          selectedInterval={selectedInterval}
          chartType={chartType}
          onPairChange={handlePairChange}
          onIntervalChange={handleIntervalChange}
          onChartTypeChange={handleChartTypeChange}
        />

        {/* Market Information */}
        <MarketInfo
          currentPrice={
            // Use live data from WebSocket if available, fallback to REST API data
            candlestickData.length > 0
              ? candlestickData[candlestickData.length - 1].close
              : (marketStats ? parseFloat(marketStats.lastPrice) : 0)
          }
          priceChange={marketStats ? parseFloat(marketStats.priceChange) : 0}
          priceChangePercent={marketStats ? parseFloat(marketStats.priceChangePercent) : 0}
          volume={marketStats ? parseFloat(marketStats.volume) : 0}
          isLoading={isLoadingStats && candlestickData.length === 0}
        />

        {/* Price Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedPair.displayName} - {selectedInterval}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Data Points: {candlestickData.length}</span>
                {candlestickData.length > 0 && (
                  <span>
                    Last Update: {new Date(candlestickData[candlestickData.length - 1]?.timestamp || 0).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <PriceChart
            data={candlestickData}
            chartType={chartType}
            isLoading={isChartLoading}
            symbol={selectedPair.symbol}
          />
        </div>

        {/* Live Market Data */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Order Book */}
          <div className="xl:col-span-1">
            <OrderBook
              symbol={selectedPair.symbol}
              maxLevels={10}
            />
          </div>

          {/* Live Trades */}
          <div className="xl:col-span-1">
            <LiveTrades
              symbol={selectedPair.symbol}
              maxTrades={20}
            />
          </div>

          {/* Trading Info */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trading Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPair.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Asset:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPair.baseAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Quote Asset:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPair.quoteAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedInterval}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Chart Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Chart Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{chartType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                    <span className="font-medium text-gray-900 dark:text-white">Binance API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Update Mode:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isConnected ? 'Real-time Streaming' : 'Historical Only'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Refresh:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;