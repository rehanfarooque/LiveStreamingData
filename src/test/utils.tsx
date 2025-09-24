import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { WebSocketProvider, ChartDataProvider, UserPreferencesProvider } from '@/contexts';

// Mock providers for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserPreferencesProvider>
      <WebSocketProvider>
        <ChartDataProvider>
          {children}
        </ChartDataProvider>
      </WebSocketProvider>
    </UserPreferencesProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockCandlestickData = [
  {
    timestamp: 1640995200000,
    open: 50000,
    high: 51000,
    low: 49500,
    close: 50500,
    volume: 100.5,
  },
  {
    timestamp: 1640995260000,
    open: 50500,
    high: 51500,
    low: 50000,
    close: 51200,
    volume: 95.3,
  },
  {
    timestamp: 1640995320000,
    open: 51200,
    high: 52000,
    low: 51000,
    close: 51800,
    volume: 120.7,
  },
];

export const mockTradingPair = {
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  displayName: 'Bitcoin / USDT',
};

export const mockMarketStats = {
  symbol: 'BTCUSDT',
  priceChange: '1000.00',
  priceChangePercent: '2.00',
  weightedAvgPrice: '50500.00',
  prevClosePrice: '49500.00',
  lastPrice: '50500.00',
  lastQty: '0.01',
  bidPrice: '50400.00',
  askPrice: '50600.00',
  openPrice: '49500.00',
  highPrice: '52000.00',
  lowPrice: '49000.00',
  volume: '1000.00',
  quoteVolume: '50500000.00',
  openTime: 1640995200000,
  closeTime: 1640995260000,
  firstId: 1,
  lastId: 100,
  count: 100,
};