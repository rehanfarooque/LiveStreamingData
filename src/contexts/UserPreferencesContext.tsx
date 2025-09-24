import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferencesContextType, TradingPair } from '@/types';
import { SUPPORTED_PAIRS } from '@/utils/constants';

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  THEME: 'crypto-dashboard-theme',
  DEFAULT_PAIR: 'crypto-dashboard-default-pair',
  DEFAULT_INTERVAL: 'crypto-dashboard-default-interval',
  CHART_TYPE: 'crypto-dashboard-chart-type'
};

export function UserPreferencesProvider({ children }: UserPreferencesProviderProps) {
  // Initialize state with defaults
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [defaultPair, setDefaultPairState] = useState<TradingPair>(SUPPORTED_PAIRS[0]);
  const [defaultInterval, setDefaultIntervalState] = useState<string>('1s');
  const [chartType, setChartTypeState] = useState<'candlestick' | 'line' | 'ohlc'>('candlestick');

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      // Load theme
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme);
        // Apply theme to document
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        setThemeState(systemTheme);
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      }

      // Load default pair
      const savedPair = localStorage.getItem(STORAGE_KEYS.DEFAULT_PAIR);
      if (savedPair) {
        try {
          const parsedPair = JSON.parse(savedPair) as TradingPair;
          // Validate the pair exists in supported pairs
          const validPair = SUPPORTED_PAIRS.find(p => p.symbol === parsedPair.symbol);
          if (validPair) {
            setDefaultPairState(validPair);
          }
        } catch (error) {
          console.warn('Failed to parse saved trading pair:', error);
        }
      }

      // Load default interval
      const savedInterval = localStorage.getItem(STORAGE_KEYS.DEFAULT_INTERVAL);
      if (savedInterval) {
        setDefaultIntervalState(savedInterval);
      }

      // Load chart type
      const savedChartType = localStorage.getItem(STORAGE_KEYS.CHART_TYPE) as 'candlestick' | 'line' | 'ohlc';
      if (savedChartType && (savedChartType === 'candlestick' || savedChartType === 'line' || savedChartType === 'ohlc')) {
        setChartTypeState(savedChartType);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }, []);

  // Set theme with persistence
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Set default pair with persistence
  const setDefaultPair = (pair: TradingPair) => {
    setDefaultPairState(pair);
    localStorage.setItem(STORAGE_KEYS.DEFAULT_PAIR, JSON.stringify(pair));
  };

  // Set default interval with persistence
  const setDefaultInterval = (interval: string) => {
    setDefaultIntervalState(interval);
    localStorage.setItem(STORAGE_KEYS.DEFAULT_INTERVAL, interval);
  };

  // Set chart type with persistence
  const setChartType = (type: 'candlestick' | 'line' | 'ohlc') => {
    setChartTypeState(type);
    localStorage.setItem(STORAGE_KEYS.CHART_TYPE, type);
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a theme
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value: UserPreferencesContextType = {
    theme,
    defaultPair,
    defaultInterval,
    chartType,
    setTheme,
    setDefaultPair,
    setDefaultInterval,
    setChartType
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}