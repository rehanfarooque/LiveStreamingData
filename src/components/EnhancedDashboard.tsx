import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ControlPanel from './ControlPanel';
import PriceChart from './PriceChart';
import AdvancedTradingChart, { ChartType } from './AdvancedTradingChart';
import ChartTypeSelector from './ChartTypeSelector';
import MarketInfo from './MarketInfo';
import ErrorBoundary from './ErrorBoundary';
import OrderBook from './OrderBook';
import LiveTrades from './LiveTrades';
import MultiProductGrid from './MultiProductGrid';
import ProductWatchlist from './ProductWatchlist';
import LiveStreamingGrid from './LiveStreamingGrid';
import MultiProductTest from './MultiProductTest';
import {
  useChartData,
  useWebSocket,
  useUserPreferences
} from '@/contexts';
import { useURLParams, useURLBasedInitialization } from '@/hooks';
import { TradingPair, MarketStats } from '@/types';
import { binanceAPI } from '@/services/binanceApi';
import { SUPPORTED_PAIRS } from '@/utils/constants';
import { throttle } from '@/utils/helpers';

type ViewMode = 'single' | 'multi' | 'streaming' | 'watchlist' | 'test';

const EnhancedDashboard: React.FC = () => {
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
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [selectedPair, setSelectedPair] = useState<TradingPair>(initialPair || defaultPair);
  const [selectedInterval, setSelectedInterval] = useState<string>(initialInterval || defaultInterval);
  const [advancedChartType, setAdvancedChartType] = useState<ChartType>('candlestick');
  const [useAdvancedChart, setUseAdvancedChart] = useState(true); // Use advanced chart by default for better performance
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
    }, 10000),
    []
  );

  // Load initial chart data for single product view
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
        const limit = ['1s', '5s'].includes(interval) ? 60 : 100;
        const klines = await binanceAPI.getKlines(pair.symbol, interval, limit);
        console.log(`✅ Loaded ${klines.length} historical candles for ${interval}`);
        setData(klines);
      } catch (historyError) {
        console.warn('Historical data fetch failed, using WebSocket only:', historyError);
        setData([]);
      }

      setErrorState(null);

      // Load market stats
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

  // Handle product switching from multi-product grid or watchlist
  const handleProductSelect = useCallback((symbolOrPair: string | TradingPair) => {
    let pair: TradingPair;

    if (typeof symbolOrPair === 'string') {
      const foundPair = SUPPORTED_PAIRS.find(p => p.symbol === symbolOrPair);
      if (!foundPair) return;
      pair = foundPair;
    } else {
      pair = symbolOrPair;
    }

    console.log(`🔄 MULTI-PRODUCT: Switching to ${pair.displayName} (${pair.symbol})`);

    // Switch to single view and load the selected product
    setViewMode('single');
    setSelectedPair(pair);
    setData([]); // Clear old data
    loadChartData(pair, selectedInterval);

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({
    //   symbol: pair.symbol,
    //   interval: selectedInterval
    // });

    console.log(`✅ Successfully switched to ${pair.symbol}`);
  }, [selectedInterval, loadChartData, updateURLParams, setData]);

  // Handle crypto product switching (existing logic for single view)
  const handlePairChange = useCallback((pair: TradingPair) => {
    if (pair.symbol === selectedPair.symbol) return;

    console.log(`🔄 BINANCE: Switching to ${pair.displayName} (${pair.symbol})`);

    setData([]);
    setSelectedPair(pair);
    loadChartData(pair, selectedInterval);
    updateMarketStats(pair.symbol);

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({
    //   symbol: pair.symbol,
    //   interval: selectedInterval
    // });

    console.log(`✅ Successfully switched to ${pair.symbol} ${selectedInterval}`);
  }, [selectedPair.symbol, selectedInterval, loadChartData, updateURLParams, updateMarketStats, setData]);

  // Handle timeframe switching
  const handleIntervalChange = useCallback((interval: string) => {
    if (interval === selectedInterval) return;

    console.log(`🔄 BINANCE: Switching to ${interval} timeframe for ${selectedPair.symbol}`);

    setSelectedInterval(interval);
    if (viewMode === 'single') {
      loadChartData(selectedPair, interval);
    }

    // DON'T update URL parameters - keep clean URLs
    // updateURLParams({
    //   symbol: selectedPair.symbol,
    //   interval: interval
    // });

    console.log(`✅ Successfully switched to ${selectedPair.symbol} ${interval}`);
  }, [selectedInterval, selectedPair, loadChartData, updateURLParams, viewMode]);

  // Handle chart type change
  const handleChartTypeChange = useCallback((type: 'candlestick' | 'line' | 'ohlc') => {
    setChartType(type);
  }, [setChartType]);

  // Single effect to handle initial data load
  useEffect(() => {
    if (!isMountedRef.current || isInitializedRef.current) return;

    let currentPair = selectedPair;
    let currentInterval = selectedInterval;
    let shouldLoadData = false;

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

    if (shouldLoadData || currentPair.symbol) {
      console.log('Enhanced Dashboard: Loading data for', currentPair.symbol, currentInterval);
      if (viewMode === 'single') {
        loadChartData(currentPair, currentInterval);
      }
      isInitializedRef.current = true;

      // DON'T update URL parameters - keep clean URLs
      // updateURLParams({
      //   symbol: currentPair.symbol,
      //   interval: currentInterval
      // });
    }
  }, []);

  // Effect to handle data loading when switching back to single view (optimized)
  useEffect(() => {
    if (!isInitializedRef.current || !isMountedRef.current) return;

    if (viewMode === 'single') {
      console.log('Single view: Loading data for', selectedPair.symbol, selectedInterval);
      loadChartData(selectedPair, selectedInterval);
      updateMarketStats(selectedPair.symbol);
    }
  }, [viewMode, selectedPair.symbol, selectedInterval, loadChartData, updateMarketStats]);

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

  // Memoized view mode selector to prevent re-renders
  const ViewModeSelector = useMemo(() => (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setViewMode('single')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          viewMode === 'single'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Single Chart
      </button>
      <button
        onClick={() => setViewMode('multi')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          viewMode === 'multi'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Multi-Product
      </button>
      <button
        onClick={() => setViewMode('streaming')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          viewMode === 'streaming'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        📊 Smooth Stream
      </button>
      <button
        onClick={() => setViewMode('watchlist')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          viewMode === 'watchlist'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Watchlist
      </button>
      <button
        onClick={() => setViewMode('test')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          viewMode === 'test'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        🚀 Test Multi-Product
      </button>
    </div>
  ), [viewMode]);

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
          <div className="flex items-center space-x-4">
            {ViewModeSelector}
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
        </div>

        {/* View-specific content */}
        {viewMode === 'single' && (
          <>
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

              {/* Simple Live Chart */}
              <PriceChart
                data={candlestickData}
                chartType={chartType}
                isLoading={isChartLoading}
                symbol={selectedPair.symbol}
              />
            </div>

            {/* Live Market Data */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <OrderBook symbol={selectedPair.symbol} maxLevels={10} />
              </div>
              <div className="xl:col-span-1">
                <LiveTrades symbol={selectedPair.symbol} maxTrades={20} />
              </div>
              <div className="xl:col-span-1">
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
                      <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedInterval}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chart Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{chartType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Update Mode:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {isConnected ? 'Real-time Streaming' : 'Historical Only'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'multi' && (
          <MultiProductGrid
            onProductSelect={handleProductSelect}
            maxProducts={30}
          />
        )}

        {viewMode === 'streaming' && (
          <LiveStreamingGrid
            onProductSelect={handleProductSelect}
            maxProducts={24}
            updateFrequency="normal"
          />
        )}

        {viewMode === 'watchlist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ProductWatchlist
                onProductSelect={handleProductSelect}
                selectedProduct={selectedPair.symbol}
              />
            </div>
            <div className="lg:col-span-2">
              <MultiProductGrid
                onProductSelect={handleProductSelect}
                maxProducts={15}
              />
            </div>
          </div>
        )}

        {viewMode === 'test' && (
          <MultiProductTest />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedDashboard;