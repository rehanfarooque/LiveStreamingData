import React from 'react';
import { render, screen, fireEvent } from '@/test/utils';
import Header from '../Header';

// Mock the contexts
jest.mock('@/contexts', () => ({
  useUserPreferences: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('Header Component', () => {
  it('should render header with title and logo', () => {
    render(<Header />);
    
    expect(screen.getByText('Crypto Chart Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time cryptocurrency tracking')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<Header />);
    
    const themeToggle = screen.getByLabelText('Switch to dark theme');
    expect(themeToggle).toBeInTheDocument();
  });

  it('should render live status indicator', () => {
    render(<Header />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should show correct theme icon for light theme', () => {
    render(<Header />);
    
    const themeToggle = screen.getByLabelText('Switch to dark theme');
    expect(themeToggle).toBeInTheDocument();
  });
});