import React from 'react';
import { render, screen } from '@/test/utils';
import MarketInfo from '../MarketInfo';

const mockProps = {
  currentPrice: 50000,
  priceChange: 1000,
  priceChangePercent: 2.5,
  volume: 1500000,
  isLoading: false,
};

describe('MarketInfo Component', () => {
  it('should render market information correctly', () => {
    render(<MarketInfo {...mockProps} />);
    
    expect(screen.getByText('Current Price')).toBeInTheDocument();
    expect(screen.getByText('$50000.0000')).toBeInTheDocument();
    
    expect(screen.getByText('24h Change')).toBeInTheDocument();
    expect(screen.getByText('$1000.0000')).toBeInTheDocument();
    
    expect(screen.getByText('24h Change %')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
    
    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('1.50M')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<MarketInfo {...mockProps} isLoading={true} />);
    
    // Loading skeleton elements should be present
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display negative price change correctly', () => {
    const negativeProps = {
      ...mockProps,
      priceChange: -500,
      priceChangePercent: -1.25,
    };
    
    render(<MarketInfo {...negativeProps} />);
    
    expect(screen.getByText('$500.0000')).toBeInTheDocument();
    expect(screen.getByText('-1.25%')).toBeInTheDocument();
  });

  it('should apply correct styling for positive price change', () => {
    render(<MarketInfo {...mockProps} />);
    
    const priceElement = screen.getByText('$50000.0000');
    expect(priceElement).toHaveClass('text-bull');
  });

  it('should apply correct styling for negative price change', () => {
    const negativeProps = {
      ...mockProps,
      priceChange: -500,
      priceChangePercent: -1.25,
    };
    
    render(<MarketInfo {...negativeProps} />);
    
    const priceElement = screen.getByText('$50000.0000');
    expect(priceElement).toHaveClass('text-bear');
  });
});