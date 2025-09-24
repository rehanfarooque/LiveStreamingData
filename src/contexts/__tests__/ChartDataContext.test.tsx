import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ChartDataProvider, useChartData } from '../ChartDataContext';
import { mockCandlestickData } from '@/test/utils';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChartDataProvider>{children}</ChartDataProvider>
);

describe('ChartDataContext', () => {
  it('should provide default values', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    expect(result.current.candlestickData).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should set chart data', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setData(mockCandlestickData);
    });

    expect(result.current.candlestickData).toEqual(mockCandlestickData);
  });

  it('should update existing candle data', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setData([mockCandlestickData[0]]);
    });

    const updatedCandle = {
      ...mockCandlestickData[0],
      close: 51000,
    };

    act(() => {
      result.current.updateData(updatedCandle);
    });

    expect(result.current.candlestickData[0].close).toBe(51000);
  });

  it('should add new candle data', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setData([mockCandlestickData[0]]);
    });

    act(() => {
      result.current.updateData(mockCandlestickData[1]);
    });

    expect(result.current.candlestickData).toHaveLength(2);
    expect(result.current.candlestickData[1]).toEqual(mockCandlestickData[1]);
  });

  it('should clear all data', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setData(mockCandlestickData);
    });

    expect(result.current.candlestickData).toHaveLength(3);

    act(() => {
      result.current.clearData();
    });

    expect(result.current.candlestickData).toEqual([]);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setLoadingState(true);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    act(() => {
      result.current.setErrorState('Test error');
    });

    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should limit data points for performance', () => {
    const { result } = renderHook(() => useChartData(), { wrapper });

    // Create data exceeding MAX_DATA_POINTS
    const largeDataSet = Array.from({ length: 600 }, (_, i) => ({
      ...mockCandlestickData[0],
      timestamp: mockCandlestickData[0].timestamp + i * 60000,
    }));

    act(() => {
      result.current.setData(largeDataSet.slice(0, 500));
    });

    // Add more data points
    largeDataSet.slice(500).forEach((candle) => {
      act(() => {
        result.current.updateData(candle);
      });
    });

    // Should be limited to MAX_DATA_POINTS (500)
    expect(result.current.candlestickData.length).toBeLessThanOrEqual(500);
  });
});