import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UserPreferencesProvider, useUserPreferences } from '../UserPreferencesContext';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UserPreferencesProvider>{children}</UserPreferencesProvider>
);

describe('UserPreferencesContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    expect(result.current.theme).toBe('light');
    expect(result.current.chartType).toBe('candlestick');
    expect(result.current.defaultInterval).toBe('1s');
    expect(result.current.defaultPair).toEqual({
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      displayName: 'Bitcoin / USDT',
    });
  });

  it('should update theme and persist to localStorage', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('crypto-dashboard-theme', 'dark');
  });

  it('should update chart type and persist to localStorage', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    act(() => {
      result.current.setChartType('line');
    });

    expect(result.current.chartType).toBe('line');
    expect(localStorage.setItem).toHaveBeenCalledWith('crypto-dashboard-chart-type', 'line');
  });

  it('should update default interval and persist to localStorage', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    act(() => {
      result.current.setDefaultInterval('5m');
    });

    expect(result.current.defaultInterval).toBe('5m');
    expect(localStorage.setItem).toHaveBeenCalledWith('crypto-dashboard-default-interval', '5m');
  });

  it('should load saved preferences from localStorage', () => {
    localStorage.getItem = jest.fn((key) => {
      switch (key) {
        case 'crypto-dashboard-theme':
          return 'dark';
        case 'crypto-dashboard-chart-type':
          return 'line';
        case 'crypto-dashboard-default-interval':
          return '5m';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.chartType).toBe('line');
    expect(result.current.defaultInterval).toBe('5m');
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.getItem = jest.fn((key) => {
      switch (key) {
        case 'crypto-dashboard-theme':
          return 'invalid-theme';
        case 'crypto-dashboard-chart-type':
          return 'invalid-chart-type';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    expect(result.current.theme).toBe('light'); // Should fallback to default
    expect(result.current.chartType).toBe('candlestick'); // Should fallback to default
  });
});