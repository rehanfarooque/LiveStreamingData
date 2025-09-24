import React from 'react';
import { render, screen } from '@/test/utils';
import PriceChart from '../PriceChart';
import { mockCandlestickData } from '@/test/utils';

const mockProps = {
  data: mockCandlestickData,
  chartType: 'candlestick' as const,
  isLoading: false,
  symbol: 'BTCUSDT',
};

describe('PriceChart Component', () => {
  it('should render chart when data is available', () => {
    render(<PriceChart {...mockProps} />);
    
    // Chart container should be present
    expect(document.querySelector('.chart-container')).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    render(<PriceChart {...mockProps} isLoading={true} />);
    
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    // Loading spinner should be present
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should show no data message when data is empty', () => {
    render(<PriceChart {...mockProps} data={[]} />);
    
    expect(screen.getByText('No chart data available')).toBeInTheDocument();
    expect(screen.getByText('Please check your connection and try again')).toBeInTheDocument();
  });

  it('should render chart for line type', () => {
    render(<PriceChart {...mockProps} chartType="line" />);
    
    // Chart container should be present
    expect(document.querySelector('.chart-container')).toBeInTheDocument();
  });

  it('should handle zoom change callback', () => {
    const mockOnZoomChange = jest.fn();
    render(<PriceChart {...mockProps} onZoomChange={mockOnZoomChange} />);
    
    // Chart container should be present
    expect(document.querySelector('.chart-container')).toBeInTheDocument();
  });
});