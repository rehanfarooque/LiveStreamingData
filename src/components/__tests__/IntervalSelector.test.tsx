import React from 'react';
import { render, screen, fireEvent } from '@/test/utils';
import IntervalSelector from '../IntervalSelector';

const mockProps = {
  selectedInterval: '1m',
  availableIntervals: ['1s', '5s', '1m', '5m', '15m', '1h', '4h', '1d'],
  onChange: jest.fn(),
};

describe('IntervalSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all available intervals', () => {
    render(<IntervalSelector {...mockProps} />);
    
    expect(screen.getByText('Timeframe:')).toBeInTheDocument();
    expect(screen.getByText('1 Second')).toBeInTheDocument();
    expect(screen.getByText('5 Seconds')).toBeInTheDocument();
    expect(screen.getByText('1 Minute')).toBeInTheDocument();
    expect(screen.getByText('5 Minutes')).toBeInTheDocument();
    expect(screen.getByText('15 Minutes')).toBeInTheDocument();
    expect(screen.getByText('1 Hour')).toBeInTheDocument();
    expect(screen.getByText('4 Hours')).toBeInTheDocument();
    expect(screen.getByText('1 Day')).toBeInTheDocument();
  });

  it('should highlight selected interval', () => {
    render(<IntervalSelector {...mockProps} />);
    
    const selectedButton = screen.getByRole('button', { pressed: true });
    expect(selectedButton).toHaveTextContent('1 Minute');
  });

  it('should call onChange when interval is clicked', () => {
    render(<IntervalSelector {...mockProps} />);
    
    const fiveMinButton = screen.getByText('5 Minutes');
    fireEvent.click(fiveMinButton);
    
    expect(mockProps.onChange).toHaveBeenCalledWith('5m');
  });

  it('should apply correct CSS classes for selected interval', () => {
    render(<IntervalSelector {...mockProps} />);
    
    const selectedButton = screen.getByRole('button', { pressed: true });
    expect(selectedButton).toHaveClass('bg-primary-600', 'text-white');
  });

  it('should apply correct CSS classes for unselected intervals', () => {
    render(<IntervalSelector {...mockProps} />);
    
    const unselectedButton = screen.getByText('5 Minutes');
    expect(unselectedButton).toHaveClass('bg-gray-100', 'text-gray-700');
  });
});